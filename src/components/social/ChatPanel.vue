<template>
  <div class="chat-panel">
    <!-- 标题栏 -->
    <header class="chat-header">
      <h1 class="chat-header__title">聊天</h1>
    </header>

    <!-- Tab 切换 -->
    <div class="chat-tabs">
      <button
        :class="['chat-tab', { 'chat-tab--active': chatStore.activeTab === 'world' }]"
        @click="chatStore.switchTab('world')"
      >
        世界频道
      </button>
      <button
        :class="['chat-tab', { 'chat-tab--active': chatStore.activeTab === 'private' }]"
        @click="handleSwitchPrivate"
      >
        私聊
        <span v-if="chatStore.totalUnread > 0" class="chat-tab__badge">{{ chatStore.totalUnread }}</span>
      </button>
    </div>

    <!-- 世界频道 -->
    <template v-if="chatStore.activeTab === 'world'">
      <div class="chat-messages" ref="worldMsgRef">
        <div
          v-for="msg in chatStore.worldMessages"
          :key="msg.id"
          :class="['chat-msg', { 'chat-msg--self': msg.senderId === currentCharacterId }]"
        >
          <div class="chat-msg__sender">
            <span class="chat-msg__name">{{ msg.senderName }}</span>
            <span class="chat-msg__time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div :class="['chat-msg__bubble', { 'chat-msg__bubble--self': msg.senderId === currentCharacterId }]">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input-area">
        <input
          v-model="inputText"
          class="chat-input"
          type="text"
          placeholder="输入消息..."
          maxlength="200"
          @keyup.enter="handleSend"
        />
        <button class="chat-send-btn" :disabled="!inputText.trim()" @click="handleSend">
          发送
        </button>
      </div>
    </template>

    <!-- 私聊 -->
    <template v-else>
      <!-- 会话列表 -->
      <div v-if="!chatStore.activeChatTarget" class="chat-conversations">
        <div v-if="chatStore.sortedConversations.length === 0" class="chat-empty">
          暂无私聊会话
        </div>
        <div
          v-for="conv in chatStore.sortedConversations"
          :key="conv.targetId"
          class="chat-conv-card"
          @click="handleOpenChat(conv.targetId)"
        >
          <div class="chat-conv-card__info">
            <span class="chat-conv-card__name">{{ conv.targetName }}</span>
            <span class="chat-conv-card__last">{{ conv.lastMessage }}</span>
          </div>
          <div class="chat-conv-card__meta">
            <span class="chat-conv-card__time">{{ formatTime(conv.lastTime) }}</span>
            <span v-if="conv.unreadCount > 0" class="chat-conv-card__unread">{{ conv.unreadCount }}</span>
          </div>
        </div>
      </div>

      <!-- 私聊消息 -->
      <template v-else>
        <!-- 私聊顶部：返回 + 对方名称 -->
        <div class="chat-private-header">
          <button class="chat-private-header__back" @click="chatStore.closePrivateChat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="chat-private-header__name">{{ activeChatName }}</span>
        </div>

        <div class="chat-messages" ref="privateMsgRef">
          <div
            v-for="msg in chatStore.privateMessages"
            :key="msg.id"
            :class="['chat-msg', { 'chat-msg--self': msg.senderId === currentCharacterId }]"
          >
            <div class="chat-msg__sender">
              <span class="chat-msg__name">{{ msg.senderId === currentCharacterId ? '我' : msg.senderName }}</span>
              <span class="chat-msg__time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div :class="['chat-msg__bubble', { 'chat-msg__bubble--self': msg.senderId === currentCharacterId }]">
              {{ msg.content }}
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-input-area">
          <input
            v-model="inputText"
            class="chat-input"
            type="text"
            placeholder="输入消息..."
            maxlength="200"
            @keyup.enter="handleSend"
          />
          <button class="chat-send-btn" :disabled="!inputText.trim()" @click="handleSend">
            发送
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 聊天面板主组件
 * 包含世界频道和私聊功能
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChatStore } from '../../stores/chat'
import { getMockCurrentCharacterId } from '../../api/mockSession'

const chatStore = useChatStore()
const inputText = ref('')
const worldMsgRef = ref<HTMLElement | null>(null)
const privateMsgRef = ref<HTMLElement | null>(null)

/** 当前 Mock 选中角色 ID */
const currentCharacterId = computed(() => getMockCurrentCharacterId())

onMounted(() => {
  chatStore.fetchWorldMessages()
  chatStore.fetchConversations()
})

