/**
 * 认证系统测试套件
 * 覆盖注册、登录、用户名可用性检测等认证流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  loginApi,
  registerApi,
  checkUsernameApi,
} from '../../api/auth'
import {
  testContext,
  resetTestContext,
  clearAuthState,
  setAuthState,
  generateTestUsername,
  safeCall,
  TEST_PASSWORD,
} from '../utils/testHelper'

/**
 * 创建认证系统测试套件
 * 包含注册（新用户/重复用户名/空用户名）、登录（正确/错误密码/不存在用户）、用户名可用性检测等用例
 * @returns 认证系统 TestSuite 对象
 */
export function createAuthTestSuite(): TestSuite {
  return {
    module: '认证系统',
    icon: '🔐',

    /**
     * 套件前置钩子：重置上下文、清除认证状态、生成测试用户名
     */
    async beforeAll() {
      resetTestContext()
      clearAuthState()
      testContext.username = generateTestUsername()
    },

    /**
     * 套件后置钩子：不在此处清除认证状态
     * token 需要保留给后续模块（角色、背包等）使用
     * 最终清理由 TestView 的 all-done 事件处理
     */
    async afterAll() {
      // 保留 token 给后续模块
    },

    cases: [
      /**
       * 测试用例：注册新用户
       * 使用随机生成的用户名和固定密码注册，验证返回 code 200
       */
      {
        name: '注册 - 新用户',
        fn: async () => {
          const res = await registerApi({
            username: testContext.username,
            password: TEST_PASSWORD,
          })
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：重复用户名注册
       * 使用已注册的用户名再次注册，使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '注册 - 重复用户名',
        fn: async () => {
          const { error } = await safeCall(() =>
            registerApi({
              username: testContext.username,
              password: TEST_PASSWORD,
            })
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：空用户名注册
       * 使用空字符串作为用户名注册，使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '注册 - 空用户名',
        fn: async () => {
          const { error } = await safeCall(() =>
            registerApi({
              username: '',
              password: TEST_PASSWORD,
            })
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：正确密码登录
       * 使用注册时的用户名和密码登录，验证返回 code 200 且 token 已定义
       * 登录成功后将 token 和用户信息保存到测试上下文
       */
      {
        name: '登录 - 正确密码',
        fn: async () => {
          const res = await loginApi({
            username: testContext.username,
            password: TEST_PASSWORD,
          })
          expect(res.code).toBe(200)
          expect(res.data.token).toBeDefined()
          // 将登录凭据保存到测试上下文和浏览器存储
          testContext.token = res.data.token
          testContext.userId = res.data.id
          setAuthState(res.data.token, res.data.id)
        },
      },

      /**
       * 测试用例：错误密码登录
       * 使用正确用户名但错误密码登录，使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '登录 - 错误密码',
        fn: async () => {
          const { error } = await safeCall(() =>
            loginApi({
              username: testContext.username,
              password: 'WrongPassword999!',
            })
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：不存在的用户登录
       * 使用不存在的用户名登录，使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '登录 - 不存在的用户',
        fn: async () => {
          const { error } = await safeCall(() =>
            loginApi({
              username: 'nonexistent_user_xyz_999',
              password: TEST_PASSWORD,
            })
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：检测用户名可用性
       * 检测一个随机生成的用户名是否可用，验证返回 code 200 且 available 为 true
       */
      {
        name: '检测用户名可用性',
        fn: async () => {
          const newName = generateTestUsername()
          const res = await checkUsernameApi(newName)
          expect(res.code).toBe(200)
          expect(res.data.available).toBe(true)
        },
      },
    ],
  }
}
