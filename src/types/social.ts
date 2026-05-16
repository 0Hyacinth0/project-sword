/**
 * 好友系统类型定义
 * 涵盖好友信息、好友请求、搜索结果等核心类型
 */

/** 好友在线状态 */
export type FriendStatus = 'online' | 'offline' | 'busy'

/** 好友请求状态 */
export type RequestStatus = 'pending' | 'accepted' | 'rejected'

/** 好友信息 */
export interface FriendInfo {
  /** 好友角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 在线状态 */
  status: FriendStatus
  /** 最后在线时间（离线时使用） */
  lastOnlineAt: string | null
  /** 好友关系建立时间 */
  addedAt: string
}

/** 好友请求 */
export interface FriendRequest {
  /** 请求 ID */
  id: string
  /** 发送者角色 ID */
  fromCharacterId: string
  /** 发送者角色名 */
  fromCharacterName: string
  /** 发送者职业 */
  fromProfession: string
  /** 发送者等级 */
  fromLevel: number
  /** 接收者角色 ID */
  toCharacterId: string
  /** 请求状态 */
  status: RequestStatus
  /** 发送时间 */
  createdAt: string
}

/** 搜索玩家结果 */
export interface SearchPlayerResult {
  /** 角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 是否已是好友 */
  isFriend: boolean
  /** 是否已发送请求 */
  hasPendingRequest: boolean
}

/** 在线状态显示配置 */
export const FRIEND_STATUS_CONFIG: Record<FriendStatus, { label: string; color: string }> = {
  online: { label: '在线', color: 'var(--accent-green)' },
  offline: { label: '离线', color: 'var(--text-muted)' },
  busy: { label: '忙碌', color: 'var(--accent-gold)' }
}