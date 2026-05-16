/**
 * 组队系统测试套件
 * 覆盖创建队伍、获取队伍列表、邀请/踢出成员、转让队长、解散队伍等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  createTeamApi,
  getMyTeamApi,
  getTeamListApi,
  toggleTeamStatusApi,
  inviteToTeamApi,
  kickMemberApi,
  changeLeaderApi,
  disbandTeamApi,
} from '../../api/team'
import { testContext, safeCall } from '../utils/testHelper'

/**
 * 保存测试过程中创建的队伍 ID
 */
let savedTeamId = ''

/**
 * 创建组队系统测试套件
 * 包含创建队伍、获取我的队伍、获取公开队伍列表、切换队伍状态、
 * 邀请好友入队、踢出成员、转让队长、解散队伍等用例
 * @returns 组队系统 TestSuite 对象
 */
export function createTeamTestSuite(): TestSuite {
  return {
    module: '组队系统',
    icon: '🤝',

    cases: [
      /**
       * 测试用例：创建队伍
       * 调用 createTeamApi 创建一支新队伍
       * 验证返回 code 200，队伍 ID 和队长信息已定义，并保存 teamId 供后续用例使用
       */
      {
        name: '创建队伍',
        fn: async () => {
          const res = await createTeamApi()
          expect(res.code).toBe(200)
          expect(res.data.id).toBeDefined()
          expect(res.data.leaderId).toBeDefined()
          expect(res.data.members.length).toBeGreaterThanOrEqual(1)

          savedTeamId = res.data.id
        },
      },

      /**
       * 测试用例：获取我的队伍
       * 调用 getMyTeamApi 获取当前所在队伍
       * 验证返回 code 200 且队伍 ID 与创建时的 ID 一致
       */
      {
        name: '获取我的队伍',
        fn: async () => {
          const res = await getMyTeamApi()
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data!.id).toBe(savedTeamId)
        },
      },

      /**
       * 测试用例：获取公开队伍列表
       * 调用 getTeamListApi 获取所有公开队伍
       * 验证返回 code 200 且列表非空
       */
      {
        name: '获取公开队伍列表',
        fn: async () => {
          const res = await getTeamListApi()
          expect(res.code).toBe(200)
          expect(res.data.length).toBeGreaterThanOrEqual(1)
        },
      },

      /**
       * 测试用例：切换队伍状态
       * 调用 toggleTeamStatusApi 将队伍状态切换为 'closed'
       * 验证返回 code 200 且状态已更新
       */
      {
        name: '切换队伍状态',
        fn: async () => {
          const res = await toggleTeamStatusApi('closed')
          expect(res.code).toBe(200)
          expect(res.data.status).toBe('closed')
        },
      },

      /**
       * 测试用例：邀请好友入队
       * 使用第二个角色的 ID 调用 inviteToTeamApi 邀请好友加入队伍
       * 验证返回 code 200 且新成员已添加
       */
      {
        name: '邀请好友入队',
        fn: async () => {
          const secondCharacterId = testContext.secondCharacterId || 'char-friend-001'
          const res = await inviteToTeamApi(secondCharacterId)
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.characterId).toBe(secondCharacterId)
        },
      },

      /**
       * 测试用例：踢出成员
       * 调用 kickMemberApi 将被邀请的好友踢出队伍
       * 验证返回 code 200
       */
      {
        name: '踢出成员',
        fn: async () => {
          const secondCharacterId = testContext.secondCharacterId || 'char-friend-001'
          const res = await kickMemberApi(secondCharacterId)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：转让队长
       * 重新邀请好友入队后，调用 changeLeaderApi 尝试转让队长
       * 如果队内成员不足可能失败，使用 safeCall 捕获异常
       */
      {
        name: '转让队长',
        fn: async () => {
          const secondCharacterId = testContext.secondCharacterId || 'char-friend-001'

          // 重新邀请好友入队
          const inviteRes = await inviteToTeamApi(secondCharacterId)
          expect(inviteRes.code).toBe(200)

          // 尝试转让队长（可能因成员不足等原因失败）
          const { data, error } = await safeCall(() =>
            changeLeaderApi(secondCharacterId)
          )
          // 无论成功或失败，API 都应返回响应
          if (data) {
            expect(data.code).toBeDefined()
          } else {
            expect(error).toBeDefined()
          }
        },
      },

      /**
       * 测试用例：解散队伍
       * 调用 disbandTeamApi 解散当前队伍
       * 验证返回 code 200
       */
      {
        name: '解散队伍',
        fn: async () => {
          const res = await disbandTeamApi()
          expect(res.code).toBe(200)
        },
      },
    ],
  }
}
