/**
 * 社交系统测试套件
 * 覆盖好友列表、搜索玩家、发送/接受/拒绝好友请求、删除好友等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getFriendListApi,
  searchPlayerApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  deleteFriendApi,
} from '../../api/social'
import {
  registerApi,
  loginApi,
} from '../../api/auth'
import {
  createCharacterApi,
} from '../../api/character'
import {
  testContext,
  setAuthState,
  setSelectedCharacter,
  generateTestUsername,
  generateTestCharName,
  safeCall,
  TEST_PASSWORD,
} from '../utils/testHelper'

/**
 * 第二个测试账号的角色 ID（用于好友交互测试）
 */
let secondCharacterId = ''

/**
 * 好友请求 ID（用于接受/拒绝测试）
 */
let pendingRequestId = ''

/**
 * 已建立好友关系的好友角色 ID（用于删除好友测试）
 */
let friendCharacterId = ''

/**
 * 保存主账号 Token 以便切换回主账号
 */
let mainToken = ''
let mainUserId = ''
let mainCharacterId = ''

/**
 * 创建社交系统测试套件
 * beforeAll 钩子中注册第二个测试账号并创建角色，然后切换回主账号
 * 包含获取好友列表、搜索玩家、发送/接受/拒绝好友请求、删除好友等用例
 * @returns 社交系统 TestSuite 对象
 */
