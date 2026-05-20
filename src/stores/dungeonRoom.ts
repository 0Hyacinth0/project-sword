/**
 * 副本房间状态管理
 * 管理多人副本大厅的房间信息、准备状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createDungeonRoomApi,
  getDungeonRoomApi,
  toggleReadyApi,
  startDungeonRoomApi,
  leaveDungeonRoomApi,
  cancelDungeonRoomApi
} from '../api/dungeonRoom'
import type { DungeonRoom } from '../types/team'

/** 获取当前选中角色 ID */
function getCurrentCharacterId(): string {
  return sessionStorage.getItem('selected_character_id') || ''
}

export const useDungeonRoomStore = defineStore('dungeonRoom', () => {
  // ── 状态 ──
  const currentRoom = ref<DungeonRoom | null>(null)
  const loading = ref(false)
  const actionLoading = ref(false)
  const errorMsg = ref('')

  // ── 计算属性 ──

  /** 是否全员准备 */
  const isAllReady = computed(() => {
    if (!currentRoom.value) return false
    return currentRoom.value.members.every(m => m.readyStatus === 'ready')
  })

  /** 当前玩家是否已准备 */
  const amReady = computed(() => {
    if (!currentRoom.value) return false
    const me = currentRoom.value.members.find(m => m.characterId === getCurrentCharacterId())
    return me?.readyStatus === 'ready'
  })

  /** 是否为房间队长 */
  const isRoomLeader = computed(() => {
    if (!currentRoom.value) return false
    return currentRoom.value.leaderId === getCurrentCharacterId()
  })

  /** 是否在房间中 */
  const isInRoom = computed(() => currentRoom.value !== null)

  // ── 方法 ──

  /**
   * 创建副本房间
   * @param teamId - 队伍 ID
   * @param dungeonId - 副本 ID
   * @param teamMembers - 队伍成员列表
   * @param leaderId - 队长 ID
   */
  async function createRoom(
    teamId: string,
    dungeonId: string,
    teamMembers: { characterId: string; characterName: string; profession: string; level: number; role: string }[],
    leaderId: string
  ): Promise<{ success: boolean; message: string }> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await createDungeonRoomApi(teamId, dungeonId, teamMembers, leaderId)
      if (res.code === 200 && res.data) {
        currentRoom.value = res.data
        return { success: true, message: '房间创建成功' }
      }
      errorMsg.value = res.message
      return { success: false, message: res.message }
    } catch {
      errorMsg.value = '创建房间失败'
      return { success: false, message: '创建房间失败' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取房间信息
   * @param roomId - 房间 ID
   */
  async function fetchRoom(roomId: string): Promise<boolean> {
    loading.value = true
    try {
      const res = await getDungeonRoomApi(roomId)
      if (res.code === 200 && res.data) {
        currentRoom.value = res.data
        return true
      }
      return false
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换准备状态
   */
  async function toggleReady(): Promise<{ success: boolean; message: string }> {
    if (!currentRoom.value) {
      return { success: false, message: '未在房间中' }
    }
    actionLoading.value = true
    try {
      const res = await toggleReadyApi(currentRoom.value.roomId)
      if (res.code === 200 && res.data) {
        currentRoom.value = res.data
        return { success: true, message: '状态已更新' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 开始挑战（队长专用）
   */
  async function startChallenge(): Promise<{ success: boolean; message: string }> {
    if (!currentRoom.value) {
      return { success: false, message: '未在房间中' }
    }
    actionLoading.value = true
    try {
      const res = await startDungeonRoomApi(currentRoom.value.roomId)
      if (res.code === 200 && res.data) {
        currentRoom.value = res.data
        return { success: true, message: '挑战开始' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 离开房间
   */
  async function leaveRoom(): Promise<{ success: boolean; message: string }> {
    if (!currentRoom.value) {
      return { success: false, message: '未在房间中' }
    }
    actionLoading.value = true
    try {
      const res = await leaveDungeonRoomApi(currentRoom.value.roomId)
      if (res.code === 200) {
        currentRoom.value = null
        return { success: true, message: '已离开房间' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 取消房间（队长专用）
   */
  async function cancelRoom(): Promise<{ success: boolean; message: string }> {
    if (!currentRoom.value) {
      return { success: false, message: '未在房间中' }
    }
    actionLoading.value = true
    try {
      const res = await cancelDungeonRoomApi(currentRoom.value.roomId)
      if (res.code === 200) {
        currentRoom.value = null
        return { success: true, message: '房间已取消' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 清空状态
   */
  function clear(): void {
    currentRoom.value = null
    loading.value = false
    actionLoading.value = false
    errorMsg.value = ''
  }

  return {
    currentRoom,
    loading,
    actionLoading,
    errorMsg,
    isAllReady,
    amReady,
    isRoomLeader,
    isInRoom,
    createRoom,
    fetchRoom,
    toggleReady,
    startChallenge,
    leaveRoom,
    cancelRoom,
    clear
  }
})
