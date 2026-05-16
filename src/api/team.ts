/**
 * 组队系统 API
 * 创建队伍、获取队伍列表、邀请/申请加入、踢人、离开、解散
 */
import request from './request'
import type { ApiResponse } from './request'
import type { TeamInfo, TeamMember, TeamApplication } from '../types/team'
import { isMockEnabled } from '../utils/mockConfig'
import { createMockTeamMember, getMockCurrentCharacterProfile } from './mockSession'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// Mock 队伍数据
// ──────────────────────────────────────────

/** Mock 公开队伍列表 */
const mockTeamList: TeamInfo[] = [
  {
    id: 'team-001',
    leaderId: 'char-leader-001',
    leaderName: '雷霆战士',
    members: [
      {
        characterId: 'char-leader-001',
        characterName: '雷霆战士',
        profession: 'Warrior',
        level: 25,
        role: 'leader',
        status: 'online',
        joinedAt: '2026-05-10T08:00:00Z'
      },
      {
        characterId: 'char-member-001',
        characterName: '冰霜法师',
        profession: 'Mage',
        level: 22,
        role: 'member',
        status: 'online',
        joinedAt: '2026-05-10T08:30:00Z'
      }
    ],
    maxMembers: 4,
    status: 'open',
    targetDungeon: 'mist_forest_normal',
    createdAt: '2026-05-10T08:00:00Z'
  },
  {
    id: 'team-002',
    leaderId: 'char-leader-002',
    leaderName: '暗影猎手',
    members: [
      {
        characterId: 'char-leader-002',
        characterName: '暗影猎手',
        profession: 'Hunter',
        level: 30,
        role: 'leader',
        status: 'online',
        joinedAt: '2026-05-12T10:00:00Z'
      }
    ],
    maxMembers: 4,
    status: 'open',
    createdAt: '2026-05-12T10:00:00Z'
  }
]

/** Mock 我的队伍（空） */
let mockMyTeam: TeamInfo | null = null

/** Mock 入队申请 */
const mockApplications: TeamApplication[] = [
  {
    id: 'app-001',
    teamId: 'team-001',
    applicantId: 'char-applicant-001',
    applicantName: '火焰之心',
    applicantProfession: 'Mage',
    applicantLevel: 20,
    status: 'pending',
    createdAt: '2026-05-14T09:00:00Z'
  }
]

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 创建队伍
 * @returns 创建的队伍信息
 */
export async function createTeamApi(): Promise<ApiResponse<TeamInfo>> {
  if (isMockEnabled()) {
    await delay(300)
    const currentProfile = getMockCurrentCharacterProfile()
    const newTeam: TeamInfo = {
      id: `team-${Date.now()}`,
      leaderId: currentProfile.characterId,
      leaderName: currentProfile.characterName,
      members: [createMockTeamMember(currentProfile, 'leader')],
      maxMembers: 4,
      status: 'open',
      createdAt: new Date().toISOString()
    }
    mockMyTeam = newTeam
    return { code: 200, message: '队伍创建成功', data: newTeam }
  }
  const res = await request.post<ApiResponse<TeamInfo>>('/team/create')
  return res.data
}

/**
 * 获取公开队伍列表
 * @returns 队伍列表
 */
export async function getTeamListApi(): Promise<ApiResponse<TeamInfo[]>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '获取成功', data: mockTeamList }
  }
  const res = await request.get<ApiResponse<TeamInfo[]>>('/team/list')
  return res.data
}

/**
 * 获取我的队伍
 * @returns 当前所在队伍，null 表示未在队伍中
 */
export async function getMyTeamApi(): Promise<ApiResponse<TeamInfo | null>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '获取成功', data: mockMyTeam }
  }
  const res = await request.get<ApiResponse<TeamInfo | null>>('/team/my')
  return res.data
}

/**
 * 邀请好友加入队伍
 * @param characterId - 好友角色 ID
 */
export async function inviteToTeamApi(characterId: string): Promise<ApiResponse<TeamMember>> {
  if (isMockEnabled()) {
    await delay(300)
    if (!mockMyTeam) {
      return { code: 400, message: '未在队伍中', data: null as unknown as TeamMember }
    }
    const newMember: TeamMember = {
      characterId,
      characterName: '受邀好友',
      profession: 'Hunter',
      level: 20,
      role: 'member',
      status: 'online',
      joinedAt: new Date().toISOString()
    }
    mockMyTeam.members.push(newMember)
    return { code: 200, message: '邀请已发送', data: newMember }
  }
  const res = await request.post<ApiResponse<TeamMember>>('/team/invite', { characterId })
  return res.data
}

/**
 * 申请加入队伍
 * @param teamId - 队伍 ID
 */