/** 当前私聊对象名称 */
const activeChatName = computed(() => {
  if (!chatStore.activeChatTarget) return ''
  const conv = chatStore.conversations.find(c => c.targetId === chatStore.activeChatTarget)
  return conv?.targetName ?? '未知'
})

/** 消息列表变化时自动滚动到底部 */
watch(
  () => chatStore.worldMessages.length,
  () => scrollToBottom(worldMsgRef)
)
watch(
  () => chatStore.privateMessages.length,
  () => scrollToBottom(privateMsgRef)
)

/**
 * 滚动到底部
 * @param elRef - 元素引用
 */
function scrollToBottom(elRef: typeof worldMsgRef): void {
  nextTick(() => {
    if (elRef.value) {
      elRef.value.scrollTop = elRef.value.scrollHeight
    }
  })
}

/**
 * 格式化时间显示
 * @param isoTime - ISO 时间字符串
 */
function formatTime(isoTime: string): string {
  const date = new Date(isoTime)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * 切换到私聊 Tab
 */
function handleSwitchPrivate(): void {
  chatStore.switchTab('private')
}

/**
 * 打开私聊会话
 * @param targetId - 目标角色 ID
 */
async function handleOpenChat(targetId: string): Promise<void> {
  await chatStore.openPrivateChat(targetId)
  scrollToBottom(privateMsgRef)
}

/**
 * 发送消息
 */
async function handleSend(): Promise<void> {
  if (!inputText.value.trim()) return
  const result = await chatStore.sendMessage(inputText.value)
  if (result.success) {
    inputText.value = ''
  }
}
</script>

<style scoped>
/* ── 面板容器 ── */
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
}

/* ── 标题栏 ── */
.chat-header {
  display: flex;
  align-items: baseline;
}

.chat-header__title {
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* ── Tab 切换 ── */
.chat-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-panel-light);
  border-radius: 10px;
  padding: 3px;
}

.chat-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 7px 0;
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-tab--active {
  background: var(--bg-panel);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.chat-tab__badge {
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(255, 59, 48, 0.1);
  color: var(--accent-red);
  font-weight: 600;
}

/* ── 消息列表 ── */
.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ── 消息 ── */
.chat-msg {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 80%;
}

.chat-msg--self {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-msg__sender {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 0 4px;
}

.chat-msg--self .chat-msg__sender {
  flex-direction: row-reverse;
}

.chat-msg__name {
  font-size: var(--font-size-caption);
  font-weight: 500;
  color: var(--text-muted);
}

.chat-msg__time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  opacity: 0.7;
}

.chat-msg__bubble {
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  font-size: var(--font-size-small);
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.chat-msg__bubble--self {
  background: var(--accent-blue);
  border-color: transparent;
  color: var(--button-text);
  border-radius: 12px 12px 4px 12px;
}

.chat-msg--self .chat-msg__bubble {
  border-radius: 12px 12px 12px 4px;
}

/* ── 输入区 ── */
.chat-input-area {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  font-size: var(--font-size-small);
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--accent-blue);
}

.chat-input::placeholder {
  color: var(--text-muted);
}

.chat-send-btn {
  padding: 8px 16px;
  font-size: var(--font-size-small);
  font-weight: 500;
  background: var(--accent-blue);
  color: var(--button-text);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.2s;
  white-space: nowrap;
}

.chat-send-btn:hover:not(:disabled) { filter: brightness(1.1); }
.chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── 会话列表 ── */
.chat-conversations {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-conversations::-webkit-scrollbar { width: 4px; }
.chat-conversations::-webkit-scrollbar-track { background: transparent; }
.chat-conversations::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

.chat-conv-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.chat-conv-card:hover {
  box-shadow: var(--shadow-card);
}

.chat-conv-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-conv-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.chat-conv-card__last {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-conv-card__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.chat-conv-card__time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.chat-conv-card__unread {
  font-size: var(--font-size-xs);
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--accent-red);
  color: white;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

/* ── 私聊顶部栏 ── */
.chat-private-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chat-private-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: filter 0.2s;
}

.chat-private-header__back:hover {
  filter: brightness(1.05);
}

.chat-private-header__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

/* ── 空状态 ── */
.chat-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}

/* ── 响应式 ── */
@media (max-width: 720px) {
  .chat-conv-card { padding: 8px 10px; }
  .chat-msg { max-width: 85%; }
}

/* ── 深色模式 ── */
[data-theme='dark'] .chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

[data-theme='dark'] .chat-conversations::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
</style>
