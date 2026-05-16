/**
 * 好友系统状态管理
 * 管理好友列表、好友请求、搜索结果
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getFriendListApi,
  searchPlayerApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  deleteFriendApi,
  cancelFriendRequestApi
} from '../api/social'
import type { FriendInfo, FriendRequest, SearchPlayerResult } from '../types/social'
import { generateFriendMirrorCombatant } from '../config/pvp_config'
import { getActiveBattleSkills } from '../config/skill_config'
import { professionToJobType } from '../config/job_config'
import { calculateFullStats } from '../utils/attributeCalculator'
import { useBattleStore } from './battle'
import { useCharacterStore } from './character'

export const useSocialStore = defineStore('social', () => {
  // ── 状态 ──
  const friends = ref<FriendInfo[]>([])
  const pendingRequests = ref<FriendRequest[]>([])
  const sentRequests = ref<FriendRequest[]>([])
  const searchResults = ref<SearchPlayerResult[]>([])
  const loading = ref(false)
  const searchLoading = ref(false)
  const actionLoading = ref(false)
  const errorMsg = ref('')

  // ── 计算属性 ──

  /** 在线好友列表 */
  const onlineFriends = computed(() =>
    friends.value.filter(f => f.status === 'online' || f.status === 'busy')
  )

  /** 离线好友列表 */
  const offlineFriends = computed(() =>
    friends.value.filter(f => f.status === 'offline')
  )

  /** 在线好友数量 */
  const onlineCount = computed(() => onlineFriends.value.length)

  /** 待处理请求数量 */
  const pendingCount = computed(() => pendingRequests.value.length)

  // ── 方法 ──

  /**
   * 加载好友列表和请求
   */
  async function fetchFriendList(): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getFriendListApi()
      if (res.code === 200 && res.data) {
        friends.value = res.data.friends
        pendingRequests.value = res.data.pendingRequests
        sentRequests.value = res.data.sentRequests
        return true
      }
      errorMsg.value = res.message
      return false
    } catch {
      errorMsg.value = '获取好友列表失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索玩家
   * @param keyword - 搜索关键词
   */
  async function searchPlayers(keyword: string): Promise<boolean> {
    if (!keyword || keyword.trim().length < 2) {
      searchResults.value = []
      return true
    }
    searchLoading.value = true
    try {
      const res = await searchPlayerApi(keyword.trim())
      if (res.code === 200) {
        searchResults.value = res.data
        return true
      }
      return false
    } catch {
      return false
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * 清空搜索结果
   */
  function clearSearchResults(): void {
    searchResults.value = []
  }

  /**
   * 发送好友请求
   * @param toCharacterId - 目标角色 ID
   */
  async function sendRequest(toCharacterId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await sendFriendRequestApi(toCharacterId)
      if (res.code === 200 && res.data) {
        sentRequests.value.push(res.data)
        // 更新搜索结果中对应条目的 hasPendingRequest
        const item = searchResults.value.find(r => r.characterId === toCharacterId)
        if (item) item.hasPendingRequest = true
        return { success: true, message: '好友请求已发送' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '发送请求失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 接受好友请求
   * @param requestId - 请求 ID
   */
  async function acceptRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await acceptFriendRequestApi(requestId)
      if (res.code === 200 && res.data) {
        friends.value.push(res.data)
        pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId)
        return { success: true, message: '已添加好友' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 拒绝好友请求
   * @param requestId - 请求 ID
   */
  async function rejectRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await rejectFriendRequestApi(requestId)
      if (res.code === 200) {
        pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId)
        return { success: true, message: '已拒绝请求' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 删除好友
   * @param friendCharacterId - 好友角色 ID
   */
  async function removeFriend(friendCharacterId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await deleteFriendApi(friendCharacterId)
      if (res.code === 200) {
        friends.value = friends.value.filter(f => f.characterId !== friendCharacterId)
        return { success: true, message: '好友已删除' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 取消已发送的好友请求
   * @param requestId - 请求 ID
   */
  async function cancelSentRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await cancelFriendRequestApi(requestId)
      if (res.code === 200) {
        sentRequests.value = sentRequests.value.filter(r => r.id !== requestId)
        return { success: true, message: '请求已取消' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 清空状态（登出时调用）
   */
  function clear(): void {
    friends.value = []
    pendingRequests.value = []
    sentRequests.value = []
    searchResults.value = []
    loading.value = false
    searchLoading.value = false
    actionLoading.value = false
    errorMsg.value = ''
  }

  /**
   * 发起异步 PVP 挑战（好友镜像战斗）
   * 根据好友 profession/level 生成镜像对手，复用战斗引擎
   * @param friend - 好友信息
   * @returns 操作结果
   */
  async function startAsyncPvpBattle(friend: {
    characterId: string
    characterName: string
    profession: string
    level: number
  }): Promise<{ success: boolean; message: string }> {
    const characterStore = useCharacterStore()
    const battleStore = useBattleStore()
    const detail = characterStore.characterDetail

    if (!detail) {
      return { success: false, message: '缺少角色详情数据' }
    }

    const enemyCombatant = generateFriendMirrorCombatant(friend)

    const attrs = {
      strength: detail.strength,
      intelligence: detail.intelligence,
      agility: detail.agility
    }
    const statsBreakdown = calculateFullStats(attrs, detail.profession, detail.equipment, null)
    const skills = getActiveBattleSkills(professionToJobType(detail.profession), detail.level)

    return battleStore.startWildBattle(
      detail.id,
      detail.characterName,
      statsBreakdown,
      skills,
      enemyCombatant
    )
  }

  return {
    friends,
    pendingRequests,
    sentRequests,
    searchResults,
    loading,
    searchLoading,
    actionLoading,
    errorMsg,
    onlineFriends,
    offlineFriends,
    onlineCount,
    pendingCount,
    fetchFriendList,
    searchPlayers,
    clearSearchResults,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    cancelSentRequest,
    clear,
    startAsyncPvpBattle
  }
})