/**
 * 组队系统状态管理
 * 管理队伍信息、成员、申请列表
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createTeamApi,
  getTeamListApi,
  getMyTeamApi,
  inviteToTeamApi,
  applyToTeamApi,
  getTeamApplicationsApi,
  acceptApplicationApi,
  rejectApplicationApi,
  kickMemberApi,
  leaveTeamApi,
  disbandTeamApi,
  changeLeaderApi,
  toggleTeamStatusApi
} from '../api/team'
import { getMockCurrentCharacterId } from '../api/mockSession'
import type { TeamInfo, TeamApplication } from '../types/team'

export const useTeamStore = defineStore('team', () => {
  // ── 状态 ──
  const myTeam = ref<TeamInfo | null>(null)
  const teamList = ref<TeamInfo[]>([])
  const applications = ref<TeamApplication[]>([])
  const loading = ref(false)
  const actionLoading = ref(false)
  const errorMsg = ref('')
  const dungeonRoomId = ref<string | null>(null)

  // ── 计算属性 ──

  /** 是否为队长 */
  const isLeader = computed(() => {
    if (!myTeam.value) return false
    return myTeam.value.leaderId === getMockCurrentCharacterId()
  })

  /** 当前队伍人数 */
  const memberCount = computed(() => myTeam.value?.members.length ?? 0)

  /** 是否在队伍中 */
  const isInTeam = computed(() => myTeam.value !== null)

  // ── 方法 ──

  /**
   * 加载我的队伍信息
   */
  async function fetchMyTeam(): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getMyTeamApi()
      if (res.code === 200) {
        myTeam.value = res.data
        return true
      }
      errorMsg.value = res.message
      return false
    } catch {
      errorMsg.value = '获取队伍信息失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载公开队伍列表
   */
  async function fetchTeamList(): Promise<boolean> {
    loading.value = true
    try {
      const res = await getTeamListApi()
      if (res.code === 200) {
        teamList.value = res.data
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
   * 创建队伍
   */
  async function createTeam(): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await createTeamApi()
      if (res.code === 200 && res.data) {
        myTeam.value = res.data
        return { success: true, message: '队伍创建成功' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '创建队伍失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 邀请好友加入队伍
   * @param characterId - 好友角色 ID
   */
  async function inviteFriend(characterId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await inviteToTeamApi(characterId)
      if (res.code === 200 && res.data) {
        if (myTeam.value && !myTeam.value.members.some(member => member.characterId === res.data.characterId)) {
          myTeam.value.members.push(res.data)
        }
        return { success: true, message: '邀请已发送' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '邀请失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 申请加入队伍
   * @param teamId - 队伍 ID
   */
  async function applyToTeam(teamId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await applyToTeamApi(teamId)
      if (res.code === 200) {
        return { success: true, message: '申请已提交' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '申请失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 加载入队申请列表
   */
  async function fetchApplications(): Promise<boolean> {
    if (!myTeam.value) return false
    try {
      const res = await getTeamApplicationsApi(myTeam.value.id)
      if (res.code === 200) {
        applications.value = res.data
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 接受入队申请
   * @param applicationId - 申请 ID
   */
  async function acceptApp(applicationId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await acceptApplicationApi(applicationId)
      if (res.code === 200 && res.data) {
        if (myTeam.value && !myTeam.value.members.some(member => member.characterId === res.data.characterId)) {
          myTeam.value.members.push(res.data)
        }
        applications.value = applications.value.filter(a => a.id !== applicationId)
        return { success: true, message: '已接受申请' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 拒绝入队申请
   * @param applicationId - 申请 ID
   */
  async function rejectApp(applicationId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await rejectApplicationApi(applicationId)
      if (res.code === 200) {
        applications.value = applications.value.filter(a => a.id !== applicationId)
        return { success: true, message: '已拒绝申请' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 踢出队伍成员
   * @param characterId - 成员角色 ID
   */
  async function kickMember(characterId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await kickMemberApi(characterId)
      if (res.code === 200) {
        if (myTeam.value) {
          myTeam.value.members = myTeam.value.members.filter(m => m.characterId !== characterId)
        }
        return { success: true, message: '已踢出成员' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 离开队伍
   */
  async function leaveTeam(): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await leaveTeamApi()
      if (res.code === 200) {
        myTeam.value = null
        applications.value = []
        return { success: true, message: '已离开队伍' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 解散队伍（队长专用）
   */
  async function disbandTeam(): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await disbandTeamApi()
      if (res.code === 200) {
        myTeam.value = null
        applications.value = []
        return { success: true, message: '队伍已解散' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 转让队长
   * @param characterId - 新队长角色 ID
   */
  async function changeLeader(characterId: string): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await changeLeaderApi(characterId)
      if (res.code === 200 && res.data) {
        myTeam.value = res.data
        return { success: true, message: '队长已转让' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: '操作失败' }
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 切换队伍开放状态
   * @param status - 队伍状态
   */
  async function toggleStatus(status: 'open' | 'closed'): Promise<{ success: boolean; message: string }> {
    actionLoading.value = true
    try {
      const res = await toggleTeamStatusApi(status)
      if (res.code === 200 && res.data) {
        myTeam.value = res.data
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
   * 设置副本房间 ID
   * @param roomId - 房间 ID
   */
  function setDungeonRoom(roomId: string | null): void {
    dungeonRoomId.value = roomId
  }

  /**
   * 清空状态（登出时调用）
   */
  function clear(): void {
    myTeam.value = null
    teamList.value = []
    applications.value = []
    dungeonRoomId.value = null
    loading.value = false
    actionLoading.value = false
    errorMsg.value = ''
  }

  return {
    myTeam,
    teamList,
    applications,
    loading,
    actionLoading,
    errorMsg,
    dungeonRoomId,
    isLeader,
    memberCount,
    isInTeam,
    fetchMyTeam,
    fetchTeamList,
    createTeam,
    inviteFriend,
    applyToTeam,
    fetchApplications,
    acceptApp,
    rejectApp,
    kickMember,
    leaveTeam,
    disbandTeam,
    changeLeader,
    toggleStatus,
    setDungeonRoom,
    clear
  }
})
