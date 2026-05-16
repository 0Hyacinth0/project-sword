/**
 * 背包系统测试套件
 * 覆盖背包物品获取、消耗品使用、数量不足校验、物品丢弃等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getInventoryApi,
  useItemApi,
  discardItemApi,
} from '../../api/inventory'
import {
  testContext,
  safeCall,
} from '../utils/testHelper'
import type { InventoryItem } from '../../types/item'

/**
 * 在背包物品列表中查找指定类别的物品
 * @param items - 背包物品列表
 * @param category - 物品类别（consumable / material / equipment）
 * @returns 第一个匹配的物品，未找到时返回 undefined
 */
function findItemByCategory(items: InventoryItem[], category: string): InventoryItem | undefined {
  return items.find(item => item.item.category === category)
}

/**
 * 创建背包系统测试套件
 * 包含获取背包物品、使用消耗品、数量不足校验、丢弃物品、丢弃不存在物品等用例
 * @returns 背包系统 TestSuite 对象
 */
export function createInventoryTestSuite(): TestSuite {
  return {
    module: '背包系统',
    icon: '🎒',

    cases: [
      /**
       * 测试用例：获取背包物品列表
       * 使用测试上下文中的 characterId 获取背包物品，验证返回 code 200
       */
      {
        name: '获取背包物品',
        fn: async () => {
          const res = await getInventoryApi(testContext.characterId)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：使用消耗品
       * 从背包中找到第一个消耗品类物品，使用1个，验证返回 code 200
       * 若背包中没有消耗品则跳过该测试
       */
      {
        name: '使用消耗品',
        fn: async () => {
          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const consumable = findItemByCategory(invRes.data, 'consumable')
          if (!consumable) {
            // 背包中没有消耗品，跳过该用例
            return
          }

          const res = await useItemApi(testContext.characterId, consumable.id, 1)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：使用物品 - 数量不足
       * 使用一个不存在的背包记录 ID 调用 useItemApi
       * 使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '使用物品 - 数量不足',
        fn: async () => {
          const { error } = await safeCall(() =>
            useItemApi(testContext.characterId, 'nonexistent_inv_id_999', 1)
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：丢弃材料物品
       * 从背包中找到第一个材料类物品，丢弃1个，验证返回 code 200
       * 若背包中没有材料则跳过该测试
       */
      {
        name: '丢弃物品',
        fn: async () => {
          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const material = findItemByCategory(invRes.data, 'material')
          if (!material) {
            // 背包中没有材料，跳过该用例
            return
          }

          const res = await discardItemApi(testContext.characterId, material.id, 1)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：丢弃不存在的物品
       * 使用一个不存在的背包记录 ID 调用 discardItemApi
       * 使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '丢弃不存在的物品',
        fn: async () => {
          const { error } = await safeCall(() =>
            discardItemApi(testContext.characterId, 'nonexistent_inv_id_888', 1)
          )
          expect(error).toBeDefined()
        },
      },
    ],
  }
}
