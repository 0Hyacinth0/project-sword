/**
 * 聊天系统 API
 * 世界频道消息、私聊会话、发送消息
 * 当前为 Mock 实现，后期替换为 WebSocket 实时通信
 */
import request from './request'
import type { ApiResponse } from './request'
import type { ChatMessage, PrivateConversation } from '../types/chat'
import { isMockEnabled } from '../utils/mockConfig'
import { getMockCurrentCharacterProfile } from './mockSession'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 当前玩家 ID（Mock 用） */
const LEGACY_CURRENT_CHAR_ID = 'char-current-player'

// ──────────────────────────────────────────
// Mock 数据
// ──────────────────────────────────────────

/** Mock 世界频道消息 */
const mockWorldMessages: ChatMessage[] = [
  {
    id: 'msg-w-001',
    senderId: 'char-friend-001',
    senderName: '影刃',
    senderProfession: 'Hunter',
    channel: 'world',
    content: '有人一起刷迷雾森林精英吗？',
    timestamp: '2026-05-14T09:30:00Z'
  },
  {
    id: 'msg-w-002',
    senderId: 'char-leader-001',
    senderName: '雷霆战士',
    senderProfession: 'Warrior',
    channel: 'world',
    content: '我来！战士抗伤稳',
    timestamp: '2026-05-14T09:31:00Z'
  },
  {
    id: 'msg-w-003',
    senderId: 'char-member-001',
    senderName: '冰霜法师',
    senderProfession: 'Mage',
    channel: 'world',
    content: '缺法师吗？刚拿到新技能想试试',
    timestamp: '2026-05-14T09:32:00Z'
  },
  {
    id: 'msg-w-004',
    senderId: 'char-leader-002',
    senderName: '暗影猎手',
    senderProfession: 'Hunter',
    channel: 'world',
    content: '冰霜雪原的 Boss 太难了，打了三次才过',
    timestamp: '2026-05-14T09:35:00Z'
  },
  {
    id: 'msg-w-005',
    senderId: 'char-friend-001',
    senderName: '影刃',
    senderProfession: 'Hunter',
    channel: 'world',
    content: '组满了，下一波喊我',
    timestamp: '2026-05-14T09:36:00Z'
  }
]

/** Mock 私聊会话 */
const mockConversations: PrivateConversation[] = [
  {
    targetId: 'char-friend-001',
    targetName: '影刃',
    targetProfession: 'Hunter',
    lastMessage: '好的，明天见！',
    lastTime: '2026-05-14T08:00:00Z',
    unreadCount: 0
  },
  {
    targetId: 'char-member-001',
    targetName: '冰霜法师',
    targetProfession: 'Mage',
    lastMessage: '那个副本掉落你拿到了吗？',
    lastTime: '2026-05-14T07:30:00Z',
    unreadCount: 2
  }
]

/** Mock 私聊消息记录 */
const mockPrivateMessages: Record<string, ChatMessage[]> = {
  'char-friend-001': [
    {
      id: 'msg-p-001',
      senderId: LEGACY_CURRENT_CHAR_ID,
      senderName: '当前玩家',
      senderProfession: 'Warrior',
      channel: 'private',
      targetId: 'char-friend-001',
      targetName: '影刃',
      content: '明天一起刷白骨荒野精英？',
      timestamp: '2026-05-14T07:55:00Z'
    },
    {
      id: 'msg-p-002',
      senderId: 'char-friend-001',
      senderName: '影刃',
      senderProfession: 'Hunter',
      channel: 'private',
      targetId: LEGACY_CURRENT_CHAR_ID,
      targetName: '当前玩家',
      content: '可以啊，几点？',
      timestamp: '2026-05-14T07:56:00Z'
    },
    {
      id: 'msg-p-003',
      senderId: LEGACY_CURRENT_CHAR_ID,
      senderName: '当前玩家',
      senderProfession: 'Warrior',
      channel: 'private',
      targetId: 'char-friend-001',
      targetName: '影刃',
      content: '晚上 8 点吧',
      timestamp: '2026-05-14T07:58:00Z'
    },
    {
      id: 'msg-p-004',
      senderId: 'char-friend-001',
      senderName: '影刃',
      senderProfession: 'Hunter',
      channel: 'private',
      targetId: LEGACY_CURRENT_CHAR_ID,
      targetName: '当前玩家',
      content: '好的，明天见！',
      timestamp: '2026-05-14T08:00:00Z'
    }
  ],
  'char-member-001': [
    {
      id: 'msg-p-101',
      senderId: 'char-member-001',
      senderName: '冰霜法师',
      senderProfession: 'Mage',
      channel: 'private',
      targetId: LEGACY_CURRENT_CHAR_ID,
      targetName: '当前玩家',
      content: '那个副本掉落你拿到了吗？',
      timestamp: '2026-05-14T07:30:00Z'
    },
    {
      id: 'msg-p-102',
      senderId: 'char-member-001',
      senderName: '冰霜法师',
      senderProfession: 'Mage',
      channel: 'private',
      targetId: LEGACY_CURRENT_CHAR_ID,
      targetName: '当前玩家',
      content: '就是那个紫色护盾',
      timestamp: '2026-05-14T07:30:30Z'
    }
  ]
}

