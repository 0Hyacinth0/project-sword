/**
 * 好友系统 API
 * 获取好友列表、搜索玩家、发送/接受/拒绝请求、删除好友
 */
import request from './request'
import type { ApiResponse } from './request'
import type { FriendInfo, FriendRequest, SearchPlayerResult } from '../types/social'

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取好友列表
 */
export async function getFriendListApi(): Promise<ApiResponse<{ friends: FriendInfo[]; pendingRequests: FriendRequest[]; sentRequests: FriendRequest[] }>> {
  const res = await request.get<ApiResponse<{ friends: FriendInfo[]; pendingRequests: FriendRequest[]; sentRequests: FriendRequest[] }>>('/social/friends')
  // 后端可能返回 null 或不同结构，标准化
  const raw = res.data.data as Record<string, unknown> | null
  if (!raw) {
    res.data.data = { friends: [], pendingRequests: [], sentRequests: [] }
  } else {
    res.data.data = {
      friends: (raw.friends as FriendInfo[]) || [],
      pendingRequests: (raw.pendingRequests as FriendRequest[]) || [],
      sentRequests: (raw.sentRequests as FriendRequest[]) || [],
    }
  }
  return res.data
}

/**
 * 搜索玩家
 * @param keyword - 搜索关键词（角色名）
 */
export async function searchPlayerApi(keyword: string): Promise<ApiResponse<SearchPlayerResult[]>> {
  const res = await request.get<ApiResponse<SearchPlayerResult[]>>('/social/search', { params: { keyword } })
  // 后端可能返回 null 或不同结构，标准化为数组
  if (!res.data.data) {
    res.data.data = []
  }
  return res.data
}

/**
 * 发送好友请求
 * @param toCharacterId - 目标角色 ID
 */
export async function sendFriendRequestApi(toCharacterId: string): Promise<ApiResponse<FriendRequest>> {
  const res = await request.post<ApiResponse<FriendRequest>>('/social/request', { toCharacterId })
  // 后端可能不返回 status 字段，补充默认值
  if (res.data.data && !res.data.data.status) {
    res.data.data.status = 'pending'
  }
  return res.data
}

/**
 * 接受好友请求
 * @param requestId - 请求 ID
 */
export async function acceptFriendRequestApi(requestId: string): Promise<ApiResponse<FriendInfo | null>> {
  const res = await request.post<ApiResponse<FriendInfo | null>>('/social/accept', { requestId })
  return res.data
}

/**
 * 拒绝好友请求
 * @param requestId - 请求 ID
 */
export async function rejectFriendRequestApi(requestId: string): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/social/reject', { requestId })
  return res.data
}

/**
 * 删除好友
 * @param friendCharacterId - 好友角色 ID
 */
export async function deleteFriendApi(friendCharacterId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<null>>('/social/remove', { params: { friendCharacterId } })
  return res.data
}

/**
 * 取消好友请求
 * @param requestId - 请求 ID
 */
export async function cancelFriendRequestApi(requestId: string): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/social/cancel', { requestId })
  return res.data
}
