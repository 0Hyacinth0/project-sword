/**
 * 竞技场测试套件
 * 覆盖获取赛季信息、获取玩家竞技数据、数据完整性验证等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getArenaSeasonApi,
  getArenaPlayerDataApi,
} from '../../api/arena'
import { testContext } from '../utils/testHelper'

/**
 * 创建竞技场测试套件
 * 包含获取赛季信息、获取玩家竞技数据、数据完整性验证等用例
 * @returns 竞技场 TestSuite 对象
 */
export function createArenaTestSuite(): TestSuite {
  return {
    module: '竞技场',
    icon: '🏟️',

    cases: [
      /**
       * 测试用例：获取赛季信息
       * 调用 getArenaSeasonApi 获取当前竞技场赛季信息
       * 验证返回 code 200 且赛季 ID、名称、起止日期已定义
       */
      {
        name: '获取赛季信息',
        fn: async () => {
          const res = await getArenaSeasonApi()
          expect(res.code).toBe(200)
          expect(res.data.seasonId).toBeDefined()
          expect(res.data.seasonName).toBeDefined()
          expect(res.data.seasonNumber).toBeGreaterThanOrEqual(1)
          expect(res.data.startDate).toBeDefined()
          expect(res.data.endDate).toBeDefined()
          expect(res.data.isActive).toBeDefined()
        },
      },

      /**
       * 测试用例：获取玩家竞技数据
       * 调用 getArenaPlayerDataApi 获取当前玩家的竞技场数据
       * 验证返回 code 200 且段位、积分、胜负场次已定义
       */
      {
        name: '获取玩家竞技数据',
        fn: async () => {
          const res = await getArenaPlayerDataApi(testContext.characterId)
          expect(res.code).toBe(200)
          expect(res.data.tier).toBeDefined()
          expect(res.data.subTier).toBeDefined()
          expect(res.data.score).toBeGreaterThanOrEqual(0)
          expect(res.data.wins).toBeGreaterThanOrEqual(0)
          expect(res.data.losses).toBeGreaterThanOrEqual(0)
          expect(res.data.winRate).toBeDefined()
          expect(res.data.seasonId).toBeDefined()
        },
      },

      /**
       * 测试用例：数据完整性验证
       * 再次获取竞技数据，验证各字段之间的逻辑一致性
       * 包括胜率计算、段位有效性、赛季 ID 关联等
       */
      {
        name: '数据完整性验证',
        fn: async () => {
          const seasonRes = await getArenaSeasonApi()
          const playerRes = await getArenaPlayerDataApi(testContext.characterId)
          expect(seasonRes.code).toBe(200)
          expect(playerRes.code).toBe(200)

          // 验证赛季 ID 关联一致
          expect(playerRes.data.seasonId).toBe(seasonRes.data.seasonId)

          // 验证段位值有效
          const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'king']
          expect(validTiers).toContain(playerRes.data.tier)

          const validSubTiers = ['I', 'II', 'III']
          expect(validSubTiers).toContain(playerRes.data.subTier)

          // 验证胜率在 0-100 范围内
          expect(playerRes.data.winRate).toBeGreaterThanOrEqual(0)
          expect(playerRes.data.winRate).toBeLessThanOrEqual(100)
        },
      },
    ],
  }
}
