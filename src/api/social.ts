/**
 * 好友系统 API
 * 获取好友列表、搜索玩家、发送/接受/拒绝请求、删除好友
 */
import request from './request'
import type { ApiResponse } from './request'
import type { FriendInfo, FriendRequest, SearchPlayerResult } from '../types/social'
import { isMockEnabled } from '../utils/mockConfig'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// Mock 好友数据
// ──────────────────────────────────────────

/** Mock 好友列表 */
const mockFriends: FriendInfo[] = [
  {
    characterId: 'char-friend-001',
    characterName: '影刃',
    profession: 'Hunter',
    level: 28,
    status: 'online',
    lastOnlineAt: null,
    addedAt: '2026-04-15T10:30:00Z'
  },
  {
    characterId: 'char-friend-002',
    characterName: '火焰领主',
    profession: 'Mage',
    level: 35,
    status: 'offline',
    lastOnlineAt: '2026-05-10T18:00:00Z',
    addedAt: '2026-03-20T14:00:00Z'
  },
  {
    characterId: 'char-friend-003',
    characterName: '冰霜女王',
    profession: 'Mage',
    level: 22,
    status: 'busy',
    lastOnlineAt: null,
    addedAt: '2026-05-01T09:00:00Z'
  }
]

/** Mock 待处理好友请求 */
const mockPendingRequests: FriendRequest[] = [
  {
    id: 'req-001',
    fromCharacterId: 'char-req-001',
    fromCharacterName: '雷霆战士',
    fromProfession: 'Warrior',
    fromLevel: 18,
    toCharacterId: 'mock-char-1',
    status: 'pending',
    createdAt: '2026-05-12T09:00:00Z'
  },
  {
    id: 'req-002',
    fromCharacterId: 'char-req-002',
    fromCharacterName: '暗夜刺客',
    fromProfession: 'Hunter',
    fromLevel: 24,
    toCharacterId: 'mock-char-1',
    status: 'pending',
    createdAt: '2026-05-13T14:30:00Z'
  }
]

/** Mock 已发送的好友请求（等待对方接受） */
const mockSentRequests: FriendRequest[] = [
  {
    id: 'req-sent-001',
    fromCharacterId: 'mock-char-1',
    fromCharacterName: '当前角色',
    fromProfession: 'Warrior',
    fromLevel: 20,
    toCharacterId: 'char-target-001',
    status: 'pending',
    createdAt: '2026-05-11T11:00:00Z'
  }
]

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取好友列表
 */
export async function getFriendListApi(): Promise<ApiResponse<{ friends: FriendInfo[]; pendingRequests: FriendRequest[]; sentRequests: FriendRequest[] }>> {
  if (isMockEnabled()) {
    return mockGetFriendList()
  }
  const res = await request.get<ApiResponse<{ friends: FriendInfo[]; pendingRequests: FriendRequest[]; sentRequests: FriendRequest[] }>>('/social/friends')
  return res.data
}

/**
 * 搜索玩家
 * @param keyword - 搜索关键词（角色名）
 */
export async function searchPlayerApi(keyword: string): Promise<ApiResponse<SearchPlayerResult[]>> {
  if (isMockEnabled()) {
    return mockSearchPlayer(keyword)
  }
  const res = await request.get<ApiResponse<SearchPlayerResult[]>>('/social/search', { params: { keyword } })
  return res.data
}

/**
 * 发送好友请求
 * @param toCharacterId - 目标角色 ID
 */
export async function sendFriendRequestApi(toCharacterId: string): Promise<ApiResponse<FriendRequest>> {
  if (isMockEnabled()) {
    return mockSendFriendRequest(toCharacterId)
  }
  const res = await request.post<ApiResponse<FriendRequest>>('/social/request', { toCharacterId })
  return res.data
}

/**
 * 接受好友请求
 * @param requestId - 请求 ID
 */
export async function acceptFriendRequestApi(requestId: string): Promise<ApiResponse<FriendInfo | null>> {
  if (isMockEnabled()) {
    return mockAcceptFriendRequest(requestId)
  }
  const res = await request.post<ApiResponse<FriendInfo | null>>('/social/accept', { requestId })
  return res.data
}

/**
 * 拒绝好友请求
 * @param requestId - 请求 ID
 */
export async function rejectFriendRequestApi(requestId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockRejectFriendRequest(requestId)
  }
  const res = await request.post<ApiResponse<null>>('/social/reject', { requestId })
  return res.data
}

/**
 * 删除好友
 * @param friendCharacterId - 好友角色 ID
 */
export async function deleteFriendApi(friendCharacterId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockDeleteFriend(friendCharacterId)
  }
  const res = await request.delete<ApiResponse<null>>('/social/remove', { params: { friendCharacterId } })
  return res.data
}

/**
 * 取消好友请求
 * @param requestId - 请求 ID
 */
export async function cancelFriendRequestApi(requestId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockCancelFriendRequest(requestId)
  }
  const res = await request.post<ApiResponse<null>>('/social/cancel', { requestId })
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