/** 模拟回复消息列表 */
const MOCK_REPLIES = [
  '好的！',
  '没问题~',
  '哈哈，是的',
  '等我一下',
  '收到！',
  '可以的',
  '稍后回复你'
]

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取世界频道消息
 * @returns 消息列表
 */
export async function getWorldMessagesApi(): Promise<ApiResponse<ChatMessage[]>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '获取成功', data: [...mockWorldMessages] }
  }
  const res = await request.get<ApiResponse<ChatMessage[]>>('/chat/world')
  return res.data
}

/**
 * 获取私聊会话列表
 * @returns 会话列表
 */
export async function getPrivateConversationsApi(): Promise<ApiResponse<PrivateConversation[]>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '获取成功', data: [...mockConversations] }
  }
  const res = await request.get<ApiResponse<PrivateConversation[]>>('/chat/conversations')
  return res.data
}

/**
 * 获取与某人的私聊记录
 * @param targetId - 目标角色 ID
 * @returns 消息列表
 */
export async function getPrivateMessagesApi(targetId: string): Promise<ApiResponse<ChatMessage[]>> {
  if (isMockEnabled()) {
    await delay(200)
    const messages = mockPrivateMessages[targetId] ?? []
    return { code: 200, message: '获取成功', data: normalizeMockCurrentPlayerMessages(messages) }
  }
  const res = await request.get<ApiResponse<ChatMessage[]>>(`/chat/private/${targetId}`)
  return res.data
}

/**
 * 发送消息
 * @param channel - 频道类型
 * @param content - 消息内容
 * @param targetId - 私聊目标 ID（私聊时必填）
 * @returns 发送的消息
 */
export async function sendMessageApi(
  channel: 'world' | 'private',
  content: string,
  targetId?: string
): Promise<ApiResponse<ChatMessage>> {
  if (isMockEnabled()) {
    await delay(100)
    const currentProfile = getMockCurrentCharacterProfile()
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentProfile.characterId,
      senderName: currentProfile.characterName,
      senderProfession: currentProfile.profession,
      channel,
      targetId: channel === 'private' ? targetId : undefined,
      targetName: channel === 'private'
        ? (mockConversations.find(c => c.targetId === targetId)?.targetName ?? '未知')
        : undefined,
      content,
      timestamp: new Date().toISOString()
    }
    if (channel === 'world') {
      mockWorldMessages.push(newMsg)
    } else if (targetId) {
      if (!mockPrivateMessages[targetId]) {
        mockPrivateMessages[targetId] = []
      }
      mockPrivateMessages[targetId].push(newMsg)
    }
    // 模拟回复（2-3 秒后）
    simulateReply(channel, targetId)
    return { code: 200, message: '发送成功', data: newMsg }
  }
  const res = await request.post<ApiResponse<ChatMessage>>('/chat/send', { channel, content, targetId })
  return res.data
}

/**
 * 模拟收到回复消息
 * @param channel - 频道类型
 * @param targetId - 目标 ID
 */
function simulateReply(channel: 'world' | 'private', targetId?: string): void {
  setTimeout(() => {
    const replyContent = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    if (channel === 'world') {
      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: 'char-npc-' + Math.floor(Math.random() * 100),
        senderName: ['路人甲', '冒险者乙', '勇士丙', '新手丁'][Math.floor(Math.random() * 4)],
        senderProfession: ['Warrior', 'Mage', 'Hunter'][Math.floor(Math.random() * 3)],
        channel: 'world',
        content: replyContent,
        timestamp: new Date().toISOString()
      }
      mockWorldMessages.push(replyMsg)
    } else if (targetId && mockPrivateMessages[targetId]) {
      const conv = mockConversations.find(c => c.targetId === targetId)
      const currentProfile = getMockCurrentCharacterProfile()
      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: targetId,
        senderName: conv?.targetName ?? '未知',
        senderProfession: conv?.targetProfession ?? 'Warrior',
        channel: 'private',
        targetId: currentProfile.characterId,
        targetName: currentProfile.characterName,
        content: replyContent,
        timestamp: new Date().toISOString()
      }
      mockPrivateMessages[targetId].push(replyMsg)
    }
  }, 2000 + Math.random() * 1000)
}

/**
 * 将旧版 Mock 私聊记录中的固定当前玩家 ID 替换为当前选中角色。
 * @param messages - 私聊消息列表
 * @returns 归一化后的消息列表
 */
function normalizeMockCurrentPlayerMessages(messages: ChatMessage[]): ChatMessage[] {
  const currentProfile = getMockCurrentCharacterProfile()
  return messages.map(message => ({
    ...message,
    senderId: message.senderId === LEGACY_CURRENT_CHAR_ID ? currentProfile.characterId : message.senderId,
    senderName: message.senderId === LEGACY_CURRENT_CHAR_ID ? currentProfile.characterName : message.senderName,
    senderProfession: message.senderId === LEGACY_CURRENT_CHAR_ID ? currentProfile.profession : message.senderProfession,
    targetId: message.targetId === LEGACY_CURRENT_CHAR_ID ? currentProfile.characterId : message.targetId,
    targetName: message.targetId === LEGACY_CURRENT_CHAR_ID ? currentProfile.characterName : message.targetName
  }))
}
