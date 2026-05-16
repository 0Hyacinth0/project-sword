/**
 * PVP 匹配状态管理
 * 管理匹配生命周期：搜索 → 找到对手 → 确认战斗 → 结算
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { startMatchmakingApi, settlePvpBattleApi } from '../api/pvp'
import { calculateEloScore, generateOpponentStats, getOpponentSkills } from '../config/pvp_config'
import { resolveTier } from '../config/arena_config'
import { useArenaStore } from './arena'
import { useCharacterStore } from './character'
import { useBattleStore } from './battle'
import type { PvpMatchState, PvpOpponent, PvpScoreResult } from '../types/pvp'
import type { Combatant, BattleSkill } from '../types/battle'

/** 元素字符串到数字的映射 */
const ELEMENT_MAP: Record<string, number> = {
  none: 0,
  fire: 1,
  water: 2,
  wind: 3,
  earth: 4,
  light: 5,
  dark: 6
}

/**
 * 将 pvp_config 中的对手技能映射为 BattleSkill 格式
 * @param skills - pvp_config 返回的原始技能列表
 * @returns 符合 BattleSkill 接口的技能数组
 */
function mapOpponentSkills(skills: ReturnType<typeof getOpponentSkills>): BattleSkill[] {
  return skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    mpCost: skill.mpCost,
    power: skill.power,
    targetType: skill.targetType,
    cooldown: skill.cooldown,
    currentCooldown: 0,
    element: ELEMENT_MAP[skill.element] ?? 0,
    description: ''
  }))
}

export const usePvpStore = defineStore('pvp', () => {
  // ── 状态 ──
  /** 当前匹配状态 */
  const matchState = ref<PvpMatchState>('idle')
  /** 匹配到的对手信息 */
  const opponent = ref<PvpOpponent | null>(null)
  /** 积分结算结果 */
  const scoreResult = ref<PvpScoreResult | null>(null)

  // ── 计算属性 ──
  /** 是否正在匹配中（搜索或已找到对手） */
  const isMatching = computed(() => matchState.value === 'searching' || matchState.value === 'found')

  /** 预计积分变化 */
  const estimatedScore = computed(() => {
    const arena = useArenaStore()
    if (!arena.playerData || !opponent.value) {
      return { win: 0, lose: 0 }
    }
    return calculateEloScore(arena.playerData.score, opponent.value.score)
  })

  // ── 方法 ──
  /**
   * 开始匹配
   * 调用匹配 API，成功后设置对手信息
   */
  async function startMatchmaking(): Promise<{ success: boolean; message: string }> {
    const arena = useArenaStore()
    if (!arena.playerData) {
      return { success: false, message: '缺少玩家竞技数据' }
    }

    matchState.value = 'searching'
    try {
      const res = await startMatchmakingApi(arena.playerData.score)
      if (res.code === 200) {
        opponent.value = res.data
        matchState.value = 'found'
        return { success: true, message: res.message }
      }
      matchState.value = 'idle'
      return { success: false, message: res.message }
    } catch (err: unknown) {
      matchState.value = 'idle'
      const message = err instanceof Error ? err.message : '匹配失败'
      return { success: false, message }
    }
  }

  /**
   * 取消匹配
   * 重置为空闲状态
   */
  function cancelMatchmaking(): void {
    matchState.value = 'idle'
    opponent.value = null
  }

  /**
   * 确认战斗
   * 根据对手数据创建敌方 Combatant，调用 battleStore.startWildBattle 开始战斗
   */
  async function confirmBattle(): Promise<{ success: boolean; message: string }> {
    const characterStore = useCharacterStore()
    const battleStore = useBattleStore()
    const arena = useArenaStore()

    if (!opponent.value) {
      return { success: false, message: '没有匹配到的对手' }
    }

    if (!characterStore.characterDetail) {
      return { success: false, message: '缺少角色详情数据' }
    }

    const detail = characterStore.characterDetail
    if (!detail.statsBreakdown || !detail.skills) {
      return { success: false, message: '缺少角色属性或技能数据' }
    }

    // 构造敌方 Combatant
    const oppStats = generateOpponentStats(opponent.value)
    const oppSkills = mapOpponentSkills(getOpponentSkills(opponent.value.profession))

    const enemyCombatant: Combatant = {
      uid: 'enemy-pvp-opponent',
      sourceId: opponent.value.characterId,
      name: opponent.value.characterName,
      side: 'enemy',
      type: 'enemy',
      stats: {
        maxHp: oppStats.maxHp,
        hp: oppStats.maxHp,
        maxMp: oppStats.maxMp,
        mp: oppStats.maxMp,
        physicalAttack: oppStats.physicalAttack,
        magicAttack: oppStats.magicAttack,
        defense: oppStats.defense,
        speed: oppStats.speed,
        dodgeRate: oppStats.dodgeRate,
        criticalRate: oppStats.criticalRate
      },
      skills: oppSkills,
      buffs: [],
      cooldowns: {},
      isAlive: true,
      actionValue: 0
    }

    matchState.value = 'ready'

    // 调用 battleStore.startWildBattle
    const result = await battleStore.startWildBattle(
      detail.id,
      detail.name,
      detail.statsBreakdown,
      detail.skills,
      enemyCombatant
    )

    if (result.success) {
      matchState.value = 'in_battle'
    } else {
      matchState.value = 'found'
    }

    return result
  }

  /**
   * 结算 PVP 战斗
   * 调用结算 API，更新竞技场玩家数据（积分、胜败场、胜率、段位）
   * @param won - 是否获胜
   */
  async function settleBattle(won: boolean): Promise<{ success: boolean; message: string }> {
    const arena = useArenaStore()

    if (!opponent.value || !arena.playerData) {
      return { success: false, message: '缺少对手或玩家数据' }
    }

    matchState.value = 'settling'

    try {
      const res = await settlePvpBattleApi(
        opponent.value.characterId,
        won,
        arena.playerData.score,
        opponent.value.score
      )

      if (res.code === 200) {
        scoreResult.value = res.data

        // 更新竞技场玩家数据
        const newWins = arena.playerData.wins + (won ? 1 : 0)
        const newLosses = arena.playerData.losses + (won ? 0 : 1)
        const newScore = res.data.newScore
        const newTier = resolveTier(newScore)

        arena.playerData = {
          ...arena.playerData,
          score: newScore,
          tier: newTier.tier,
          subTier: newTier.subTier,
          wins: newWins,
          losses: newLosses,
          winRate: (arena.playerData.wins + (won ? 1 : 0)) / (arena.playerData.wins + arena.playerData.losses + 1)
        }

        return { success: true, message: res.message }
      }

      matchState.value = 'in_battle'
      return { success: false, message: res.message }
    } catch (err: unknown) {
      matchState.value = 'in_battle'
      const message = err instanceof Error ? err.message : '结算失败'
      return { success: false, message }
    }
  }

  /**
   * 重置匹配状态
   * 清除所有匹配相关数据
   */
  function resetMatch(): void {
    matchState.value = 'idle'
    opponent.value = null
    scoreResult.value = null
  }

  return {
    // 状态
    matchState,
    opponent,
    scoreResult,
    // 计算属性
    isMatching,
    estimatedScore,
    // 方法
    startMatchmaking,
    cancelMatchmaking,
    confirmBattle,
    settleBattle,
    resetMatch
  }
})
