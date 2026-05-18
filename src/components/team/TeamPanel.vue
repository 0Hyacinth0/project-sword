<template>
  <div class="team-panel">
    <!-- 副本大厅视图（覆盖整个面板） -->
    <DungeonRoomPanel
      v-if="showDungeonRoom"
      @back="showDungeonRoom = false"
      @battle-started="emit('battle-started')"
    />

    <!-- 未在队伍 -->
    <template v-else-if="!teamStore.isInTeam">
      <header class="team-header">
        <h1 class="team-header__title">组队</h1>
      </header>

      <!-- 创建队伍按钮 -->
      <button
        class="team-create-btn"
        :disabled="teamStore.actionLoading"
        @click="handleCreateTeam"
      >
        {{ teamStore.actionLoading ? '创建中...' : '创建队伍' }}
      </button>

      <!-- 公开队伍列表 -->
      <div class="team-section">
        <span class="team-section__title">公开队伍 — {{ teamStore.teamList.length }}</span>
        <div v-if="teamStore.loading" class="team-empty">加载中...</div>
        <div v-else-if="teamStore.teamList.length === 0" class="team-empty">暂无公开队伍</div>
        <div v-else class="team-list">
          <div
            v-for="team in teamStore.teamList"
            :key="team.id"
            class="team-card"
          >
            <div class="team-card__info">
              <span class="team-card__name">{{ team.leaderName }} 的队伍</span>
              <span class="team-card__meta">
                {{ team.members.length }}/{{ team.maxMembers }} 人
                · {{ getStatusLabel(team.status) }}
                <template v-if="team.targetDungeon"> · {{ team.targetDungeon }}</template>
              </span>
            </div>
            <button
              v-if="team.status === 'open' && team.members.length < team.maxMembers"
              class="team-btn team-btn--apply"
              :disabled="teamStore.actionLoading"
              @click="handleApply(team.id)"
            >
              申请
            </button>
            <span v-else-if="team.status === 'closed'" class="team-tag team-tag--closed">已关闭</span>
            <span v-else-if="team.members.length >= team.maxMembers" class="team-tag team-tag--full">已满</span>
          </div>
        </div>
      </div>

      <!-- 从好友列表邀请 -->
      <div v-if="socialStore.onlineFriends.length > 0" class="team-section">
        <span class="team-section__title">在线好友</span>
        <div class="team-list">
          <div
            v-for="friend in socialStore.onlineFriends"
            :key="friend.characterId"
            class="team-card team-card--friend"
          >
            <div class="team-card__info">
              <span class="team-card__name">{{ friend.characterName }}</span>
              <span class="team-card__meta">{{ getJobName(friend.profession) }} · Lv.{{ friend.level }}</span>
            </div>
            <span class="team-tag team-tag--hint">创建队伍后邀请</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 在队伍中 -->
    <template v-else>
      <header class="team-header">
        <h1 class="team-header__title">{{ teamStore.myTeam!.leaderName }} 的队伍</h1>
        <span :class="['team-status-tag', `team-status-tag--${teamStore.myTeam!.status}`]">
          {{ getStatusLabel(teamStore.myTeam!.status) }}
        </span>
      </header>

      <!-- 成员列表 -->
      <div class="team-section">
        <span class="team-section__title">成员 — {{ teamStore.myTeam!.members.length }}/{{ teamStore.myTeam!.maxMembers }}</span>
        <div class="team-list">
          <div
            v-for="member in teamStore.myTeam!.members"
            :key="member.characterId"
            class="team-card"
          >
            <div class="team-card__status" :style="{ background: getMemberStatusColor(member.status) }"></div>
            <div class="team-card__info">
              <span class="team-card__name">{{ member.characterName }}</span>
              <span class="team-card__meta">
                {{ getJobName(member.profession) }} · Lv.{{ member.level }}
              </span>
            </div>
            <span v-if="member.role === 'leader'" class="team-tag team-tag--leader">队长</span>
            <span v-else class="team-tag team-tag--member">成员</span>
            <!-- 队长操作：踢人、转让队长 -->
            <template v-if="teamStore.isLeader && member.role !== 'leader'">
              <button
                class="team-btn team-btn--kick"
                :disabled="teamStore.actionLoading"
                @click="confirmKick(member)"
              >
                踢出
              </button>
              <button
                class="team-btn team-btn--transfer"
                :disabled="teamStore.actionLoading"
                @click="handleChangeLeader(member.characterId)"
              >
                转让
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 队长操作区 -->
      <div v-if="teamStore.isLeader" class="team-actions">
        <!-- 选择副本按钮 -->
        <button
          class="team-action-btn team-action-btn--dungeon"
          :disabled="teamStore.actionLoading"
          @click="showDungeonRoom = true"
        >
          选择副本
        </button>

        <!-- 切换招募状态 -->
        <button
          v-if="teamStore.myTeam!.status === 'open'"
          class="team-action-btn team-action-btn--close"
          :disabled="teamStore.actionLoading"
          @click="handleToggleStatus('closed')"
        >
          关闭招募
        </button>
        <button
          v-else-if="teamStore.myTeam!.status === 'closed'"
          class="team-action-btn team-action-btn--open"
          :disabled="teamStore.actionLoading"
          @click="handleToggleStatus('open')"
        >
          开放招募
        </button>

        <!-- 邀请好友 -->
        <div v-if="socialStore.onlineFriends.length > 0" class="team-invite-section">
          <span class="team-section__title">邀请好友</span>
          <div class="team-list">
            <div
              v-for="friend in socialStore.onlineFriends"
              :key="friend.characterId"
              class="team-card team-card--friend"
            >
              <div class="team-card__info">
                <span class="team-card__name">{{ friend.characterName }}</span>
                <span class="team-card__meta">{{ getJobName(friend.profession) }} · Lv.{{ friend.level }}</span>
              </div>
              <button
                class="team-btn team-btn--invite"
                :disabled="teamStore.actionLoading || isAlreadyInTeam(friend.characterId)"
                @click="handleInvite(friend.characterId)"
              >
                {{ isAlreadyInTeam(friend.characterId) ? '已在队中' : '邀请' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 入队申请 -->
        <div v-if="teamStore.applications.length > 0" class="team-section">
          <span class="team-section__title">入队申请 — {{ teamStore.applications.length }}</span>
          <div class="team-list">
            <div
              v-for="app in teamStore.applications"
              :key="app.id"
              class="team-card team-card--application"
            >
              <div class="team-card__info">
                <span class="team-card__name">{{ app.applicantName }}</span>
                <span class="team-card__meta">{{ getJobName(app.applicantProfession) }} · Lv.{{ app.applicantLevel }}</span>
              </div>
              <div class="team-card__actions">
                <button
                  class="team-btn team-btn--accept"
                  :disabled="teamStore.actionLoading"
                  @click="handleAcceptApp(app.id)"
                >
                  接受
                </button>
                <button
                  class="team-btn team-btn--reject"
                  :disabled="teamStore.actionLoading"
                  @click="handleRejectApp(app.id)"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 解散队伍 -->
        <button
          class="team-action-btn team-action-btn--disband"
          :disabled="teamStore.actionLoading"
          @click="showDisbandConfirm = true"
        >
          解散队伍
        </button>
      </div>

      <!-- 成员操作区 -->
      <div v-else class="team-actions">
        <!-- 进入副本房间（队长已创建时） -->
        <button
          v-if="teamStore.dungeonRoomId"
          class="team-action-btn team-action-btn--dungeon"
          @click="showDungeonRoom = true"
        >
          进入副本房间
        </button>
        <button
          class="team-action-btn team-action-btn--leave"
          :disabled="teamStore.actionLoading"
          @click="showLeaveConfirm = true"
        >
          离开队伍
        </button>
      </div>
    </template>

    <!-- 离开确认弹窗 -->
    <Teleport to="body">
      <Transition name="team-dialog">
        <div v-if="showLeaveConfirm" class="team-dialog-overlay" @click.self="showLeaveConfirm = false">
          <div class="team-dialog-card">
            <h3 class="team-dialog__title">离开队伍</h3>
            <p class="team-dialog__desc">确定要离开当前队伍吗？</p>
            <div class="team-dialog__actions">
              <button class="team-dialog__btn team-dialog__btn--cancel" @click="showLeaveConfirm = false">取消</button>
              <button class="team-dialog__btn team-dialog__btn--confirm" :disabled="teamStore.actionLoading" @click="handleLeave">确认离开</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 解散确认弹窗 -->
    <Teleport to="body">
      <Transition name="team-dialog">
        <div v-if="showDisbandConfirm" class="team-dialog-overlay" @click.self="showDisbandConfirm = false">
          <div class="team-dialog-card">
            <h3 class="team-dialog__title">解散队伍</h3>
            <p class="team-dialog__desc">确定要解散队伍吗？所有成员将被移出。</p>
            <div class="team-dialog__actions">
              <button class="team-dialog__btn team-dialog__btn--cancel" @click="showDisbandConfirm = false">取消</button>
              <button class="team-dialog__btn team-dialog__btn--confirm" :disabled="teamStore.actionLoading" @click="handleDisband">确认解散</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 踢人确认弹窗 -->
    <Teleport to="body">
      <Transition name="team-dialog">
        <div v-if="kickTarget" class="team-dialog-overlay" @click.self="kickTarget = null">
          <div class="team-dialog-card">
            <h3 class="team-dialog__title">踢出成员</h3>
            <p class="team-dialog__desc">确定要将「{{ kickTarget.characterName }}」踢出队伍吗？</p>
            <div class="team-dialog__actions">
              <button class="team-dialog__btn team-dialog__btn--cancel" @click="kickTarget = null">取消</button>
              <button class="team-dialog__btn team-dialog__btn--confirm" :disabled="teamStore.actionLoading" @click="handleKick">确认踢出</button>
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
 * 组队面板主组件
 * 包含创建队伍、队伍列表、成员管理、邀请/申请
 */
import { ref, onMounted } from 'vue'
import { useTeamStore } from '../../stores/team'
import { useSocialStore } from '../../stores/social'
import { useUiToasts } from '../../composables/useUiToasts'
import { UiToastHost } from '../ui'
import DungeonRoomPanel from './DungeonRoomPanel.vue'
import type { TeamMember } from '../../types/team'

const emit = defineEmits<{
  /** 通知父级战斗已启动 */
  'battle-started': []
}>()

/** 职业名称映射 */
const JOB_NAMES: Record<string, string> = {
  Warrior: '战士', Mage: '法师', Hunter: '猎人',
  WARRIOR: '战士', MAGE: '法师', HUNTER: '猎人'
}

/** 队伍状态标签映射 */
const STATUS_LABELS: Record<string, string> = {
  open: '招募中',
  closed: '已关闭',
  in_dungeon: '副本中'
}

const teamStore = useTeamStore()
const socialStore = useSocialStore()
/** 组队面板局部 Toast 反馈。 */
const { toasts, showToast, hideToast } = useUiToasts()
const showLeaveConfirm = ref(false)
const showDisbandConfirm = ref(false)
const kickTarget = ref<TeamMember | null>(null)
const showDungeonRoom = ref(false)

onMounted(() => {
  teamStore.fetchMyTeam()
  teamStore.fetchTeamList()
  if (teamStore.isLeader && teamStore.myTeam) {
    teamStore.fetchApplications()
  }
})

/**
 * 获取职业中文名
 * @param profession - 职业标识
 */
function getJobName(profession: string): string {
  return JOB_NAMES[profession] ?? profession
}

/**
 * 获取队伍状态标签
 * @param status - 队伍状态
 */
function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

/**
 * 获取成员在线状态颜色
 * @param status - 成员状态
 */
function getMemberStatusColor(status: string): string {
  if (status === 'online' || status === 'ready') return 'var(--accent-green)'
  return 'var(--text-muted)'
}

/**
 * 判断好友是否已在队伍中
 * @param characterId - 角色ID
 */
function isAlreadyInTeam(characterId: string): boolean {
  return teamStore.myTeam?.members.some(m => m.characterId === characterId) ?? false
}

/**
 * 创建队伍
 * @returns 无返回值
 */
async function handleCreateTeam(): Promise<void> {
  const result = await teamStore.createTeam()
  if (result.success) {
    await teamStore.fetchTeamList()
  }
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 申请加入队伍
 * @param teamId - 队伍 ID
 * @returns 无返回值
 */
async function handleApply(teamId: string): Promise<void> {
  const result = await teamStore.applyToTeam(teamId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 邀请好友
 * @param characterId - 好友角色 ID
 * @returns 无返回值
 */
async function handleInvite(characterId: string): Promise<void> {
  const result = await teamStore.inviteFriend(characterId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 接受入队申请
 * @param applicationId - 申请 ID
 * @returns 无返回值
 */
async function handleAcceptApp(applicationId: string): Promise<void> {
  const result = await teamStore.acceptApp(applicationId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 拒绝入队申请
 * @param applicationId - 申请 ID
 * @returns 无返回值
 */
async function handleRejectApp(applicationId: string): Promise<void> {
  const result = await teamStore.rejectApp(applicationId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 确认踢出成员
 * @param member - 成员信息
 */
function confirmKick(member: TeamMember): void {
  kickTarget.value = member
}

/**
 * 执行踢出成员
 * @returns 无返回值
 */
async function handleKick(): Promise<void> {
  if (!kickTarget.value) return
  const result = await teamStore.kickMember(kickTarget.value.characterId)
  if (result.success) {
    kickTarget.value = null
  }
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 转让队长
 * @param characterId - 新队长角色 ID
 * @returns 无返回值
 */
async function handleChangeLeader(characterId: string): Promise<void> {
  const result = await teamStore.changeLeader(characterId)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 切换队伍状态
 * @param status - 目标状态
 * @returns 无返回值
 */
async function handleToggleStatus(status: 'open' | 'closed'): Promise<void> {
  const result = await teamStore.toggleStatus(status)
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 离开队伍
 * @returns 无返回值
 */
async function handleLeave(): Promise<void> {
  const result = await teamStore.leaveTeam()
  if (result.success) {
    showLeaveConfirm.value = false
    await teamStore.fetchTeamList()
  }
  showToast(result.message, result.success ? 'success' : 'error')
}

/**
 * 解散队伍
 * @returns 无返回值
 */
async function handleDisband(): Promise<void> {
  const result = await teamStore.disbandTeam()
  if (result.success) {
    showDisbandConfirm.value = false
    await teamStore.fetchTeamList()
  }
  showToast(result.message, result.success ? 'success' : 'error')
}
</script>

<style scoped>
/* ── 面板容器 ── */
.team-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

/* ── 标题栏 ── */
.team-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.team-header__title {
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* ── 队伍状态标签 ── */
.team-status-tag {
  font-size: var(--font-size-caption);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.team-status-tag--open {
  background: rgba(52, 199, 89, 0.1);
  color: var(--accent-green);
}

.team-status-tag--closed {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
}

.team-status-tag--in_dungeon {
  background: rgba(255, 149, 0, 0.1);
  color: var(--accent-gold);
}

/* ── 创建队伍按钮 ── */
.team-create-btn {
  width: 100%;
  padding: 12px 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  background: var(--accent-blue);
  color: var(--button-text);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.team-create-btn:hover:not(:disabled) { filter: brightness(1.1); }
.team-create-btn:active:not(:disabled) { transform: scale(0.98); }
.team-create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── 分节 ── */
.team-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.team-section__title {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* ── 队伍列表 ── */
.team-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.team-list::-webkit-scrollbar { width: 4px; }
.team-list::-webkit-scrollbar-track { background: transparent; }
.team-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ── 队伍卡片 ── */
.team-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: box-shadow 0.2s;
}

.team-card:hover {
  box-shadow: var(--shadow-card);
}

.team-card--friend {
  padding: 8px 10px;
}

.team-card--application {
  border-color: rgba(0, 113, 227, 0.2);
}

/* ── 在线状态圆点 ── */
.team-card__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.4);
}

/* ── 卡片信息 ── */
.team-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-card__meta {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

/* ── 卡片操作 ── */
.team-card__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ── 按钮 ── */
.team-btn {
  padding: 5px 10px;
  font-size: var(--font-size-caption);
  font-weight: 500;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.team-btn:hover:not(:disabled) { filter: brightness(1.1); }
.team-btn:active:not(:disabled) { transform: scale(0.97); }
.team-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.team-btn--apply {
  background: var(--accent-blue);
  color: var(--button-text);
}

.team-btn--invite {
  background: var(--accent-blue);
  color: var(--button-text);
}

.team-btn--accept {
  background: var(--accent-green);
  color: var(--button-text);
}

.team-btn--reject {
  background: rgba(255, 59, 48, 0.12);
  color: var(--accent-red);
}

.team-btn--kick {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

.team-btn--transfer {
  background: rgba(0, 113, 227, 0.08);
  color: var(--accent-blue);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

/* ── 标签 ── */
.team-tag {
  font-size: var(--font-size-caption);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  flex-shrink: 0;
}

.team-tag--leader {
  background: rgba(255, 149, 0, 0.1);
  color: var(--accent-gold);
}

.team-tag--member {
  background: rgba(0, 113, 227, 0.08);
  color: var(--accent-blue);
}

.team-tag--closed {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
}

.team-tag--full {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
}

.team-tag--hint {
  background: rgba(142, 142, 147, 0.08);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

/* ── 操作区 ── */
.team-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-action-btn {
  width: 100%;
  padding: 10px 0;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.team-action-btn:hover:not(:disabled) { filter: brightness(1.1); }
.team-action-btn:active:not(:disabled) { transform: scale(0.98); }
.team-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.team-action-btn--close {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.team-action-btn--open {
  background: var(--accent-green);
  color: var(--button-text);
}

.team-action-btn--disband {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
  border: 1px solid rgba(255, 59, 48, 0.15);
}

.team-action-btn--leave {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
  border: 1px solid rgba(255, 59, 48, 0.15);
}

.team-action-btn--dungeon {
  background: var(--accent-blue);
  color: var(--button-text);
}

/* ── 邀请区 ── */
.team-invite-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── 空状态 ── */
.team-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}

/* ── 确认弹窗 ── */
.team-dialog-overlay {
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

.team-dialog-card {
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

.team-dialog__title {
  font-size: var(--font-size-heading);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.team-dialog__desc {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.team-dialog__actions {
  display: flex;
  gap: 10px;
}

.team-dialog__btn {
  flex: 1;
  padding: 10px 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.team-dialog__btn:hover:not(:disabled) { filter: brightness(1.1); }
.team-dialog__btn:active:not(:disabled) { transform: scale(0.98); }
.team-dialog__btn:disabled { opacity: 0.5; }

.team-dialog__btn--cancel {
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.team-dialog__btn--confirm {
  background: var(--accent-red);
  color: var(--button-text);
}

/* ── 弹窗动画 ── */
.team-dialog-enter-active,
.team-dialog-leave-active {
  transition: opacity 0.25s ease;
}

.team-dialog-enter-from,
.team-dialog-leave-to {
  opacity: 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .team-card { padding: 8px 10px; }
  .team-card__actions { flex-direction: column; gap: 4px; }
}

@media (max-width: 375px) {
  .team-header__title { font-size: var(--font-size-base); }
  .team-create-btn { padding: 10px 0; font-size: var(--font-size-small); }
  .team-card__name { font-size: var(--font-size-small); }
  .team-card__meta { font-size: 11px; }
  .team-action-btn { padding: 8px 0; font-size: var(--font-size-caption); border-radius: 8px; }
  .team-btn { padding: 4px 8px; font-size: 11px; }
  .team-dialog-card { padding: 20px 16px; }
  .team-dialog__title { font-size: var(--font-size-base); }
  .team-dialog__btn { padding: 8px 0; font-size: var(--font-size-small); }
}

/* ── 深色模式 ── */
[data-theme='dark'] .team-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
</style>
