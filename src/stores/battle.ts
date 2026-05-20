import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { startBattleApi, submitActionApi, endBattleApi, createPlayerCombatant, createPetCombatant } from '../api/battle'
import {
  BattlePhase,
  type BattleState,
  type BattleAction,
  type Combatant,
  type BattleSkill,
  type BattleRewards
} from '../types/battle'
import {
  createBattleState,
  advanceBattle,
  submitPlayerAction,
  calculateRewards,
  computeBattleStatistics,
  getCurrentActor,
  getAvailableTargets,
  getAliveCombatants,
  restorePetHpAfterBattle
} from '../utils/battleEngine'
import { isBossBattle } from '../utils/bossMechanics'
import type { StatsBreakdown } from '../utils/attributeCalculator'

/**
 * 战斗状态管理
 * 管理战斗生命周期：发起 → 回合循环 → 结束
 */
export const useBattleStore = defineStore('battle', () => {
  // ── 状态 ──
  const battleState = ref<BattleState | null>(null)
  const battleId = ref<string | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──
  const phase = computed<BattlePhase>(() => battleState.value?.phase ?? BattlePhase.IDLE)
  const round = computed(() => battleState.value?.round ?? 0)
  const combatants = computed<Combatant[]>(() => battleState.value?.combatants ?? [])
  const allies = computed(() => getAliveCombatants(battleState.value!, 'ally'))
  const enemies = computed(() => getAliveCombatants(battleState.value!, 'enemy'))
  const currentActor = computed(() => battleState.value ? getCurrentActor(battleState.value) : null)
  const waitingForPlayer = computed(() => battleState.value?.waitingForPlayerAction ?? false)
  const isBattleActive = computed(() => battleState.value !== null && battleState.value.phase !== BattlePhase.IDLE)
  const isBattleOver = computed(() => battleState.value?.phase === BattlePhase.BATTLE_END)
  const battleOutcome = computed(() => battleState.value?.outcome ?? null)
  const battleRewards = computed(() => battleState.value?.rewards ?? null)
  const battleStatistics = computed(() => battleState.value?.statistics ?? null)
  const log = computed(() => battleState.value?.log ?? [])
  const isBossFight = computed(() => battleState.value ? isBossBattle(battleState.value) : false)
  const bossState = computed(() => battleState.value?.bossState)
  const currentPlayer = computed(() => battleState.value?.combatants.find(c => c.side === 'ally' && c.type === 'player'))

  const availableTargets = computed(() => {
    if (!battleState.value || !currentActor.value) return []
    return getAvailableTargets(battleState.value, currentActor.value.side)
  })

  /**
   * 发起战斗
   * @param characterId - 角色 ID
   * @param characterName - 角色名称
   * @param statsBreakdown - 角色完整属性
   * @param skills - 角色技能
   * @param pet - 战宠信息（可选）
   */
  async function startBattle(
    characterId: string,
    characterName: string,
    statsBreakdown: StatsBreakdown,
    skills: BattleSkill[],
    pet?: { id: string; nickname: string; stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number }; skills?: BattleSkill[] }
  ): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      // 调用 API 获取敌人数据
      const res = await startBattleApi({ characterId })
      if (res.code !== 200) {
        return { success: false, message: res.message }
      }

      battleId.value = res.data.battleId

      // 构造友方单位
      const playerCombatant = createPlayerCombatant(
        characterId,
        characterName,
        statsBreakdown.total,
        skills
      )

      const allyCombatants: Combatant[] = [playerCombatant]
      if (pet) {
        // 计算战宠给予主人的属性加成值（简化版：取属性 × 10%）
        const petBonus = {
          maxHp: Math.floor(pet.stats.maxHp * 0.1),
          physicalAttack: Math.floor(pet.stats.attack * 0.1),
          magicAttack: Math.floor(pet.stats.attack * 0.05),
          defense: Math.floor(pet.stats.defense * 0.1),
          dodgeRate: 0,
          criticalRate: 0
        }
        allyCombatants.push(createPetCombatant(pet, playerCombatant.uid, petBonus))
      }

      // 使用敌人数据创建战斗状态
      const enemies = res.data.combatants
        .filter(c => c.side === 'enemy')
        .map(e => ({
          ...e,
          buffs: [...(e.buffs ?? [])],
          cooldowns: { ...(e.cooldowns ?? {}) }
        }))

      battleState.value = createBattleState(allyCombatants, enemies)

      // 自动推进到第一个需要玩家输入的状态
      battleState.value = advanceBattle(battleState.value)

      return { success: true, message: '战斗开始' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发起战斗失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 提交玩家行动
   * @param action - 玩家选择的行动
   */
  async function submitAction(action: BattleAction): Promise<{ success: boolean; message: string }> {
    if (!battleState.value || !waitingForPlayer.value) {
      return { success: false, message: '当前无法行动' }
    }

    loading.value = true
    try {
      // 前端立即计算结果（体验优先），同时发送给后端验证
      const newState = submitPlayerAction(battleState.value, action)
      battleState.value = newState

      // 如果战斗继续，自动推进
      if (newState.phase !== BattlePhase.BATTLE_END) {
        battleState.value = advanceBattle(newState)
      } else {
        // 战斗结束，计算奖励和统计
        const deadEnemies = battleState.value.combatants.filter(c => c.side === 'enemy' && !c.isAlive)
        const rewards = calculateRewards(deadEnemies)
        const statistics = computeBattleStatistics(battleState.value)
        battleState.value = {
          ...battleState.value,
          rewards,
          statistics
        }
      }

      // 异步通知后端（非阻塞）
      if (battleId.value) {
        submitActionApi({
          battleId: battleId.value,
          action
        }).catch(() => { /* 前端已本地计算，后端同步失败不影响体验 */ })
      }

      return { success: true, message: '行动执行成功' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '行动执行失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 结束战斗并领取奖励
   * 战宠 HP/MP 自动恢复满血
   * 纯前端战斗（无 battleId）直接清理状态
   */
  async function finishBattle(): Promise<{ success: boolean; message: string; rewards?: BattleRewards }> {
    // 纯前端战斗：没有 battleId 但战斗已结束，直接清理状态
    if (!battleId.value) {
      if (battleState.value && battleState.value.phase === BattlePhase.BATTLE_END) {
        // 角色/战宠 HP/MP 自动恢复
        battleState.value = {
          ...battleState.value,
          combatants: restorePetHpAfterBattle(battleState.value.combatants)
        }
        // 计算奖励
        const deadEnemies = battleState.value.combatants.filter(c => c.side === 'enemy' && !c.isAlive)
        const rewards = calculateRewards(deadEnemies)
        clearBattle()
        return { success: true, message: '战斗结束', rewards }
      }
      return { success: false, message: '没有进行中的战斗' }
    }

    // 战宠 HP/MP 自动恢复
    if (battleState.value) {
      battleState.value = {
        ...battleState.value,
        combatants: restorePetHpAfterBattle(battleState.value.combatants)
      }
    }

    loading.value = true
    try {
      const res = await endBattleApi(battleId.value)
      if (res.code === 200) {
        const rewards = res.data.rewards
        clearBattle()
        return { success: true, message: res.message, rewards }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '结算失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 发起野外战斗（使用预生成的敌人）
   * @param characterId - 角色 ID
   * @param characterName - 角色名称
   * @param statsBreakdown - 角色完整属性
   * @param skills - 角色技能
   * @param enemy - 预生成的敌人战斗单位（单个或多个）
   * @param pet - 战宠信息（可选）
   */
  async function startWildBattle(
    characterId: string,
    characterName: string,
    statsBreakdown: StatsBreakdown,
    skills: BattleSkill[],
    enemy: Combatant | Combatant[],
    pet?: { id: string; nickname: string; stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number }; skills?: BattleSkill[] }
  ): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const playerCombatant = createPlayerCombatant(
        characterId,
        characterName,
        statsBreakdown.total,
        skills
      )

      const allyCombatants: Combatant[] = [playerCombatant]
      if (pet) {
        const petBonus = {
          maxHp: Math.floor(pet.stats.maxHp * 0.1),
          physicalAttack: Math.floor(pet.stats.attack * 0.1),
          magicAttack: Math.floor(pet.stats.attack * 0.05),
          defense: Math.floor(pet.stats.defense * 0.1),
          dodgeRate: 0,
          criticalRate: 0
        }
        allyCombatants.push(createPetCombatant(pet, playerCombatant.uid, petBonus))
      }

      const enemyList = Array.isArray(enemy) ? enemy : [enemy]
      battleState.value = createBattleState(allyCombatants, enemyList)
      battleState.value = advanceBattle(battleState.value)

      return { success: true, message: '战斗开始' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发起战斗失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 发起多人战斗（玩家 + AI 队友 vs 敌人）
   * @param playerCombatant - 玩家战斗单位
   * @param allyCombatants - AI 队友战斗单位列表
   * @param enemies - 敌人列表
   */
  async function startWildBattleWithAllies(
    playerCombatant: Combatant,
    allyCombatants: Combatant[],
    enemies: Combatant[]
  ): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const allAllies = [playerCombatant, ...allyCombatants]
      battleState.value = createBattleState(allAllies, enemies)
      battleState.value = advanceBattle(battleState.value)
      return { success: true, message: '多人战斗开始' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发起战斗失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 清除战斗状态 */
  function clearBattle() {
    battleState.value = null
    battleId.value = null
  }

  return {
    battleState,
    battleId,
    loading,
    phase,
    round,
    combatants,
    allies,
    enemies,
    currentActor,
    waitingForPlayer,
    isBattleActive,
    isBattleOver,
    battleOutcome,
    battleRewards,
    battleStatistics,
    log,
    availableTargets,
    isBossFight,
    bossState,
    currentPlayer,
    startBattle,
    startWildBattle,
    startWildBattleWithAllies,
    submitAction,
    finishBattle,
    clearBattle
  }
})
