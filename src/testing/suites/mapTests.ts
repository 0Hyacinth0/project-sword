/**
 * 地图系统测试套件
 * 覆盖获取区域列表、区域详情、进入区域探索、创建野外怪物战斗单位等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getAreaListApi,
  getAreaDetailApi,
  enterAreaApi,
  createWildMonsterCombatant,
} from '../../api/map'
import { testContext } from '../utils/testHelper'

/**
 * 保存测试过程中获取的区域 ID
 */
let savedAreaId = ''

/**
 * 创建地图系统测试套件
 * 包含获取区域列表、区域详情、进入区域、创建野外怪物等用例
 * @returns 地图系统 TestSuite 对象
 */
export function createMapTestSuite(): TestSuite {
  return {
    module: '地图系统',
    icon: '🗺️',

    cases: [
      /**
       * 测试用例：获取区域列表
       * 调用 getAreaListApi 获取所有可探索区域
       * 验证返回 code 200，至少有 1 个区域，并保存第一个区域 ID 供后续用例使用
       */
      {
        name: '获取区域列表',
        fn: async () => {
          const res = await getAreaListApi()
          expect(res.code).toBe(200)
          expect(res.data.length).toBeGreaterThanOrEqual(1)

          // 保存第一个区域的 ID 供后续用例使用
          savedAreaId = res.data[0].id
          expect(savedAreaId).toBeDefined()
        },
      },

      /**
       * 测试用例：获取区域详情
       * 使用上一步保存的 areaId 获取区域详细信息
       * 验证返回 code 200，区域 ID、名称和怪物列表已定义
       */
      {
        name: '获取区域详情',
        fn: async () => {
          expect(savedAreaId).toBeDefined()

          const res = await getAreaDetailApi(savedAreaId)
          expect(res.code).toBe(200)
          expect(res.data.area.id).toBe(savedAreaId)
          expect(res.data.area.name).toBeDefined()
          expect(res.data.area.monsters).toBeDefined()
        },
      },

      /**
       * 测试用例：进入区域
       * 使用 characterId 和 savedAreaId 调用 enterAreaApi 进入区域探索
       * 验证返回 code 200 且 areaId 匹配
       */
      {
        name: '进入区域',
        fn: async () => {
          const characterId = testContext.characterId
          expect(characterId).toBeDefined()
          expect(savedAreaId).toBeDefined()

          const res = await enterAreaApi({
            characterId,
            areaId: savedAreaId,
          })
          expect(res.code).toBe(200)
          expect(res.data.areaId).toBe(savedAreaId)
          expect(res.data.message).toBeDefined()
        },
      },

      /**
       * 测试用例：创建野外怪物
       * 使用 Mock 怪物数据调用 createWildMonsterCombatant 生成战斗单位
       * 验证返回的 Combatant 对象属性完整（uid、side、type、stats 等）
       */
      {
        name: '创建野外怪物',
        fn: async () => {
          const mockMonster = {
            id: 'monster-test-001',
            name: '测试暗影狼',
            level: 10,
            type: 'normal' as const,
          }

          const combatant = createWildMonsterCombatant(mockMonster)
          expect(combatant).toBeDefined()
          expect(combatant.uid).toBeDefined()
          expect(combatant.sourceId).toBe(mockMonster.id)
          expect(combatant.name).toBe(mockMonster.name)
          expect(combatant.side).toBe('enemy')
          expect(combatant.type).toBe('enemy')
          expect(combatant.isAlive).toBe(true)
          expect(combatant.stats.maxHp).toBeGreaterThanOrEqual(1)
          expect(combatant.stats.hp).toBe(combatant.stats.maxHp)
          expect(combatant.skills.length).toBeGreaterThanOrEqual(1)
        },
      },
    ],
  }
}
