/**
 * 副本系统测试套件
 * 覆盖获取副本配置、进入副本、完成副本结算及掉落验证等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import { getDungeonConfigsForRoomApi } from '../../api/dungeonRoom'
import { enterDungeonApi, completeDungeonApi } from '../../api/dungeon'
import { testContext } from '../utils/testHelper'

/**
 * 保存测试过程中获取的副本 ID
 */
let savedDungeonId = ''

/**
 * 创建副本系统测试套件
 * 包含获取副本配置、进入副本、完成副本、副本掉落验证等用例
 * @returns 副本系统 TestSuite 对象
 */
export function createDungeonTestSuite(): TestSuite {
  return {
    module: '副本系统',
    icon: '🏰',

    cases: [
      /**
       * 测试用例：获取副本配置
       * 调用 getDungeonConfigsForRoomApi 获取所有可挑战的副本配置
       * 验证返回的配置列表非空，并保存第一个副本 ID 供后续用例使用
       */
      {
        name: '获取副本配置',
        fn: async () => {
          const configs = getDungeonConfigsForRoomApi()
          expect(configs).toBeDefined()
          expect(configs.length).toBeGreaterThanOrEqual(1)

          // 保存第一个副本的 ID 供后续用例使用
          savedDungeonId = configs[0].id
          expect(savedDungeonId).toBeDefined()
        },
      },

      /**
       * 测试用例：进入副本
       * 使用 characterId 和 savedDungeonId 调用 enterDungeonApi 进入副本
       * 验证返回 success 为 true 且包含 runId
       */
      {
        name: '进入副本',
        fn: async () => {
          const characterId = testContext.characterId
          expect(characterId).toBeDefined()
          expect(savedDungeonId).toBeDefined()

          const res = await enterDungeonApi(characterId, savedDungeonId)
          expect(res.success).toBe(true)
          expect(res.runId).toBeDefined()
        },
      },

      /**
       * 测试用例：完成副本
       * 调用 completeDungeonApi 并传入 Mock 奖励数据完成副本结算
       * 验证返回 success 为 true 且 totalRewards 已定义
       */
      {
        name: '完成副本',
        fn: async () => {
          const characterId = testContext.characterId
          expect(characterId).toBeDefined()

          const mockRewards = {
            exp: 100,
            gold: 50,
            items: [],
          }

          const res = await completeDungeonApi(characterId, savedDungeonId, mockRewards)
          expect(res.success).toBe(true)
          expect(res.totalRewards).toBeDefined()
          expect(res.totalRewards!.exp).toBe(100)
          expect(res.totalRewards!.gold).toBe(50)
        },
      },

      /**
       * 测试用例：副本掉落验证
       * 调用 completeDungeonApi 传入包含物品掉落的奖励数据
       * 验证返回的 totalRewards 中物品数据完整
       */
      {
        name: '副本掉落验证',
        fn: async () => {
          const characterId = testContext.characterId
          expect(characterId).toBeDefined()

          const mockRewardsWithItems = {
            exp: 200,
            gold: 100,
            items: [
              {
                itemId: 3001,
                name: '暗影之刃',
                quantity: 1,
                quality: 'rare' as const,
                itemType: 'equipment' as const,
              },
              {
                itemId: 4001,
                name: '生命药水',
                quantity: 3,
                quality: 'common' as const,
                itemType: 'consumable' as const,
              },
            ],
          }

          const res = await completeDungeonApi(characterId, savedDungeonId, mockRewardsWithItems)
          expect(res.success).toBe(true)
          expect(res.totalRewards).toBeDefined()
          expect(res.totalRewards!.items.length).toBe(2)
          expect(res.totalRewards!.items[0].name).toBe('暗影之刃')
          expect(res.totalRewards!.items[0].quantity).toBe(1)
          expect(res.totalRewards!.items[1].name).toBe('生命药水')
          expect(res.totalRewards!.items[1].quantity).toBe(3)
        },
      },
    ],
  }
}
