<template>
  <div class="dungeon-panel">
    <!-- 标题栏 -->
    <header class="dungeon-header">
      <UiButton class="dungeon-header__back" variant="ghost" size="sm" @click="emit('back')">
        <template #icon><ChevronLeft :size="18" :stroke-width="1.8" /></template>
        返回
      </UiButton>
      <h1 class="dungeon-header__title">{{ areaName }} · 副本</h1>
    </header>

    <!-- 副本列表 -->
    <div class="dungeon-list">
      <div
        v-for="dungeon in dungeons"
        :key="dungeon.id"
        :class="['dungeon-card', `dungeon-card--${dungeon.difficulty}`, { 'dungeon-card--locked': !isUnlocked(dungeon) }]"
      >
        <div class="dungeon-card__inner">
          <!-- 难度图标 -->
          <div :class="['dungeon-card__icon', `dungeon-card__icon--${dungeon.difficulty}`]">
            {{ dungeon.difficulty === 'elite' ? '★' : '◆' }}
          </div>

          <!-- 精英角标 -->
          <UiBadge v-if="dungeon.difficulty === 'elite'" class="dungeon-card__elite-badge" tone="epic" size="sm">精英</UiBadge>

          <!-- 信息区 -->
          <div class="dungeon-card__info">
            <h3 class="dungeon-card__name">{{ dungeon.name }}</h3>
            <div class="dungeon-card__meta">
              <span class="dungeon-card__meta-item">
                {{ dungeon.difficulty === 'elite' ? '精英' : '普通' }}
              </span>
              <span class="dungeon-card__meta-sep">·</span>
              <span class="dungeon-card__meta-item">{{ dungeon.totalFloors }} 层</span>
              <span class="dungeon-card__meta-sep">·</span>
              <span class="dungeon-card__meta-item">Lv.{{ dungeon.levelRequirement }}+</span>
            </div>
          </div>

          <!-- 体力消耗 -->
          <div class="dungeon-card__stamina">
            <span class="stamina-icon">⚡</span>
            <span>{{ dungeon.staminaCost }}</span>
          </div>
        </div>

        <!-- 奖励预览 -->
        <div class="dungeon-card__rewards">
          <span class="rewards-label">通关奖励</span>
          <div class="rewards-tags">
            <UiBadge class="rewards-tag" tone="success" size="sm">+{{ dungeon.rewards.bonusExp }} EXP</UiBadge>
            <UiBadge class="rewards-tag" tone="warning" size="sm">+{{ dungeon.rewards.bonusGold }} G</UiBadge>
            <UiBadge
              v-for="item in dungeon.rewards.guaranteedItems"
              :key="item.itemId"
              class="rewards-tag"
              :tone="rewardBadgeTone(item.rarity)"
              size="sm"
            >
              {{ item.name }}
            </UiBadge>
          </div>
        </div>

        <!-- 掉落预览 -->
        <div class="dungeon-card__drops" v-if="getDropPreview(dungeon.id, dungeon.difficulty)">
          <span class="rewards-label">可能掉落</span>
          <div class="rewards-tags">
            <UiBadge
              v-for="drop in getDropPreview(dungeon.id, dungeon.difficulty)!"
              :key="drop.itemId"
              class="rewards-tag"
              :class="{ 'rewards-tag--elite-only': drop.eliteOnly }"
              :tone="drop.itemType === 'pet_egg' ? 'warning' : rewardBadgeTone(drop.quality)"
              size="sm"
            >
              {{ drop.eliteOnly ? '★ ' : '' }}{{ drop.name }}
            </UiBadge>
          </div>
        </div>

        <!-- 进入按钮 -->
        <div class="dungeon-card__action">
          <UiButton
            v-if="isUnlocked(dungeon)"
            class="dungeon-enter-btn"
            block
            size="sm"
            :loading="loading"
            :disabled="loading"
            @click="handleEnter(dungeon)"
          >
            {{ loading ? '进入中...' : '进入副本' }}
          </UiButton>
          <span v-else class="dungeon-locked-text">Lv.{{ dungeon.levelRequirement }} 解锁</span>
        </div>
      </div>
    </div>

    <!-- 精英确认弹窗 -->
    <EliteConfirmDialog
      :visible="showEliteConfirm"
      :dungeon-name="pendingDungeon?.name ?? ''"
      @confirm="confirmEliteEnter"
      @cancel="cancelEliteEnter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDungeonStore } from '../../stores/dungeon'