async function mockGetFriendList(): Promise<ApiResponse<{ friends: FriendInfo[]; pendingRequests: FriendRequest[]; sentRequests: FriendRequest[] }>> {
  await delay(400)
  return {
    code: 200,
    message: '获取成功',
    data: {
      friends: [...mockFriends],
      pendingRequests: [...mockPendingRequests],
      sentRequests: [...mockSentRequests]
    }
  }
}

async function mockSearchPlayer(keyword: string): Promise<ApiResponse<SearchPlayerResult[]>> {
  await delay(500)

  if (!keyword || keyword.trim().length < 2) {
    return { code: 400, message: '搜索关键词至少需要 2 个字符', data: [] }
  }

  // 模拟搜索结果（匹配角色名）
  const allPlayers: SearchPlayerResult[] = [
    {
      characterId: 'char-friend-001',
      characterName: '影刃',
      profession: 'Hunter',
      level: 28,
      isFriend: true,
      hasPendingRequest: false
    },
    {
      characterId: 'char-friend-002',
      characterName: '火焰领主',
      profession: 'Mage',
      level: 35,
      isFriend: true,
      hasPendingRequest: false
    },
    {
      characterId: 'char-search-001',
      characterName: '雷霆战士',
      profession: 'Warrior',
      level: 18,
      isFriend: false,
      hasPendingRequest: false
    },
    {
      characterId: 'char-search-002',
      characterName: '暗夜刺客',
      profession: 'Hunter',
      level: 24,
      isFriend: false,
      hasPendingRequest: false
    },
    {
      characterId: 'char-search-003',
      characterName: '光明骑士',
      profession: 'Warrior',
      level: 30,
      isFriend: false,
      hasPendingRequest: false
    },
    {
      characterId: 'char-target-001',
      characterName: '神秘法师',
      profession: 'Mage',
      level: 26,
      isFriend: false,
      hasPendingRequest: true // 已发送请求
    }
  ]

  const results = allPlayers.filter(p =>
    p.characterName.toLowerCase().includes(keyword.toLowerCase())
  )

  return { code: 200, message: '搜索成功', data: results }
}

async function mockSendFriendRequest(toCharacterId: string): Promise<ApiResponse<FriendRequest>> {
  await delay(400)

  // 检查是否已经是好友
  const isFriend = mockFriends.some(f => f.characterId === toCharacterId)
  if (isFriend) {
    return { code: 400, message: '已经是好友了', data: null as unknown as FriendRequest }
  }

  // 检查是否已发送请求
  const hasSent = mockSentRequests.some(r => r.toCharacterId === toCharacterId)
  if (hasSent) {
    return { code: 400, message: '已发送过好友请求', data: null as unknown as FriendRequest }
  }

  // 创建新请求
  const newRequest: FriendRequest = {
    id: `req-sent-${Date.now()}`,
    fromCharacterId: 'mock-char-1',
    fromCharacterName: '当前角色',
    fromProfession: 'Warrior',
    fromLevel: 20,
    toCharacterId,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  mockSentRequests.push(newRequest)

  return { code: 200, message: '好友请求已发送', data: newRequest }
}

async function mockAcceptFriendRequest(requestId: string): Promise<ApiResponse<FriendInfo>> {
  await delay(400)

  const request = mockPendingRequests.find(r => r.id === requestId)
  if (!request) {
    return { code: 404, message: '请求不存在', data: null as unknown as FriendInfo }
  }

  // 将请求者添加为好友
  const newFriend: FriendInfo = {
    characterId: request.fromCharacterId,
    characterName: request.fromCharacterName,
    profession: request.fromProfession,
    level: request.fromLevel,
    status: 'online',
    lastOnlineAt: null,
    addedAt: new Date().toISOString()
  }

  mockFriends.push(newFriend)
  request.status = 'accepted'

  // 从待处理列表移除
  const idx = mockPendingRequests.findIndex(r => r.id === requestId)
  if (idx !== -1) mockPendingRequests.splice(idx, 1)

  return { code: 200, message: '好友请求已接受', data: newFriend }
}

async function mockRejectFriendRequest(requestId: string): Promise<ApiResponse<null>> {
  await delay(400)

  const request = mockPendingRequests.find(r => r.id === requestId)
  if (!request) {
    return { code: 404, message: '请求不存在', data: null }
  }

  request.status = 'rejected'

  // 从待处理列表移除
  const idx = mockPendingRequests.findIndex(r => r.id === requestId)
  if (idx !== -1) mockPendingRequests.splice(idx, 1)

  return { code: 200, message: '好友请求已拒绝', data: null }
}

async function mockDeleteFriend(friendCharacterId: string): Promise<ApiResponse<null>> {
  await delay(400)

  const idx = mockFriends.findIndex(f => f.characterId === friendCharacterId)
  if (idx === -1) {
    return { code: 404, message: '好友不存在', data: null }
  }

  mockFriends.splice(idx, 1)

  return { code: 200, message: '好友已删除', data: null }
}

async function mockCancelFriendRequest(requestId: string): Promise<ApiResponse<null>> {
  await delay(400)

  const idx = mockSentRequests.findIndex(r => r.id === requestId)
  if (idx === -1) {
    return { code: 404, message: '请求不存在', data: null }
  }

  mockSentRequests.splice(idx, 1)

  return { code: 200, message: '好友请求已取消', data: null }
}