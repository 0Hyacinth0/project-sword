/**
 * 聊天系统 API
 * 世界频道消息、私聊会话、发送消息
 * 当前为 Mock 实现，后期替换为 WebSocket 实时通信
 */
import request from './request'
import type { ApiResponse } from './request'
import type { ChatMessage, PrivateConversation } from '../types/chat'

/**
 * 获取世界频道消息
 * @returns 消息列表
 */
export async function getWorldMessagesApi(): Promise<ApiResponse<ChatMessage[]>> {
  const res = await request.get<ApiResponse<ChatMessage[]>>('/chat/world')
  return res.data
}

/**
 * 获取私聊会话列表
 * @returns 会话列表
 */
export async function getPrivateConversationsApi(): Promise<ApiResponse<PrivateConversation[]>> {
  const res = await request.get<ApiResponse<PrivateConversation[]>>('/chat/conversations')
  return res.data
}

/**
 * 获取与某人的私聊记录
 * @param targetId - 目标角色 ID
 * @returns 消息列表
 */
export async function getPrivateMessagesApi(targetId: string): Promise<ApiResponse<ChatMessage[]>> {
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
  const res = await request.post<ApiResponse<ChatMessage>>('/chat/send', { channel, content, targetId })
  return res.data
}
