/**
 * PVP 系统测试套件
 * 覆盖发起匹配、结算胜利、结算失败、积分计算验证等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  startMatchmakingApi,
  settlePvpBattleApi,
} from '../../api/pvp'
import { testContext } from '../utils/testHelper'

/**
 * 保存匹配到的对手角色 ID
 */
let opponentId = ''

/**
 * 保存上一次结算后的积分，用于后续积分计算验证
 */
let currentScore = 1000

/**
 * 创建 PVP 系统测试套件
 * 包含发起匹配、结算胜利、结算失败、积分计算验证等用例
 * 注意：匹配 API 模拟 3-8 秒延迟，需设置较长超时时间
 * @returns PVP 系统 TestSuite 对象
 */
export function createPvpTestSuite(): TestSuite {
  return {
    module: 'PVP 系统',
    icon: '🎮',

    cases: [
      /**
       * 测试用例：发起匹配
       * 调用 startMatchmakingApi 以当前积分 1000 发起匹配
       * 验证返回 code 200 且对手信息完整（角色 ID、名称、段位、积分）
       * 注意：匹配 API 有 3-8 秒模拟延迟，需较长超时
       */
      {
        name: '发起匹配',
        timeout: 15000,
        fn: async () => {
          const res = await startMatchmakingApi(currentScore, testContext.characterId)
          expect(res.code).toBe(200)
          expect(res.data.characterId).toBeDefined()
          expect(res.data.characterName).toBeDefined()
          expect(res.data.profession).toBeDefined()
          expect(res.data.level).toBeGreaterThanOrEqual(1)
          expect(res.data.tier).toBeDefined()
          expect(res.data.score).toBeGreaterThanOrEqual(0)

          // 保存对手 ID 供后续结算用例使用
          opponentId = res.data.characterId
        },
      },

      /**
       * 测试用例：结算 - 胜利
       * 调用 settlePvpBattleApi 以胜利状态结算 PVP 战斗
       * 验证返回 code 200，积分为正，新积分大于原积分
       */
      {
        name: '结算 - 胜利',
        fn: async () => {
          expect(opponentId).toBeDefined()

          const res = await settlePvpBattleApi(opponentId, true, currentScore, 950)
          expect(res.code).toBe(200)
          expect(res.data.scoreChange).toBeGreaterThanOrEqual(0)
          expect(res.data.oldScore).toBe(currentScore)
          expect(res.data.newScore).toBeGreaterThanOrEqual(currentScore)

          // 更新当前积分
          currentScore = res.data.newScore
        },
      },

      /**
       * 测试用例：结算 - 失败
       * 调用 settlePvpBattleApi 以失败状态结算 PVP 战斗
       * 验证返回 code 200，积分为负或零，新积分小于原积分
       */
      {
        name: '结算 - 失败',
        fn: async () => {
          expect(opponentId).toBeDefined()

          const res = await settlePvpBattleApi(opponentId, false, currentScore, 1050)
          expect(res.code).toBe(200)
          expect(res.data.scoreChange).toBeLessThanOrEqual(0)
          expect(res.data.oldScore).toBe(currentScore)
          expect(res.data.newScore).toBeLessThanOrEqual(currentScore)

          // 更新当前积分
          currentScore = res.data.newScore
        },
      },

      /**
       * 测试用例：积分计算验证
       * 再次进行一场胜利结算，验证积分增量正确（newScore >= oldScore）
       * 同时验证段位信息字段完整
       */
      {
        name: '积分计算验证',
        fn: async () => {
          expect(opponentId).toBeDefined()

          const oldScore = currentScore
          const res = await settlePvpBattleApi(opponentId, true, oldScore, 1000)
          expect(res.code).toBe(200)

          // 胜利后积分应大于等于原积分
          expect(res.data.newScore).toBeGreaterThanOrEqual(oldScore)
          expect(res.data.oldScore).toBe(oldScore)

          // 验证段位信息完整
          expect(res.data.tierChanged).toBeDefined()
          expect(res.data.oldTier).toBeDefined()
          expect(res.data.newTier).toBeDefined()
          expect(res.data.oldTier.tier).toBeDefined()
          expect(res.data.newTier.tier).toBeDefined()
        },
      },
    ],
  }
}