export async function applyToTeamApi(teamId: string): Promise<ApiResponse<TeamApplication>> {
  if (isMockEnabled()) {
    await delay(300)
    const currentProfile = getMockCurrentCharacterProfile()
    const newApp: TeamApplication = {
      id: `app-${Date.now()}`,
      teamId,
      applicantId: currentProfile.characterId,
      applicantName: currentProfile.characterName,
      applicantProfession: currentProfile.profession,
      applicantLevel: currentProfile.level,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    return { code: 200, message: '申请已提交', data: newApp }
  }
  const res = await request.post<ApiResponse<TeamApplication>>('/team/apply', { teamId })
  return res.data
}

/**
 * 获取入队申请列表（队长专用）
 * @param teamId - 队伍 ID
 */
export async function getTeamApplicationsApi(teamId: string): Promise<ApiResponse<TeamApplication[]>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '获取成功', data: mockApplications.filter(a => a.teamId === teamId) }
  }
  const res = await request.get<ApiResponse<TeamApplication[]>>(`/team/applications/${teamId}`)
  return res.data
}

/**
 * 接受入队申请
 * @param applicationId - 申请 ID
 */
export async function acceptApplicationApi(applicationId: string): Promise<ApiResponse<TeamMember>> {
  if (isMockEnabled()) {
    await delay(300)
    const app = mockApplications.find(a => a.id === applicationId)
    if (!app || !mockMyTeam) {
      return { code: 404, message: '申请不存在', data: null as unknown as TeamMember }
    }
    app.status = 'accepted'
    const newMember: TeamMember = {
      characterId: app.applicantId,
      characterName: app.applicantName,
      profession: app.applicantProfession,
      level: app.applicantLevel,
      role: 'member',
      status: 'online',
      joinedAt: new Date().toISOString()
    }
    mockMyTeam.members.push(newMember)
    return { code: 200, message: '已接受申请', data: newMember }
  }
  const res = await request.post<ApiResponse<TeamMember>>('/team/accept', { applicationId })
  return res.data
}

/**
 * 拒绝入队申请
 * @param applicationId - 申请 ID
 */
export async function rejectApplicationApi(applicationId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    const app = mockApplications.find(a => a.id === applicationId)
    if (app) app.status = 'rejected'
    return { code: 200, message: '已拒绝申请', data: null }
  }
  const res = await request.post<ApiResponse<null>>('/team/reject', { applicationId })
  return res.data
}

/**
 * 踢出队伍成员
 * @param characterId - 成员角色 ID
 */
export async function kickMemberApi(characterId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    if (!mockMyTeam) {
      return { code: 400, message: '未在队伍中', data: null }
    }
    mockMyTeam.members = mockMyTeam.members.filter(m => m.characterId !== characterId)
    return { code: 200, message: '已踢出成员', data: null }
  }
  const res = await request.delete<ApiResponse<null>>(`/team/kick/${characterId}`)
  return res.data
}

/**
 * 离开队伍
 */
export async function leaveTeamApi(): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    mockMyTeam = null
    return { code: 200, message: '已离开队伍', data: null }
  }
  const res = await request.post<ApiResponse<null>>('/team/leave')
  return res.data
}

/**
 * 解散队伍（队长专用）
 */
export async function disbandTeamApi(): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    mockMyTeam = null
    return { code: 200, message: '队伍已解散', data: null }
  }
  const res = await request.delete<ApiResponse<null>>('/team/disband')
  return res.data
}

/**
 * 转让队长
 * @param characterId - 新队长角色 ID
 */
export async function changeLeaderApi(characterId: string): Promise<ApiResponse<TeamInfo>> {
  if (isMockEnabled()) {
    await delay(300)
    if (!mockMyTeam) {
      return { code: 400, message: '未在队伍中', data: null as unknown as TeamInfo }
    }
    const oldLeader = mockMyTeam.members.find(m => m.role === 'leader')
    const newLeader = mockMyTeam.members.find(m => m.characterId === characterId)
    if (oldLeader && newLeader) {
      oldLeader.role = 'member'
      newLeader.role = 'leader'
      mockMyTeam.leaderId = characterId
      mockMyTeam.leaderName = newLeader.characterName
    }
    return { code: 200, message: '队长已转让', data: mockMyTeam }
  }
  const res = await request.post<ApiResponse<TeamInfo>>('/team/change-leader', { characterId })
  return res.data
}

/**
 * 切换队伍开放状态
 * @param status - 队伍状态
 */
export async function toggleTeamStatusApi(status: 'open' | 'closed'): Promise<ApiResponse<TeamInfo>> {
  if (isMockEnabled()) {
    await delay(200)
    if (!mockMyTeam) {
      return { code: 400, message: '未在队伍中', data: null as unknown as TeamInfo }
    }
    mockMyTeam.status = status
    return { code: 200, message: '状态已更新', data: mockMyTeam }
  }
  const res = await request.post<ApiResponse<TeamInfo>>('/team/status', { status })
  return res.data
}
