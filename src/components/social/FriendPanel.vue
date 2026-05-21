<template>
  <div class="friend-panel">
    <!-- 标题栏 -->
    <header class="friend-header">
      <h1 class="friend-header__title">好友</h1>
      <span class="friend-header__count">{{ socialStore.onlineCount }}/{{ socialStore.friends.length }} 在线</span>
    </header>

    <!-- 搜索栏 -->
    <div class="friend-search">
      <input
        v-model="searchKeyword"
        class="friend-search__input"
        type="text"
        placeholder="搜索角色名（至少 2 字）"
        @keyup.enter="handleSearch"
      />
      <button class="friend-search__btn" @click="handleSearch" :disabled="socialStore.searchLoading">
        {{ socialStore.searchLoading ? '搜索中...' : '搜索' }}
      </button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="socialStore.searchResults.length > 0" class="friend-section">
      <div class="friend-section__header">
        <span class="friend-section__title">搜索结果</span>
        <button class="friend-section__clear" @click="clearSearch">关闭</button>
      </div>
      <div class="friend-list">
        <div
          v-for="result in socialStore.searchResults"
          :key="result.characterId"
          class="friend-card friend-card--search"
        >
          <div class="friend-card__info">
            <span class="friend-card__name">{{ result.characterName }}</span>
            <span class="friend-card__meta">{{ getJobName(result.profession) }} · Lv.{{ result.level }}</span>
          </div>
          <div class="friend-card__actions">
            <span v-if="result.isFriend" class="friend-tag friend-tag--friend">已是好友</span>
            <span v-else-if="result.hasPendingRequest" class="friend-tag friend-tag--pending">已申请</span>
            <button
              v-else
              class="friend-btn friend-btn--add"
              :disabled="socialStore.actionLoading"
              @click="handleSendRequest(result.characterId)"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="friend-tabs">
      <button
        :class="['friend-tab', { 'friend-tab--active': activeTab === 'friends' }]"
        @click="activeTab = 'friends'"
      >
        好友
        <span v-if="socialStore.friends.length" class="friend-tab__badge">{{ socialStore.friends.length }}</span>
      </button>
      <button
        :class="['friend-tab', { 'friend-tab--active': activeTab === 'requests' }]"
        @click="activeTab = 'requests'"
      >
        请求
        <span v-if="socialStore.pendingCount" class="friend-tab__badge friend-tab__badge--warn">{{ socialStore.pendingCount }}</span>
      </button>
      <button
        :class="['friend-tab', { 'friend-tab--active': activeTab === 'sent' }]"
        @click="activeTab = 'sent'"
      >
        已发送
        <span v-if="socialStore.sentRequests.length" class="friend-tab__badge">{{ socialStore.sentRequests.length }}</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="socialStore.loading" class="friend-empty">
      加载中...
    </div>

    <!-- 好友列表 -->
    <template v-else-if="activeTab === 'friends'">
      <!-- 在线好友 -->
      <div v-if="socialStore.onlineFriends.length > 0" class="friend-section">
        <span class="friend-section__title">在线 — {{ socialStore.onlineFriends.length }}</span>
        <div class="friend-list">
          <div
            v-for="friend in socialStore.onlineFriends"
            :key="friend.characterId"
            class="friend-card"
          >
            <div class="friend-card__status" :style="{ background: getStatusColor(friend.status) }"></div>
            <div class="friend-card__info">
              <span class="friend-card__name">{{ friend.characterName }}</span>
              <span class="friend-card__meta">{{ getJobName(friend.profession) }} · Lv.{{ friend.level }}</span>
            </div>
            <div class="friend-card__actions">
              <button class="friend-btn friend-btn--challenge" @click="confirmChallenge(friend)">挑战</button>
              <button class="friend-btn friend-btn--delete" @click="confirmDelete(friend)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 离线好友 -->
      <div v-if="socialStore.offlineFriends.length > 0" class="friend-section">
        <span class="friend-section__title">离线 — {{ socialStore.offlineFriends.length }}</span>
        <div class="friend-list">
          <div
            v-for="friend in socialStore.offlineFriends"
            :key="friend.characterId"
            class="friend-card friend-card--offline"
          >
            <div class="friend-card__status friend-card__status--offline"></div>
            <div class="friend-card__info">
              <span class="friend-card__name">{{ friend.characterName }}</span>
              <span class="friend-card__meta">
                {{ getJobName(friend.profession) }} · Lv.{{ friend.level }}
                <template v-if="friend.lastOnlineAt"> · {{ formatTime(friend.lastOnlineAt) }}</template>
              </span>
            </div>
            <div class="friend-card__actions">
              <button class="friend-btn friend-btn--challenge" @click="confirmChallenge(friend)">挑战</button>
              <button class="friend-btn friend-btn--delete" @click="confirmDelete(friend)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="socialStore.friends.length === 0" class="friend-empty">
        暂无好友，试试搜索添加吧
      </div>
    </template>

    <!-- 好友请求 -->
    <template v-else-if="activeTab === 'requests'">
      <div v-if="socialStore.pendingRequests.length > 0" class="friend-list">
        <div
          v-for="req in socialStore.pendingRequests"
          :key="req.id"
          class="friend-card friend-card--request"
        >
          <div class="friend-card__info">
            <span class="friend-card__name">{{ req.fromCharacterName }}</span>
            <span class="friend-card__meta">{{ getJobName(req.fromProfession) }} · Lv.{{ req.fromLevel }}</span>
            <span class="friend-card__time">{{ formatTime(req.createdAt) }}</span>
          </div>
          <div class="friend-card__actions">
            <button
              class="friend-btn friend-btn--accept"
              :disabled="socialStore.actionLoading"
              @click="handleAccept(req.id)"
            >
              接受
            </button>
            <button
              class="friend-btn friend-btn--reject"
              :disabled="socialStore.actionLoading"
              @click="handleReject(req.id)"
            >
              拒绝
            </button>
          </div>
        </div>
      </div>
      <div v-else class="friend-empty">暂无好友请求</div>
    </template>

    <!-- 已发送请求 -->
    <template v-else-if="activeTab === 'sent'">
      <div v-if="socialStore.sentRequests.length > 0" class="friend-list">
        <div
          v-for="req in socialStore.sentRequests"
          :key="req.id"
          class="friend-card friend-card--sent"
        >
          <div class="friend-card__info">
            <span class="friend-card__name">{{ req.toCharacterId }}</span>
            <span class="friend-card__meta">等待对方接受</span>
            <span class="friend-card__time">{{ formatTime(req.createdAt) }}</span>
          </div>
          <button
            class="friend-btn friend-btn--cancel"
            :disabled="socialStore.actionLoading"
            @click="handleCancel(req.id)"
          >
            取消
          </button>
        </div>
      </div>
      <div v-else class="friend-empty">暂无已发送的请求</div>
    </template>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="friend-dialog">
        <div v-if="deleteTarget" class="friend-dialog-overlay" @click.self="deleteTarget = null">
          <div class="friend-dialog-card">
            <h3 class="friend-dialog__title">删除好友</h3>
            <p class="friend-dialog__desc">确定要删除好友「{{ deleteTarget.characterName }}」吗？</p>
            <div class="friend-dialog__actions">
              <button class="friend-dialog__btn friend-dialog__btn--cancel" @click="deleteTarget = null">取消</button>
              <button
                class="friend-dialog__btn friend-dialog__btn--confirm"
                :disabled="socialStore.actionLoading"
                @click="handleDelete"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 挑战确认弹窗 -->
    <Teleport to="body">
      <Transition name="friend-dialog">
        <div v-if="challengeTarget" class="friend-dialog-overlay" @click.self="challengeTarget = null">
          <div class="friend-dialog-card">
            <h3 class="friend-dialog__title">挑战好友</h3>
            <p class="friend-dialog__desc">确定要挑战「{{ challengeTarget.characterName }}」的镜像吗？</p>
            <div class="friend-dialog__actions">
              <button class="friend-dialog__btn friend-dialog__btn--cancel" @click="challengeTarget = null">取消</button>
              <button class="friend-dialog__btn friend-dialog__btn--challenge-confirm" @click="handleChallenge">开始战斗</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <UiToastHost :toasts="toasts" @dismiss="hideToast" />
  </div>
