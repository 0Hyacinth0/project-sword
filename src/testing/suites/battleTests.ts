/**
 * 战斗系统测试套件
 * 覆盖发起战斗、提交行动（普攻/技能/物品）、结束战斗及结算验证等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  startBattleApi,
  submitActionApi,
  endBattleApi,
  createPlayerCombatant,
} from '../../api/battle'
import { testContext } from '../utils/testHelper'

/**
 * 创建战斗系统测试套件
 * 包含发起战斗、提交普攻/技能/物品行动、结束战斗、验证奖励数据结构等用例
 * @returns 战斗系统 TestSuite 对象
 */
export function createBattleTestSuite(): TestSuite {
  return {
    module: '战斗系统',
    icon: '⚔️',

    cases: [
      /**
       * 测试用例：发起战斗
       * 获取角色信息、构造玩家战斗单位、创建 Mock 敌人并发起战斗
       * 验证返回 code 200，战斗 ID 和敌人列表已定义，将 battleId 保存到测试上下文
       */
      {
        name: '发起战斗',
        fn: async () => {
          const characterId = testContext.characterId
          expect(characterId).toBeDefined()

          // 构造玩家战斗单位
          const player = createPlayerCombatant(
            characterId,
            testContext.characterName,
            {
              maxHp: 200,
              maxMp: 80,
              physicalAttack: 25,
              magicAttack: 15,
              defense: 12,
              dodgeRate: 0.05,
              criticalRate: 0.1,
            },
            []
          )
          expect(player).toBeDefined()
          expect(player.side).toBe('ally')

          // 发起战斗
          const res = await startBattleApi({ characterId })
          expect(res.code).toBe(200)
          expect(res.data.battleId).toBeDefined()
          expect(res.data.enemies.length).toBeGreaterThanOrEqual(1)

          // 保存战斗 ID 到测试上下文
          testContext.battleId = res.data.battleId
        },
      },

      /**
       * 测试用例：提交行动 - 普攻
       * 使用 type:'attack' 和目标 UID 提交普通攻击行动
       * 验证返回 code 200 且战斗状态已更新
       */
      {
        name: '提交行动 - 普攻',
        fn: async () => {
          const battleId = testContext.battleId
          expect(battleId).toBeDefined()

          const res = await submitActionApi({
            battleId,
            action: {
              type: 'attack',
              actorUid: 'ally-player',
              targetUid: 'enemy-001',
            },
          })
          expect(res.code).toBe(200)
          expect(res.data.battleState).toBeDefined()
        },
      },

      /**
       * 测试用例：提交行动 - 技能
       * 使用 type:'skill' 和 skillId 提交技能行动
       * 验证返回 code 200 且战斗状态已更新
       */
      {
        name: '提交行动 - 技能',
        fn: async () => {
          const battleId = testContext.battleId
          expect(battleId).toBeDefined()

          const res = await submitActionApi({
            battleId,
            action: {
              type: 'skill',
              actorUid: 'ally-player',
              targetUid: 'enemy-001',
              skillId: 5001,
            },
          })
          expect(res.code).toBe(200)
          expect(res.data.battleState).toBeDefined()
        },
      },

      /**
       * 测试用例：提交行动 - 使用物品
       * 使用 type:'item' 提交物品使用行动
       * 验证返回 code 200 且战斗状态已更新
       */
      {
        name: '提交行动 - 使用物品',
        fn: async () => {
          const battleId = testContext.battleId
          expect(battleId).toBeDefined()

          const res = await submitActionApi({
            battleId,
            action: {
              type: 'item',
              actorUid: 'ally-player',
              targetUid: 'ally-player',
              itemId: 'item-hp-potion',
            },
          })
          expect(res.code).toBe(200)
          expect(res.data.battleState).toBeDefined()
        },
      },

      /**
       * 测试用例：结束战斗
       * 调用 endBattleApi 结束当前战斗
       * 验证返回 code 200 且战斗结果（outcome）已定义
       */
      {
        name: '结束战斗',
        fn: async () => {
          const battleId = testContext.battleId
          expect(battleId).toBeDefined()

          const res = await endBattleApi(battleId)
          expect(res.code).toBe(200)
          expect(res.data.outcome).toBeDefined()
        },
      },

      /**
       * 测试用例：战斗结算 - 验证奖励数据结构
       * 验证前一步结束战斗时返回的奖励数据包含必要字段（exp, gold, items）
       * 通过检查 battleId 是否已被设置来间接验证战斗结算流程的完整性
       */
      {
        name: '战斗结算 - 验证奖励数据结构',
        fn: async () => {
          // battleId 应该在发起战斗时已设置
          expect(testContext.battleId).toBeDefined()

          // 再次发起一场新战斗并结束，验证奖励结构
          const startRes = await startBattleApi({ characterId: testContext.characterId })
          expect(startRes.code).toBe(200)

          const endRes = await endBattleApi(startRes.data.battleId)
          expect(endRes.code).toBe(200)

          // 验证奖励数据结构
          expect(endRes.data.rewards).toBeDefined()
          expect(endRes.data.rewards.exp).toBeDefined()
          expect(endRes.data.rewards.gold).toBeDefined()
          expect(endRes.data.rewards.items).toBeDefined()
        },
      },
    ],
  }
}