import { useCharacterStore } from '../../stores/character'
import { getDungeonsByArea } from '../../config/dungeon_config'
import { getDungeonDropTable } from '../../config/dungeon_drop_config'
import { MAP_AREAS } from '../../config/map_config'
import EliteConfirmDialog from './EliteConfirmDialog.vue'
import type { DungeonConfig, DungeonDropEntry, DungeonDifficulty } from '../../types/dungeon'
import { ChevronLeft } from 'lucide-vue-next'
import { UiBadge, UiButton, type BadgeTone } from '../ui'

const emit = defineEmits<{
  /** 返回上一级 */
  back: []
  /** 通知父级战斗已启动 */
  'battle-started': []
}>()

const props = defineProps<{
  /** 区域 ID */
  areaId: string
}>()

const dungeonStore = useDungeonStore()
const characterStore = useCharacterStore()
const loading = ref(false)

/** 精英确认弹窗状态 */
const showEliteConfirm = ref(false)
const pendingDungeon = ref<DungeonConfig | null>(null)

/** 区域名称 */
const areaName = computed(() => {
  const area = MAP_AREAS.find(a => a.id === props.areaId)
  return area?.name ?? '未知区域'
})

/** 该区域的副本列表 */
const dungeons = computed<DungeonConfig[]>(() => getDungeonsByArea(props.areaId))

/** 角色等级 */
const characterLevel = computed(() => characterStore.characterDetail?.level ?? 1)

/**
 * 判断副本是否已解锁
 * @param dungeon - 副本配置
 */
function isUnlocked(dungeon: DungeonConfig): boolean {
  return characterLevel.value >= dungeon.levelRequirement
}

/**
 * 进入副本（精英副本需确认）
 * @param dungeon - 副本配置
 */
async function handleEnter(dungeon: DungeonConfig): Promise<void> {
  if (dungeon.difficulty === 'elite') {
    pendingDungeon.value = dungeon
    showEliteConfirm.value = true
    return
  }
  await doEnterDungeon(dungeon)
}

/**
 * 确认进入精英副本
 */
async function confirmEliteEnter(): Promise<void> {
  showEliteConfirm.value = false
  if (pendingDungeon.value) {
    await doEnterDungeon(pendingDungeon.value)
    pendingDungeon.value = null
  }
}

/**
 * 取消进入精英副本
 */
function cancelEliteEnter(): void {
  showEliteConfirm.value = false
  pendingDungeon.value = null
}

/**
 * 执行进入副本逻辑
 * @param dungeon - 副本配置
 * @returns Promise，无业务返回值
 */
async function doEnterDungeon(dungeon: DungeonConfig): Promise<void> {
  loading.value = true
  try {
    const result = dungeonStore.enterDungeon(dungeon.id)
    if (!result.success) {
      return
    }

    const battleResult = await dungeonStore.startFloorBattle()
    if (battleResult.success) {
      emit('battle-started')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 获取副本掉落预览（去重后，根据难度过滤 eliteOnly 条目）
 * @param dungeonId - 副本 ID
 * @param difficulty - 副本难度
 */
function getDropPreview(dungeonId: string, difficulty: DungeonDifficulty): DungeonDropEntry[] | undefined {
  const table = getDungeonDropTable(dungeonId)
  if (!table) return undefined
  const allDrops = [...table.floorDrops, ...table.bossDrops]
  const seen = new Set<number>()
  return allDrops.filter(d => {
    if (d.eliteOnly && difficulty !== 'elite') return false
    if (seen.has(d.itemId)) return false
    seen.add(d.itemId)
    return true
  })
}

/**
 * 获取奖励品质对应的徽标色调。
 * @param rarity - 奖励品质
 * @returns 通用徽标色调
 */
function rewardBadgeTone(rarity?: string): BadgeTone {
  const tones: Record<string, BadgeTone> = {
    rare: 'rare',
    Rare: 'rare',
    epic: 'epic',
    Epic: 'epic',
    legendary: 'legendary',
    Legendary: 'legendary'
  }
  return rarity ? tones[rarity] ?? 'neutral' : 'neutral'
}
</script>

<style scoped>
/* ── 面板容器 ── */
.dungeon-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── 标题栏 ── */
.dungeon-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dungeon-header__back {
  color: var(--accent-blue);
}

.dungeon-header__title {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.015em;
  margin: 0;
}

/* ── 副本列表 ── */
.dungeon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}

.dungeon-list::-webkit-scrollbar { width: 4px; }
.dungeon-list::-webkit-scrollbar-track { background: transparent; }
.dungeon-list::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }

/* ── 副本卡片 ── */
.dungeon-card {
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s, opacity 0.3s;
}

.dungeon-card--normal {
  border-color: color-mix(in srgb, var(--accent-blue) 24%, transparent);
}

.dungeon-card--elite {
  border-color: color-mix(in srgb, var(--rarity-epic) 32%, transparent);
  box-shadow: var(--shadow-elevated);
}

.dungeon-card--locked {
  opacity: 0.5;
  pointer-events: none;
}

.dungeon-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

/* ── 难度图标 ── */
.dungeon-card__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 10px;
  flex-shrink: 0;
}

