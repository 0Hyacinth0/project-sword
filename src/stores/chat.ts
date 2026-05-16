/**
 * 聊天系统状态管理
 * 管理世界频道消息、私聊会话、消息发送
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getWorldMessagesApi,
  getPrivateConversationsApi,
  getPrivateMessagesApi,
  sendMessageApi
} from '../api/chat'
import type { ChatMessage, PrivateConversation } from '../types/chat'

export const useChatStore = defineStore('chat', () => {
  // ── 状态 ──
  const worldMessages = ref<ChatMessage[]>([])
  const conversations = ref<PrivateConversation[]>([])
  const privateMessages = ref<ChatMessage[]>([])
  const activeTab = ref<'world' | 'private'>('world')
  const activeChatTarget = ref<string | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──

  /** 按最后消息时间排序的会话列表 */
  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) =>
      new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    )
  )

  /** 总未读消息数 */
  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + c.unreadCount, 0)
  )

  // ── 方法 ──

  /**
   * 加载世界频道消息
   */
  async function fetchWorldMessages(): Promise<boolean> {
    loading.value = true
    try {
      const res = await getWorldMessagesApi()
      if (res.code === 200) {
        worldMessages.value = res.data
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
   * 加载私聊会话列表
   */
  async function fetchConversations(): Promise<boolean> {
    loading.value = true
    try {
      const res = await getPrivateConversationsApi()
      if (res.code === 200) {
        conversations.value = res.data
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
   * 打开私聊会话
   * @param targetId - 目标角色 ID
   */
  async function openPrivateChat(targetId: string): Promise<boolean> {
    activeChatTarget.value = targetId
    loading.value = true
    try {
      const res = await getPrivateMessagesApi(targetId)
      if (res.code === 200) {
        privateMessages.value = res.data
        // 清除该会话的未读数
        const conv = conversations.value.find(c => c.targetId === targetId)
        if (conv) conv.unreadCount = 0
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
   * 关闭私聊会话，返回会话列表
   */
  function closePrivateChat(): void {
    activeChatTarget.value = null
    privateMessages.value = []
  }

  /**
   * 切换频道 Tab
   * @param tab - 频道类型
   */
  function switchTab(tab: 'world' | 'private'): void {
    activeTab.value = tab
    activeChatTarget.value = null
    privateMessages.value = []
  }

  /**
   * 发送消息
   * @param content - 消息内容
   */
  async function sendMessage(content: string): Promise<{ success: boolean; message: string }> {
    if (!content.trim()) {
      return { success: false, message: '消息不能为空' }
    }
    try {
      const channel = activeTab.value
      const targetId = channel === 'private' ? activeChatTarget.value ?? undefined : undefined
      const res = await sendMessageApi(channel, content.trim(), targetId)
      if (res.code === 200 && res.data) {
        if (channel === 'world') {
          worldMessages.value.push(res.data)
        } else {
          privateMessages.value.push(res.data)
          // 更新会话最后消息
          const conv = conversations.value.find(c => c.targetId === targetId)
          if (conv) {
            conv.lastMessage = content.trim()
            conv.lastTime = res.data.timestamp
          }
        }
        return { success: true, message: '发送成功' }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发送失败'
      return { success: false, message }
    }
  }

  /**
   * 刷新当前消息列表（模拟实时更新）
   */
  async function refreshMessages(): Promise<void> {
    if (activeTab.value === 'world') {
      const res = await getWorldMessagesApi()
      if (res.code === 200) {
        worldMessages.value = res.data
      }
    } else if (activeChatTarget.value) {
      const res = await getPrivateMessagesApi(activeChatTarget.value)
      if (res.code === 200) {
        privateMessages.value = res.data
      }
    }
  }

  /**
   * 清空状态
   */
  function clear(): void {
    worldMessages.value = []
    conversations.value = []
    privateMessages.value = []
    activeTab.value = 'world'
    activeChatTarget.value = null
    loading.value = false
  }

  return {
    worldMessages,
    conversations,
    privateMessages,
    activeTab,
    activeChatTarget,
    loading,
    sortedConversations,
    totalUnread,
    fetchWorldMessages,
    fetchConversations,
    openPrivateChat,
    closePrivateChat,
    switchTab,
    sendMessage,
    refreshMessages,
    clear
  }
})