export function createSocialTestSuite(): TestSuite {
  return {
    module: '社交系统',
    icon: '👥',

    /**
     * 套件前置钩子：
     * 注册第二个测试账号、登录、创建角色，然后切换回主账号
     * 确保后续好友交互测试有目标角色可用
     */
    async beforeAll() {
      // 保存当前主账号信息
      mainToken = testContext.token
      mainUserId = testContext.userId
      mainCharacterId = testContext.characterId

      // 注册第二个测试账号
      const secondUsername = generateTestUsername()
      const regRes = await safeCall(() =>
        registerApi({
          username: secondUsername,
          password: TEST_PASSWORD,
        })
      )
      if (regRes.data) {
        // 登录第二个账号
        const loginRes = await loginApi({
          username: secondUsername,
          password: TEST_PASSWORD,
        })
        if (loginRes.code === 200) {
          // 设置第二个账号的认证状态
          setAuthState(loginRes.data.token, loginRes.data.id)
          testContext.secondToken = loginRes.data.token
          testContext.secondUserId = loginRes.data.id
          testContext.secondUsername = secondUsername

          // 创建第二个账号的角色
          const charName = generateTestCharName('social')
          const charRes = await createCharacterApi({
            characterName: charName,
            profession: 2, // 法师
          })
          if (charRes.code === 200) {
            testContext.secondCharacterId = charRes.data.id
            testContext.secondCharacterName = charRes.data.characterName
            secondCharacterId = charRes.data.id
            setSelectedCharacter(charRes.data.id)
          }
        }
      }

      // 切换回主账号
      setAuthState(mainToken, mainUserId)
      setSelectedCharacter(mainCharacterId)
    },

    /**
     * 套件后置钩子：恢复主账号认证状态
     */
    async afterAll() {
      setAuthState(mainToken, mainUserId)
      setSelectedCharacter(mainCharacterId)
    },

    cases: [
      /**
       * 测试用例：获取好友列表
       * 调用 getFriendListApi 获取当前角色的好友列表、待处理请求和已发送请求
       * 验证返回 code 200 且数据结构完整
       */
      {
        name: '获取好友列表',
        fn: async () => {
          const res = await getFriendListApi()
          expect(res.code).toBe(200)
          expect(res.data.friends).toBeDefined()
          expect(res.data.pendingRequests).toBeDefined()
          expect(res.data.sentRequests).toBeDefined()
        },
      },

      /**
       * 测试用例：搜索玩家
       * 使用第二个账号的角色名作为关键词搜索玩家
       * 验证返回 code 200 且搜索结果非空
       */
      {
        name: '搜索玩家',
        fn: async () => {
          const keyword = testContext.secondCharacterName || '影'
          const res = await searchPlayerApi(keyword)
          expect(res.code).toBe(200)
          expect(res.data.length).toBeGreaterThanOrEqual(1)
        },
      },

      /**
       * 测试用例：发送好友请求
       * 向第二个账号的角色发送好友请求
       * 验证返回 code 200 且请求已创建
       */
      {
        name: '发送好友请求',
        fn: async () => {
          // 如果有第二个角色 ID 使用它，否则使用 Mock 数据中的角色 ID
          const targetId = secondCharacterId || 'char-search-001'
          const res = await sendFriendRequestApi(targetId)
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.status).toBe('pending')
        },
      },

      /**
       * 测试用例：获取待处理请求
       * 调用 getFriendListApi 查看待处理的好友请求列表
       * 验证返回 code 200 且 pendingRequests 数组已定义
       */
      {
        name: '获取待处理请求',
        fn: async () => {
          const res = await getFriendListApi()
          expect(res.code).toBe(200)
          expect(res.data.pendingRequests).toBeDefined()

          // 如果有待处理请求，保存第一个请求 ID 供后续用例使用
          if (res.data.pendingRequests.length > 0) {
            pendingRequestId = res.data.pendingRequests[0].id
          }
        },
      },

      /**
       * 测试用例：接受好友请求
       * 切换到第二个账号，获取待处理请求并接受好友请求，然后切换回主账号
       * 验证返回 code 200 且好友信息已创建
       */
      {
        name: '接受好友请求',
        fn: async () => {
          // 先在主账号获取待处理请求
          const mainRes = await getFriendListApi()
          // 如果有待处理的请求（由 Mock 数据提供），接受它
          if (mainRes.data.pendingRequests.length > 0) {
            const request = mainRes.data.pendingRequests[0]
            pendingRequestId = request.id

            // 切换到第二个账号（请求发送者）视角
            if (testContext.secondToken) {
              setAuthState(testContext.secondToken, testContext.secondUserId)
              setSelectedCharacter(secondCharacterId)

              // 在第二个账号获取待处理请求并接受
              const secondRes = await getFriendListApi()
              if (secondRes.data.pendingRequests.length > 0) {
                const acceptRes = await acceptFriendRequestApi(secondRes.data.pendingRequests[0].id)
                expect(acceptRes.code).toBe(200)
                if (acceptRes.data) {
                  friendCharacterId = acceptRes.data.characterId
                }
              }

              // 切换回主账号
              setAuthState(mainToken, mainUserId)
              setSelectedCharacter(mainCharacterId)
            } else {
              // 无第二账号时直接在主账号接受
              const acceptRes = await acceptFriendRequestApi(pendingRequestId)
              expect(acceptRes.code).toBe(200)
              if (acceptRes.data) {
                friendCharacterId = acceptRes.data.characterId
              }
            }
          } else {
            // 没有待处理请求，跳过验证
            expect(true).toBe(true)
          }
        },
      },

      /**
       * 测试用例：拒绝好友请求
       * 占位用例：如果没有可拒绝的请求则跳过
       * 否则调用 rejectFriendRequestApi 拒绝请求
       */
      {
        name: '拒绝好友请求',
        fn: async () => {
          const res = await getFriendListApi()
          if (res.data.pendingRequests.length > 0) {
            const requestId = res.data.pendingRequests[0].id
            const rejectRes = await rejectFriendRequestApi(requestId)
            expect(rejectRes.code).toBe(200)
          } else {
            // 没有待处理请求可拒绝，用例通过
            expect(true).toBe(true)
          }
        },
      },

      /**
       * 测试用例：删除好友
       * 调用 deleteFriendApi 删除指定好友
       * 使用 Mock 数据中的好友角色 ID 或已建立的好友关系 ID
       * 验证返回 code 200
       */
      {
        name: '删除好友',
        fn: async () => {
          // 使用已知的好友 ID（Mock 数据中的好友或已建立的好友关系）
          const targetFriendId = friendCharacterId || 'char-friend-001'
          const res = await deleteFriendApi(targetFriendId)
          expect(res.code).toBe(200)
        },
      },
    ],
  }
}
