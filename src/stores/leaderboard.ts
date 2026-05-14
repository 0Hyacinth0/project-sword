/**
 * 排行榜状态管理
 * 管理排行榜分类切换、范围切换、数据缓存
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLeaderboardApi } from '../api/leaderboard'
import type { LeaderboardCategory, LeaderboardScope, LeaderboardEntry, LeaderboardResponse } from '../types/leaderboard'

/**
 * 排行榜状态管理
 * 管理排行榜分类切换、范围切换、数据缓存
 */
export const useLeaderboardStore = defineStore('leaderboard', () => {
  // ── 状态 ──
  const category = ref<LeaderboardCategory>('level')
  const scope = ref<LeaderboardScope>('all')
  const entries = ref<LeaderboardEntry[]>([])
  const myRank = ref(0)
  const myValue = ref(0)
  const loading = ref(false)

  /** 缓存：key = "category:scope" */
  const cache = ref<Record<string, LeaderboardResponse>>({})

  // ── 计算属性 ──
  /** 前三名 */
  const topThree = computed(() => entries.value.slice(0, 3))

  /** 第 4 名及以后 */
  const restList = computed(() => entries.value.slice(3))

  /** 缓存 key */
  const cacheKey = computed(() => `${category.value}:${scope.value}`)

  /**
   * 获取排行榜数据
   * 优先从缓存读取，无缓存则请求 API
   */
  async function fetchLeaderboard(): Promise<void> {
    if (cache.value[cacheKey.value]) {
      const cached = cache.value[cacheKey.value]
      entries.value = cached.entries
      myRank.value = cached.myRank
      myValue.value = cached.myValue
      return
    }

    loading.value = true
    try {
      const res = await getLeaderboardApi(category.value, scope.value)
      if (res.code === 200) {
        entries.value = res.data.entries
        myRank.value = res.data.myRank
        myValue.value = res.data.myValue
        cache.value[cacheKey.value] = res.data
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换分类
   * @param newCategory - 新分类
   */
  async function setCategory(newCategory: LeaderboardCategory): Promise<void> {
    if (category.value === newCategory) return
    category.value = newCategory
    await fetchLeaderboard()
  }

  /**
   * 切换范围
   * @param newScope - 新范围
   */
  async function setScope(newScope: LeaderboardScope): Promise<void> {
    if (scope.value === newScope) return
    scope.value = newScope
    await fetchLeaderboard()
  }

  /** 清除缓存（用于强制刷新） */
  function clearCache(): void {
    cache.value = {}
  }

  return {
    category,
    scope,
    entries,
    myRank,
    myValue,
    loading,
    topThree,
    restList,
    fetchLeaderboard,
    setCategory,
    setScope,
    clearCache
  }
})