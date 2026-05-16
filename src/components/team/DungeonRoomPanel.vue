<template>
  <div class="room-panel">
    <!-- 未进入房间：副本选择 -->
    <template v-if="!roomStore.isInRoom">
      <header class="room-header">
        <button class="room-header__back" @click="emit('back')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>返回队伍</span>
        </button>
        <h1 class="room-header__title">选择副本</h1>
      </header>

      <div v-if="roomStore.loading" class="room-empty">加载中...</div>

      <div v-else class="room-dungeon-list">
        <div
          v-for="dungeon in dungeonConfigs"
          :key="dungeon.id"
          :class="['room-dungeon-card', `room-dungeon-card--${dungeon.difficulty}`, { 'room-dungeon-card--locked': !isUnlocked(dungeon) }]"
        >
          <div class="room-dungeon-card__inner">
            <!-- 难度图标 -->
            <div :class="['room-dungeon-card__icon', `room-dungeon-card__icon--${dungeon.difficulty}`]">
              {{ dungeon.difficulty === 'elite' ? '★' : '◆' }}
            </div>

            <!-- 精英角标 -->
            <span v-if="dungeon.difficulty === 'elite'" class="room-dungeon-card__elite-badge">精英</span>

            <!-- 信息 -->
            <div class="room-dungeon-card__info">
              <h3 class="room-dungeon-card__name">{{ dungeon.name }}</h3>
              <div class="room-dungeon-card__meta">
                <span>{{ dungeon.difficulty === 'elite' ? '精英' : '普通' }}</span>
                <span>·</span>
                <span>{{ dungeon.totalFloors }} 层</span>
                <span>·</span>
                <span>Lv.{{ dungeon.levelRequirement }}+</span>
                <span>·</span>
                <span>⚡{{ dungeon.staminaCost }}</span>
              </div>
            </div>

            <!-- 选择按钮 -->
            <div class="room-dungeon-card__action">
              <button
                v-if="isUnlocked(dungeon)"
                class="room-btn room-btn--select"
                :disabled="roomStore.loading"
                @click="handleSelectDungeon(dungeon.id)"
              >
                选择
              </button>
              <span v-else class="room-dungeon-card__locked">Lv.{{ dungeon.levelRequirement }} 解锁</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 在房间中 -->
    <template v-else>
      <header class="room-header">
        <button class="room-header__back" @click="handleBackToTeam">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>返回</span>
        </button>
        <h1 class="room-header__title">{{ roomStore.currentRoom!.dungeonName }}</h1>
        <span :class="['room-status-badge', `room-status-badge--${roomStore.currentRoom!.difficulty}`]">
          {{ roomStore.currentRoom!.difficulty === 'elite' ? '精英' : '普通' }}
        </span>
      </header>

      <!-- 房间状态提示 -->
      <div v-if="roomStore.currentRoom!.status === 'waiting'" class="room-status-hint room-status-hint--waiting">
        等待队员准备...
      </div>
      <div v-else-if="roomStore.currentRoom!.status === 'ready'" class="room-status-hint room-status-hint--ready">
        全员准备就绪！
      </div>
      <div v-else-if="roomStore.currentRoom!.status === 'in_progress'" class="room-status-hint room-status-hint--progress">
        挑战进行中...
      </div>

      <!-- 成员列表 -->
      <div class="room-section">
        <span class="room-section__title">队伍成员 — {{ roomStore.currentRoom!.members.length }} 人</span>
        <div class="room-member-list">
          <div
            v-for="member in roomStore.currentRoom!.members"
            :key="member.characterId"
            :class="['room-member-card', { 'room-member-card--ready': member.readyStatus === 'ready' }]"
          >
            <div class="room-member-card__info">
              <span class="room-member-card__name">
                {{ member.characterName }}
                <span v-if="member.characterId === roomStore.currentRoom!.leaderId" class="room-member-card__leader-tag">队长</span>
              </span>
              <span class="room-member-card__meta">{{ getJobName(member.profession) }} · Lv.{{ member.level }}</span>
            </div>
            <div :class="['room-member-card__ready', `room-member-card__ready--${member.readyStatus}`]">
              {{ member.readyStatus === 'ready' ? '✓ 已准备' : '○ 未准备' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作区 -->
      <div class="room-actions">
        <!-- 队长操作 -->
        <template v-if="roomStore.isRoomLeader">
          <button
            class="room-action-btn room-action-btn--start"
            :disabled="!roomStore.isAllReady || roomStore.actionLoading"
            @click="handleStartChallenge"
          >
            {{ roomStore.isAllReady ? '开始挑战' : '等待全员准备' }}
          </button>
          <button
            class="room-action-btn room-action-btn--cancel"
            :disabled="roomStore.actionLoading"
            @click="handleCancelRoom"
          >
            取消房间
          </button>
        </template>

        <!-- 成员操作 -->
        <template v-else>
          <button
            :class="['room-action-btn', roomStore.amReady ? 'room-action-btn--unready' : 'room-action-btn--ready']"
            :disabled="roomStore.actionLoading"
            @click="handleToggleReady"
          >
            {{ roomStore.amReady ? '取消准备' : '准备' }}
          </button>
          <button
            class="room-action-btn room-action-btn--leave"
            :disabled="roomStore.actionLoading"
            @click="handleLeaveRoom"
          >
            离开房间
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 副本房间面板组件
 * 包含副本选择和房间内准备/开始流程
 */
import { onMounted } from 'vue'
import { useDungeonRoomStore } from '../../stores/dungeonRoom'
import { useDungeonStore } from '../../stores/dungeon'
import { useTeamStore } from '../../stores/team'
import { useCharacterStore } from '../../stores/character'
import { getDungeonConfigsForRoomApi } from '../../api/dungeonRoom'
import type { DungeonConfig } from '../../types/dungeon'

const emit = defineEmits<{
  /** 返回队伍面板 */
  back: []
  /** 通知父级战斗已启动 */
  'battle-started': []
}>()

const JOB_NAMES: Record<string, string> = {
  Warrior: '战士', Mage: '法师', Hunter: '猎人',
  WARRIOR: '战士', MAGE: '法师', HUNTER: '猎人'
}

const roomStore = useDungeonRoomStore()
const dungeonStore = useDungeonStore()
const teamStore = useTeamStore()
const characterStore = useCharacterStore()

/** 所有副本配置 */
const dungeonConfigs = getDungeonConfigsForRoomApi()

/** 角色等级 */
const characterLevel = characterStore.characterDetail?.level ?? 1

onMounted(() => {
  // 如果已有房间，刷新状态
  if (roomStore.isInRoom && roomStore.currentRoom) {
    roomStore.fetchRoom(roomStore.currentRoom.roomId)
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
 * 判断副本是否已解锁
 * @param dungeon - 副本配置
 */
function isUnlocked(dungeon: DungeonConfig): boolean {
  return characterLevel >= dungeon.levelRequirement
}

/**
 * 选择副本并创建房间
 * @param dungeonId - 副本 ID
 */
async function handleSelectDungeon(dungeonId: string): Promise<void> {
  if (!teamStore.myTeam) return
  const result = await roomStore.createRoom(
    teamStore.myTeam.id,
    dungeonId,
    teamStore.myTeam.members,
    teamStore.myTeam.leaderId
  )
  if (result.success) {
    teamStore.setDungeonRoom(roomStore.currentRoom!.roomId)
  } else {
    alert(result.message)
  }
}

/**
 * 切换准备状态
 */
async function handleToggleReady(): Promise<void> {
  await roomStore.toggleReady()
}

/**
 * 开始挑战（队长专用）
 * 调用房间 API 后进入多人副本战斗
 * @returns Promise，无业务返回值
 */
async function handleStartChallenge(): Promise<void> {
  const room = roomStore.currentRoom
  if (!room) return

  const result = await roomStore.startChallenge()
  if (result.success) {
    // 进入副本
    const enterResult = dungeonStore.enterDungeon(room.dungeonId)
    if (!enterResult.success) {
      alert(enterResult.message)
      return
    }
    // 获取房间成员作为 RoomMember
    const roomMembers = room.members
    // 发起多人副本战斗
    const battleResult = await dungeonStore.startMultiPlayerFloorBattle(roomMembers)
    if (battleResult.success) {
      emit('battle-started')
    } else {
      alert(battleResult.message)
    }
  } else {
    alert(result.message)
  }
}

/**
 * 取消房间
 */
async function handleCancelRoom(): Promise<void> {
  await roomStore.cancelRoom()
  teamStore.setDungeonRoom(null)
}

/**
 * 离开房间
 */
async function handleLeaveRoom(): Promise<void> {
  await roomStore.leaveRoom()
  teamStore.setDungeonRoom(null)
}

/**
 * 返回队伍面板
 */
function handleBackToTeam(): void {
  if (roomStore.isInRoom) {
    roomStore.clear()
    teamStore.setDungeonRoom(null)
  }
}
</script>

<style scoped>
/* ── 面板容器 ── */
.room-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

/* ── 标题栏 ── */
.room-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-header__back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: var(--font-size-small);
  cursor: pointer;
  padding: 0;
}

.room-header__title {
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

/* ── 难度标签 ── */
.room-status-badge {
  font-size: var(--font-size-caption);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  flex-shrink: 0;
}

.room-status-badge--normal {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

.room-status-badge--elite {
  background: rgba(175, 82, 222, 0.1);
  color: #af52de;
}

/* ── 房间状态提示 ── */
.room-status-hint {
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  font-size: var(--font-size-small);
  font-weight: 500;
}

.room-status-hint--waiting {
  background: rgba(255, 149, 0, 0.08);
  color: var(--accent-gold);
}

.room-status-hint--ready {
  background: rgba(52, 199, 89, 0.08);
  color: var(--accent-green);
}

.room-status-hint--progress {
  background: rgba(0, 113, 227, 0.08);
  color: var(--accent-blue);
}

/* ── 副本选择列表 ── */
.room-dungeon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.room-dungeon-list::-webkit-scrollbar { width: 4px; }
.room-dungeon-list::-webkit-scrollbar-track { background: transparent; }
.room-dungeon-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ── 副本卡片 ── */
.room-dungeon-card {
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.room-dungeon-card:hover {
  box-shadow: var(--shadow-card);
}

.room-dungeon-card--locked {
  opacity: 0.5;
}

.room-dungeon-card__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  position: relative;
}

/* ── 难度图标 ── */
.room-dungeon-card__icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.room-dungeon-card__icon--normal {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

.room-dungeon-card__icon--elite {
  background: rgba(175, 82, 222, 0.1);
  color: #af52de;
}

/* ── 精英角标 ── */
.room-dungeon-card__elite-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background: rgba(175, 82, 222, 0.15);
  color: #af52de;
  border-radius: 0 12px 0 8px;
  font-weight: 600;
}

/* ── 副本信息 ── */
.room-dungeon-card__info {
  flex: 1;
  min-width: 0;
}

.room-dungeon-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px;
}

.room-dungeon-card__meta {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  display: flex;
  gap: 4px;
}

.room-dungeon-card__locked {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ── 按钮 ── */
.room-btn {
  padding: 6px 14px;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
  flex-shrink: 0;
}

.room-btn:hover:not(:disabled) { filter: brightness(1.1); }
.room-btn:active:not(:disabled) { transform: scale(0.97); }
.room-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.room-btn--select {
  background: var(--accent-blue);
  color: var(--button-text);
}

/* ── 分节 ── */
.room-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-section__title {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* ── 成员列表 ── */
.room-member-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-member-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: border-color 0.2s;
}

.room-member-card--ready {
  border-color: rgba(52, 199, 89, 0.3);
}

.room-member-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.room-member-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.room-member-card__leader-tag {
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 149, 0, 0.1);
  color: var(--accent-gold);
  font-weight: 500;
  margin-left: 4px;
  vertical-align: middle;
}

.room-member-card__meta {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.room-member-card__ready {
  font-size: var(--font-size-caption);
  font-weight: 500;
  flex-shrink: 0;
}

.room-member-card__ready--ready {
  color: var(--accent-green);
}

.room-member-card__ready--not_ready {
  color: var(--text-muted);
}

/* ── 操作区 ── */
.room-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-action-btn {
  width: 100%;
  padding: 12px 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.room-action-btn:hover:not(:disabled) { filter: brightness(1.1); }
.room-action-btn:active:not(:disabled) { transform: scale(0.98); }
.room-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.room-action-btn--start {
  background: var(--accent-green);
  color: var(--button-text);
}

.room-action-btn--start:disabled {
  background: rgba(142, 142, 147, 0.15);
  color: var(--text-muted);
}

.room-action-btn--cancel {
  background: rgba(142, 142, 147, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  font-weight: 500;
  font-size: var(--font-size-small);
  padding: 10px 0;
}

.room-action-btn--ready {
  background: var(--accent-green);
  color: var(--button-text);
}

.room-action-btn--unready {
  background: rgba(255, 149, 0, 0.1);
  color: var(--accent-gold);
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.room-action-btn--leave {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
  border: 1px solid rgba(255, 59, 48, 0.15);
  font-weight: 500;
  font-size: var(--font-size-small);
  padding: 10px 0;
}

/* ── 空状态 ── */
.room-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}

/* ── 响应式 ── */
@media (max-width: 720px) {
  .room-member-card { padding: 8px 10px; }
  .room-dungeon-card__inner { padding: 10px; }
}

/* ── 深色模式 ── */
[data-theme='dark'] .room-dungeon-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
</style>
