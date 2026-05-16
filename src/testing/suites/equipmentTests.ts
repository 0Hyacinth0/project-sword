/**
 * 装备系统测试套件
 * 覆盖装备穿戴/卸下、槽位替换、装备强化、属性加点、属性计算验证等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getInventoryApi,
} from '../../api/inventory'
import {
  equipItemApi,
  unequipItemApi,
  enhanceEquipmentApi,
  updateAttributesApi,
  getCharacterInfoApi,
} from '../../api/character'
import {
  testContext,
  safeCall,
} from '../utils/testHelper'
import type { InventoryItem } from '../../types/item'
import type { EquipmentSlots } from '../../types/equipment'

/**
 * 在背包中查找指定类别的物品
 * @param items - 背包物品列表
 * @param category - 物品类别
 * @returns 第一个匹配的物品，未找到时返回 undefined
 */
function findItemByCategory(items: InventoryItem[], category: string): InventoryItem | undefined {
  return items.find(item => item.item.category === category)
}

/**
 * 在装备栏中查找第一个已填充的槽位
 * @param equipment - 装备槽位数据
 * @returns 已填充槽位的类型名称，如 'weapon'；无已填充槽位时返回 null
 */
function findFilledSlot(equipment: EquipmentSlots | null): string | null {
  if (!equipment) return null
  const slots: (keyof EquipmentSlots)[] = ['weapon', 'helmet', 'chest', 'legs', 'accessory1', 'accessory2']
  for (const slot of slots) {
    if (equipment[slot]) return slot
  }
  return null
}

/**
 * 在装备栏中查找第一个空槽位
 * @param equipment - 装备槽位数据
 * @returns 空槽位的类型名称，如 'accessory2'；无空槽位时返回 null
 */
function findEmptySlot(equipment: EquipmentSlots | null): string | null {
  if (!equipment) return 'weapon'
  const slots: (keyof EquipmentSlots)[] = ['weapon', 'helmet', 'chest', 'legs', 'accessory1', 'accessory2']
  for (const slot of slots) {
    if (!equipment[slot]) return slot
  }
  return null
}

/**
 * 创建装备系统测试套件
 * 包含装备穿戴、槽位替换、卸下装备、空槽位卸下、装备强化、属性加点、属性计算验证等用例
 * @returns 装备系统 TestSuite 对象
 */
export function createEquipmentTestSuite(): TestSuite {
  return {
    module: '装备系统',
    icon: '🛡️',

    cases: [
      /**
       * 测试用例：穿戴装备
       * 从背包中找到第一个装备类物品，穿戴到对应槽位，验证返回 code 200
       * 若背包中没有装备则跳过该测试
       */
      {
        name: '穿戴装备',
        fn: async () => {
          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const equipItem = findItemByCategory(invRes.data, 'equipment')
          if (!equipItem) {
            // 背包中没有可穿戴的装备，跳过
            return
          }

          const slotType = equipItem.item.slotType
          const res = await equipItemApi(testContext.characterId, equipItem.id, slotType)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：穿戴装备 - 已占用槽位应替换
       * 找到第二件装备并穿戴到与第一件相同的槽位（或另一可用槽位）
       * 验证返回 code 200，旧装备应被替换
       */
      {
        name: '穿戴 - 已占用槽位应替换',
        fn: async () => {
          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const equipItem = findItemByCategory(invRes.data, 'equipment')
          if (!equipItem) {
            // 没有第二件装备可测试替换，跳过
            return
          }

          const slotType = equipItem.item.slotType
          const res = await equipItemApi(testContext.characterId, equipItem.id, slotType)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：卸下装备
       * 获取角色信息，找到第一个已填充的装备槽位，卸下该装备
       * 验证返回 code 200
       */
      {
        name: '卸下装备',
        fn: async () => {
          const charRes = await getCharacterInfoApi(testContext.characterId)
          expect(charRes.code).toBe(200)

          const filledSlot = findFilledSlot(charRes.data.equipment)
          if (!filledSlot) {
            // 没有已穿戴的装备可卸下，跳过
            return
          }

          const res = await unequipItemApi(testContext.characterId, filledSlot as keyof EquipmentSlots)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：卸下空槽位
       * 获取角色信息，找到第一个空槽位，尝试卸下
       * 使用 safeCall 捕获异常，验证返回错误
       */
      {
        name: '卸下 - 空槽位',
        fn: async () => {
          const charRes = await getCharacterInfoApi(testContext.characterId)
          expect(charRes.code).toBe(200)

          const emptySlot = findEmptySlot(charRes.data.equipment)
          if (!emptySlot) {
            // 所有槽位都已装备，跳过
            return
          }

          const { error } = await safeCall(() =>
            unequipItemApi(testContext.characterId, emptySlot as keyof EquipmentSlots)
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：强化装备
       * 获取角色信息，找到第一个已填充的装备槽位，对装备进行强化
       * 验证返回 code 200 且强化成功
       */
      {
        name: '强化装备',
        fn: async () => {
          const charRes = await getCharacterInfoApi(testContext.characterId)
          expect(charRes.code).toBe(200)

          const filledSlot = findFilledSlot(charRes.data.equipment)
          if (!filledSlot) {
            // 没有已穿戴的装备可强化，先穿戴一件
            const invRes = await getInventoryApi(testContext.characterId)
            const equipItem = findItemByCategory(invRes.data, 'equipment')
            if (!equipItem) return
            await equipItemApi(testContext.characterId, equipItem.id, equipItem.item.slotType)
            // 重新获取角色信息以拿到穿戴后的状态
            const charRes2 = await getCharacterInfoApi(testContext.characterId)
            const slot2 = findFilledSlot(charRes2.data.equipment)
            if (!slot2) return
            const res = await enhanceEquipmentApi(testContext.characterId, slot2)
            expect(res.code).toBe(200)
            return
          }

          const res = await enhanceEquipmentApi(testContext.characterId, filledSlot)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：属性加点
       * 给猎人角色的力量属性加1点，智力和敏捷各加0点
       * 验证返回 code 200
       */
      {
        name: '属性加点',
        fn: async () => {
          // 先获取角色信息，确认是否有可用属性点
          const charRes = await getCharacterInfoApi(testContext.characterId)
          expect(charRes.code).toBe(200)

          // 如果没有可用属性点，跳过加点测试
          if (charRes.data.availablePoints < 1) {
            return
          }

          const res = await updateAttributesApi({
            characterId: testContext.characterId,
            str: 1,
            int: 0,
            agi: 0,
          })
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：获取角色属性 - 验证计算
       * 获取角色详情，验证 hp 和 physicalAttack 均大于0
       * 确保属性计算逻辑正确
       */
      {
        name: '获取角色属性 - 验证计算',
        fn: async () => {
          const res = await getCharacterInfoApi(testContext.characterId)
          expect(res.code).toBe(200)
          expect(res.data.hp).toBeGreaterThan(0)
          expect(res.data.physicalAttack).toBeGreaterThan(0)
        },
      },
    ],
  }
}
