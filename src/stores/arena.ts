/**
 * 竞技场状态管理
 * 管理赛季信息、玩家段位数据、加载状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getArenaSeasonApi, getArenaPlayerDataApi } from '../api/arena'
import { resolveTier, getTierConfig } from '../config/arena_config'
import type { ArenaSeason, ArenaPlayerData } from '../types/arena'

/**
 * 竞技场状态管理
 * 管理赛季信息、玩家段位数据、加载状态
 */
export const useArenaStore = defineStore('arena', () => {
  // ── 状态 ──
  const season = ref<ArenaSeason | null>(null)
  const playerData = ref<ArenaPlayerData | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──
  /** 段位信息（通过积分解析） */
  const tierInfo = computed(() => {
    if (!playerData.value) return null
    return resolveTier(playerData.value.score)
  })

  /** 当前段位配置 */
  const currentTierConfig = computed(() => {
    if (!playerData.value) return null
    return getTierConfig(playerData.value.tier)
  })

  /** 赛季剩余天数 */
  const daysRemaining = computed(() => {
    if (!season.value) return 0
    const endDate = new Date(season.value.endDate)
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  /** 赛季剩余小时（天数的小数部分） */
  const hoursRemaining = computed(() => {
    if (!season.value) return 0
    const endDate = new Date(season.value.endDate)
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, diff / (1000 * 60 * 60))
  })

  /** 赛季显示名称 */
  const seasonDisplayName = computed(() => {
    if (!season.value) return '无赛季'
    return `S${season.value.seasonNumber} · ${season.value.seasonName}`
  })

  // ── 方法 ──
  /**
   * 获取竞技场数据
   * 并行加载赛季信息和玩家数据
   */
  async function fetchArenaData(): Promise<void> {
    loading.value = true
    try {
      const [seasonRes, playerRes] = await Promise.all([
        getArenaSeasonApi(),
        getArenaPlayerDataApi()
      ])

      if (seasonRes.code === 200) {
        season.value = seasonRes.data
      }

      if (playerRes.code === 200) {
        playerData.value = playerRes.data
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置数据（用于切换场景或清除缓存）
   */
  function reset(): void {
    season.value = null
    playerData.value = null
    loading.value = false
  }

  return {
    // 状态
    season,
    playerData,
    loading,
    // 计算属性
    tierInfo,
    currentTierConfig,
    daysRemaining,
    hoursRemaining,
    seasonDisplayName,
    // 方法
    fetchArenaData,
    reset
  }
})