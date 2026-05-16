/**
 * 聊天系统类型定义
 * 包含消息、频道、私聊会话等数据结构
 */

/** 聊天频道类型 */
export type ChatChannel = 'world' | 'private'

/** 聊天消息 */
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderProfession: string
  channel: ChatChannel
  targetId?: string
  targetName?: string
  content: string
  timestamp: string
}

/** 私聊会话 */
export interface PrivateConversation {
  targetId: string
  targetName: string
  targetProfession: string
  lastMessage: string
  lastTime: string
  unreadCount: number
}