</template>

<script setup lang="ts">
/**
 * 好友面板主组件
 * 包含搜索、好友列表、好友请求、已发送请求
 */
import { ref, onMounted } from 'vue'
import { UiToastHost } from '../ui'
import { useUiToasts } from '../../composables/useUiToasts'
import { useSocialStore } from '../../stores/social'
import { FRIEND_STATUS_CONFIG } from '../../types/social'
import type { FriendInfo } from '../../types/social'

/** 职业名称映射 */
const JOB_NAMES: Record<string, string> = {
  Warrior: '剑客', Mage: '术士', Hunter: '刺客',
  WARRIOR: '剑客', MAGE: '术士', HUNTER: '刺客'
}

const socialStore = useSocialStore()

/** 好友面板局部 Toast 反馈。 */
const { toasts, showToast, hideToast } = useUiToasts()

const emit = defineEmits<{
  'battle-started': [friend: { characterId: string; characterName: string; profession: string; level: number }]
}>()

const activeTab = ref<'friends' | 'requests' | 'sent'>('friends')
const searchKeyword = ref('')
const deleteTarget = ref<FriendInfo | null>(null)
const challengeTarget = ref<FriendInfo | null>(null)

onMounted(() => {
  socialStore.fetchFriendList()
})

/**
 * 获取职业中文名
 * @param profession - 职业标识
 */
