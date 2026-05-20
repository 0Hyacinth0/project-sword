/**
 * 组队系统 API
 * 创建队伍、获取队伍列表、邀请/申请加入、踢人、离开、解散
 */
import request from './request'
import type { ApiResponse } from './request'
import type { TeamInfo, TeamMember, TeamApplication } from '../types/team'

/**
 * 创建队伍
 * @returns 创建的队伍信息
 */
export async function createTeamApi(): Promise<ApiResponse<TeamInfo>> {
  const res = await request.post<ApiResponse<TeamInfo>>('/team/create')
  return res.data
}

/**
 * 获取公开队伍列表
 * @returns 队伍列表
 */
export async function getTeamListApi(): Promise<ApiResponse<TeamInfo[]>> {
  const res = await request.get<ApiResponse<TeamInfo[]>>('/team/list')
  return res.data
}

/**
 * 获取我的队伍
 * @returns 当前所在队伍，null 表示未在队伍中
 */
export async function getMyTeamApi(): Promise<ApiResponse<TeamInfo | null>> {
  const res = await request.get<ApiResponse<TeamInfo | null>>('/team/my')
  return res.data
}

/**
 * 邀请好友加入队伍
 * @param characterId - 好友角色 ID
 */
export async function inviteToTeamApi(characterId: string): Promise<ApiResponse<TeamMember>> {
  const res = await request.post<ApiResponse<TeamMember>>('/team/invite', { characterId })
  return res.data
}

/**
 * 申请加入队伍
 * @param teamId - 队伍 ID
 */
export async function applyToTeamApi(teamId: string): Promise<ApiResponse<TeamApplication>> {
  const res = await request.post<ApiResponse<TeamApplication>>('/team/apply', { teamId })
  return res.data
}

/**
 * 获取入队申请列表（队长专用）
 * @param teamId - 队伍 ID
 */
export async function getTeamApplicationsApi(teamId: string): Promise<ApiResponse<TeamApplication[]>> {
  const res = await request.get<ApiResponse<TeamApplication[]>>(`/team/applications/${teamId}`)
  return res.data
}

/**
 * 接受入队申请
 * @param applicationId - 申请 ID
 */
export async function acceptApplicationApi(applicationId: string): Promise<ApiResponse<TeamMember>> {
  const res = await request.post<ApiResponse<TeamMember>>('/team/accept', { applicationId })
  return res.data
}

/**
 * 拒绝入队申请
 * @param applicationId - 申请 ID
 */
export async function rejectApplicationApi(applicationId: string): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/team/reject', { applicationId })
  return res.data
}

/**
 * 踢出队伍成员
 * @param characterId - 成员角色 ID
 */
export async function kickMemberApi(characterId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<null>>(`/team/kick/${characterId}`)
  return res.data
}

/**
 * 离开队伍
 */
export async function leaveTeamApi(): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/team/leave')
  return res.data
}

/**
 * 解散队伍（队长专用）
 */
export async function disbandTeamApi(): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<null>>('/team/disband')
  return res.data
}

/**
 * 转让队长
 * @param characterId - 新队长角色 ID
 */
export async function changeLeaderApi(characterId: string): Promise<ApiResponse<TeamInfo>> {
  const res = await request.post<ApiResponse<TeamInfo>>('/team/change-leader', { characterId })
  return res.data
}

/**
 * 切换队伍开放状态
 * @param status - 队伍状态
 */
export async function toggleTeamStatusApi(status: 'open' | 'closed'): Promise<ApiResponse<TeamInfo>> {
  const res = await request.post<ApiResponse<TeamInfo>>('/team/status', { status })
  return res.data
}