.dungeon-card__icon--normal {
  background: color-mix(in srgb, var(--accent-blue) 12%, transparent);
  color: var(--accent-blue);
}

.dungeon-card__icon--elite {
  background: color-mix(in srgb, var(--rarity-epic) 14%, transparent);
  color: var(--rarity-epic);
}

/* ── 信息区 ── */
.dungeon-card__info {
  flex: 1;
  min-width: 0;
}

.dungeon-card__name {
  font-family: var(--font-text);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px;
  line-height: 1.3;
}

.dungeon-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.dungeon-card__meta-sep {
  opacity: 0.4;
}

/* ── 体力消耗 ── */
.dungeon-card__stamina {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--accent-gold);
  flex-shrink: 0;
}

.stamina-icon {
  font-size: 14px;
}

/* ── 奖励预览 ── */
.dungeon-card__rewards {
  padding: 0 16px 10px;
}

.rewards-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 500;
}

.rewards-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}

.rewards-tag {
  font-weight: 500;
}

/* ── 掉落预览 ── */
.dungeon-card__drops {
  padding: 0 16px 8px;
}

/* ── 精英角标 ── */
.dungeon-card__elite-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.dungeon-card {
  position: relative;
}

/* ── 精英专属掉落标记 ── */
.rewards-tag--elite-only {
  border: 1px solid currentColor;
  font-weight: 600;
}

/* ── 操作区 ── */
.dungeon-card__action {
  padding: 0 16px 14px;
}

.dungeon-enter-btn {
  min-height: 34px;
}

.dungeon-locked-text {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  display: block;
  text-align: center;
  padding: 8px 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .dungeon-card__inner { padding: 10px 12px; }
  .dungeon-card__rewards { padding: 0 12px 8px; }
  .dungeon-card__drops { padding: 0 12px 6px; }
  .dungeon-card__action { padding: 0 12px 10px; }
}

@media (max-width: 375px) {
  .dungeon-header__title { font-size: var(--font-size-base); }
  .dungeon-list { gap: 8px; }
  .dungeon-card { border-radius: 12px; }
  .dungeon-card__inner { padding: 8px 10px; gap: 8px; }
  .dungeon-card__icon { width: 32px; height: 32px; font-size: 16px; border-radius: 8px; }
  .dungeon-card__name { font-size: var(--font-size-small); }
  .dungeon-card__meta { font-size: 11px; gap: 2px; }
  .dungeon-card__stamina { font-size: var(--font-size-caption); }
  .dungeon-card__rewards { padding: 0 10px 6px; }
  .dungeon-card__drops { padding: 0 10px 4px; }
  .dungeon-card__action { padding: 0 10px 8px; }
  .rewards-label { font-size: 10px; }
  .rewards-tags { gap: 3px; margin-top: 3px; }
  .dungeon-locked-text { font-size: var(--font-size-caption); }
}
</style>