function getJobName(profession: string): string {
  return JOB_NAMES[profession] ?? profession
}

/**
 * 获取在线状态颜色
 * @param status - 在线状态
 */
function getStatusColor(status: string): string {
  return FRIEND_STATUS_CONFIG[status as keyof typeof FRIEND_STATUS_CONFIG]?.color ?? 'var(--text-muted)'
}

/**
 * 格式化时间显示
 * @param isoTime - ISO 时间字符串
 */
function formatTime(isoTime: string): string {
  const date = new Date(isoTime)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay} 天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 执行搜索
 */
async function handleSearch(): Promise<void> {
  await socialStore.searchPlayers(searchKeyword.value)
}

/**
 * 清空搜索结果
 */
function clearSearch(): void {
  searchKeyword.value = ''
  socialStore.clearSearchResults()
}

/**
 * 发送好友请求
 * @param toCharacterId - 目标角色 ID
 * @returns 无返回值
 */
async function handleSendRequest(toCharacterId: string): Promise<void> {
  const result = await socialStore.sendRequest(toCharacterId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 接受好友请求
 * @param requestId - 请求 ID
 * @returns 无返回值
 */
async function handleAccept(requestId: string): Promise<void> {
  const result = await socialStore.acceptRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 拒绝好友请求
 * @param requestId - 请求 ID
 * @returns 无返回值
 */
async function handleReject(requestId: string): Promise<void> {
  const result = await socialStore.rejectRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 确认删除好友
 * @param friend - 好友信息
 */
function confirmDelete(friend: FriendInfo): void {
  deleteTarget.value = friend
}

/**
 * 执行删除好友
 * @returns 无返回值
 */
async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const result = await socialStore.removeFriend(deleteTarget.value.characterId)
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    deleteTarget.value = null
  }
}

/**
 * 确认挑战好友
 * @param friend - 好友信息
 */
function confirmChallenge(friend: FriendInfo): void {
  challengeTarget.value = friend
}

/**
 * 执行异步 PVP 挑战
 */
async function handleChallenge(): Promise<void> {
  if (!challengeTarget.value) return
  const target = challengeTarget.value
  challengeTarget.value = null
  emit('battle-started', target)
}

/**
 * 取消已发送的请求
 * @param requestId - 请求 ID
 * @returns 无返回值
 */
async function handleCancel(requestId: string): Promise<void> {
  const result = await socialStore.cancelSentRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}
</script>

<style scoped>
/* ── 面板容器 ── */
.friend-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

/* ── 标题栏 ── */
.friend-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.friend-header__title {
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.friend-header__count {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

/* ── 搜索栏 ── */
.friend-search {
  display: flex;
  gap: 8px;
}

.friend-search__input {
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

.friend-search__input:focus {
  border-color: var(--accent-blue);
}

.friend-search__input::placeholder {
  color: var(--text-muted);
}

.friend-search__btn {
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

.friend-search__btn:hover:not(:disabled) { filter: brightness(1.1); }
.friend-search__btn:disabled { opacity: 0.5; }

/* ── Tab 切换 ── */
.friend-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-panel-light);
  border-radius: 10px;
  padding: 3px;
}

.friend-tab {
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

.friend-tab--active {
  background: var(--bg-panel);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.friend-tab__badge {
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  font-weight: 600;
}

.friend-tab__badge--warn {
  background: rgba(255, 59, 48, 0.1);
  color: var(--accent-red);
}

/* ── 分节 ── */
.friend-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.friend-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friend-section__title {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.friend-section__clear {
  font-size: var(--font-size-xs);
  color: var(--accent-blue);
  background: none;
  border: none;
  cursor: pointer;
}

/* ── 好友列表 ── */
.friend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.friend-list::-webkit-scrollbar { width: 4px; }
.friend-list::-webkit-scrollbar-track { background: transparent; }
.friend-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ── 好友卡片 ── */
.friend-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: box-shadow 0.2s;
}

.friend-card:hover {
  box-shadow: var(--shadow-card);
}

.friend-card--offline {
  opacity: 0.7;
}

.friend-card--request {
  border-color: rgba(0, 113, 227, 0.2);
}

.friend-card--sent {
  opacity: 0.8;
}

/* ── 在线状态圆点 ── */
.friend-card__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.4);
}

.friend-card__status--offline {
  background: var(--text-muted);
  opacity: 0.5;
  box-shadow: none;
}

/* ── 好友信息 ── */
.friend-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.friend-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-card__meta {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.friend-card__time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  opacity: 0.7;
}

/* ── 操作按钮 ── */
.friend-card__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.friend-btn {
  padding: 5px 10px;
  font-size: var(--font-size-caption);
  font-weight: 500;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.friend-btn:hover:not(:disabled) { filter: brightness(1.1); }
.friend-btn:active:not(:disabled) { transform: scale(0.97); }
.friend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.friend-btn--add {
  background: var(--accent-blue);
  color: var(--button-text);
}

.friend-btn--accept {
  background: var(--accent-green);
  color: var(--button-text);
}

.friend-btn--reject {
  background: rgba(255, 59, 48, 0.12);
  color: var(--accent-red);
}

.friend-btn--delete {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

.friend-btn--cancel {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
}

.friend-btn--challenge {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

.friend-dialog__btn--challenge-confirm {
  background: var(--accent-blue);
  color: var(--button-text);
}

/* ── 标签 ── */
.friend-tag {
  font-size: var(--font-size-caption);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.friend-tag--friend {
  background: rgba(52, 199, 89, 0.1);
  color: var(--accent-green);
}

.friend-tag--pending {
  background: rgba(255, 149, 0, 0.1);
  color: var(--accent-gold);
}

/* ── 空状态 ── */
.friend-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}

/* ── 删除确认弹窗 ── */
.friend-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.friend-dialog-card {
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-elevated);
  border-radius: 20px;
  padding: 28px 24px;
  max-width: 340px;
  width: 90%;
  text-align: center;
}

.friend-dialog__title {
  font-size: var(--font-size-heading);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.friend-dialog__desc {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.friend-dialog__actions {
  display: flex;
  gap: 10px;
}

.friend-dialog__btn {
  flex: 1;
  padding: 10px 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.friend-dialog__btn:hover:not(:disabled) { filter: brightness(1.1); }
.friend-dialog__btn:active:not(:disabled) { transform: scale(0.98); }
.friend-dialog__btn:disabled { opacity: 0.5; }

.friend-dialog__btn--cancel {
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.friend-dialog__btn--confirm {
  background: var(--accent-red);
  color: var(--button-text);
}

/* ── 弹窗动画 ── */
.friend-dialog-enter-active,
.friend-dialog-leave-active {
  transition: opacity 0.25s ease;
}

.friend-dialog-enter-from,
.friend-dialog-leave-to {
  opacity: 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .friend-card { padding: 8px 10px; }
  .friend-card__name { font-size: var(--font-size-small); }
  .friend-search__input { padding: 6px 10px; }
  .friend-search__btn { padding: 6px 12px; }
}

@media (max-width: 375px) {
  .friend-header__title { font-size: var(--font-size-base); }
  .friend-search { flex-direction: column; }
  .friend-search__btn { width: 100%; }
  .friend-card__actions { flex-direction: column; gap: 4px; }
  .friend-btn { width: 100%; text-align: center; padding: 6px 8px; }
  .friend-dialog-card { padding: 20px 16px; }
  .friend-dialog__title { font-size: var(--font-size-base); }
  .friend-dialog__btn { padding: 8px 0; font-size: var(--font-size-small); }
}

/* ── 深色模式 ── */
[data-theme='dark'] .friend-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
</style>
