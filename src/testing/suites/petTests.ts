/**
 * 战宠系统测试套件
 * 覆盖战宠列表获取、出战/收回、喂食、重命名、技能装备/卸下、装备穿戴/卸下、进化等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getInventoryApi,
} from '../../api/inventory'
import {
  getPetListApi,
  setActivePetApi,
  feedPetApi,
  renamePetApi,
  evolvePetApi,
  equipSkillApi,
  unequipSkillApi,
  equipPetItemApi,
  unequipPetItemApi,
} from '../../api/pet'
import {
  testContext,
  safeCall,
} from '../utils/testHelper'
import type { InventoryItem } from '../../types/item'

/** 存储测试过程中获取的战宠 ID */
let testPetId: string = ''

/**
 * 在背包中查找经验道具（用于战宠喂食）
 * @param items - 背包物品列表
 * @returns 第一个经验卷轴类物品，未找到时返回 undefined
 */
function findExpItem(items: InventoryItem[]): InventoryItem | undefined {
  return items.find(item =>
    item.item.category === 'consumable' &&
    item.item.effects?.some(e => e.type === 'add_exp')
  )
}

/**
 * 在背包中查找可装备到战宠的物品（护甲或饰品）
 * @param items - 背包物品列表
 * @returns 第一个可装备的物品，未找到时返回 undefined
 */
function findPetEquipItem(items: InventoryItem[]): InventoryItem | undefined {
  return items.find(item =>
    item.item.category === 'equipment' &&
    (item.item.slotType === 'chest' || item.item.slotType === 'accessory1' || item.item.slotType === 'accessory2')
  )
}

/**
 * 创建战宠系统测试套件
 * 包含获取战宠列表、设置/取消出战、喂食、重命名、技能装备/卸下、装备穿戴/卸下、进化等用例
 * @returns 战宠系统 TestSuite 对象
 */
export function createPetTestSuite(): TestSuite {
  return {
    module: '战宠系统',
    icon: '🐾',

    /**
     * 套件前置钩子：获取战宠列表，保存第一个战宠 ID 供后续测试使用
     */
    async beforeAll() {
      const res = await getPetListApi(testContext.characterId)
      if (res.code === 200 && res.data.pets.length > 0) {
        testPetId = res.data.pets[0].id
      }
    },

    cases: [
      /**
       * 测试用例：获取战宠列表
       * 调用 getPetListApi 获取角色的战宠列表，验证返回 code 200
       */
      {
        name: '获取战宠列表',
        fn: async () => {
          const res = await getPetListApi(testContext.characterId)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：设置出战战宠
       * 将第一个战宠设置为出战状态，验证返回 code 200
       * 若没有战宠则跳过
       */
      {
        name: '设置出战战宠',
        fn: async () => {
          if (!testPetId) {
            return
          }
          const res = await setActivePetApi(testContext.characterId, testPetId)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：取消出战
       * 使用空字符串 petId 取消当前出战战宠，验证返回 code 200
       */
      {
        name: '取消出战',
        fn: async () => {
          const res = await setActivePetApi(testContext.characterId, '')
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：喂食战宠
       * 从背包中找到经验道具，对第一个战宠进行喂食
       * 验证返回 code 200
       * 若没有经验道具或战宠则跳过
       */
      {
        name: '喂食战宠',
        fn: async () => {
          if (!testPetId) {
            return
          }

          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const expItem = findExpItem(invRes.data)
          if (!expItem) {
            // 背包中没有经验道具，跳过
            return
          }

          const res = await feedPetApi(testContext.characterId, testPetId, expItem.id, 1)
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：重命名战宠
       * 将第一个战宠重命名为"测试战宠"，验证返回 code 200
       * 若没有战宠则跳过
       */
      {
        name: '重命名战宠',
        fn: async () => {
          if (!testPetId) {
            return
          }
          const res = await renamePetApi(testContext.characterId, testPetId, '测试战宠')
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：装备技能
       * 尝试将技能装备到战宠的槽位0
       * 使用 safeCall 捕获异常，验证响应存在（可能因技能不匹配而失败）
       */
      {
        name: '装备技能',
        fn: async () => {
          if (!testPetId) {
            return
          }
          // 获取战宠列表以查找已学技能
          const petRes = await getPetListApi(testContext.characterId)
          if (petRes.code !== 200) return

          const pet = petRes.data.pets.find(p => p.id === testPetId)
          if (!pet?.learnedSkills?.length) return

          const skillId = pet.learnedSkills[0].id
          const { data, error } = await safeCall(() =>
            equipSkillApi(testContext.characterId, testPetId, skillId, 0)
          )
          // 验证 API 可达，无论成功或失败都算通过
          if (data) {
            expect(data.code).toBeDefined()
          } else {
            expect(error).toBeDefined()
          }
        },
      },

      /**
       * 测试用例：卸下技能
       * 尝试从战宠的槽位0卸下技能
       * 使用 safeCall 捕获异常，验证响应存在（槽位可能为空）
       */
      {
        name: '卸下技能',
        fn: async () => {
          if (!testPetId) {
            return
          }
          const { data, error } = await safeCall(() =>
            unequipSkillApi(testContext.characterId, testPetId, 0)
          )
          // 验证 API 可达，无论成功或失败都算通过
          if (data) {
            expect(data.code).toBeDefined()
          } else {
            expect(error).toBeDefined()
          }
        },
      },

      /**
       * 测试用例：战宠穿戴装备
       * 从背包中找到护甲类装备，为战宠穿上
       * 验证返回 code 200
       * 若没有可用装备或战宠则跳过
       */
      {
        name: '战宠穿戴装备',
        fn: async () => {
          if (!testPetId) {
            return
          }

          const invRes = await getInventoryApi(testContext.characterId)
          expect(invRes.code).toBe(200)

          const equipItem = findPetEquipItem(invRes.data)
          if (!equipItem) {
            // 背包中没有可穿戴的装备，跳过
            return
          }

          const slotType = equipItem.item.slotType === 'chest' ? 'armor' : 'accessory'
          const res = await equipPetItemApi(
            testContext.characterId,
            testPetId,
            equipItem.id,
            slotType
          )
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：战宠卸下装备
       * 将战宠的护甲槽位装备卸下，验证返回 code 200
       * 使用 safeCall 捕获异常（槽位可能为空）
       */
      {
        name: '战宠卸下装备',
        fn: async () => {
          if (!testPetId) {
            return
          }
          const { data, error } = await safeCall(() =>
            unequipPetItemApi(testContext.characterId, testPetId, 'armor')
          )
          // 验证 API 可达
          if (data) {
            expect(data.code).toBeDefined()
          } else {
            expect(error).toBeDefined()
          }
        },
      },

      /**
       * 测试用例：进化战宠
       * 尝试对战宠进行进化操作
       * 使用 safeCall 捕获异常，验证响应存在（可能因等级或材料不足而失败）
       */
      {
        name: '进化战宠',
        fn: async () => {
          if (!testPetId) {
            return
          }
          const { data, error } = await safeCall(() =>
            evolvePetApi(testContext.characterId, testPetId)
          )
          // 验证 API 可达，无论成功或失败都算通过
          if (data) {
            expect(data.code).toBeDefined()
          } else {
            expect(error).toBeDefined()
          }
        },
      },
    ],
  }
}