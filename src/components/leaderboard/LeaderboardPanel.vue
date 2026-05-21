<template>
  <div class="leaderboard-panel">
    <!-- 顶部：分类 Tab + 范围 Toggle -->
    <div class="leaderboard-panel__header">
      <UiTabs
        class="leaderboard-panel__tabs"
        :model-value="store.category"
        :items="categoryTabs"
        size="sm"
        :block="false"
        @update:model-value="handleCategoryChange"
      />
      <UiTabs
        class="leaderboard-panel__scope"
        :model-value="store.scope"
        :items="scopeTabs"
        size="sm"
        :block="false"
        @update:model-value="handleScopeChange"
      />
    </div>

    <!-- 加载态 -->
    <div v-if="store.loading" class="leaderboard-panel__loading">
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>

    <template v-else>
      <!-- 领奖台：前三名 -->
      <div v-if="store.topThree.length >= 3" class="leaderboard-panel__podium">
        <!-- 第 2 名（左） -->
        <div class="podium-item podium-item--silver">
          <div class="podium-item__avatar-wrap">
            <div :class="['podium-item__avatar', `podium-item__avatar--${professionClass(store.topThree[1].profession)}`]">
              {{ store.topThree[1].characterName[0] }}
            </div>
            <span v-if="store.topThree[1].isOnline" class="podium-item__online"></span>
          </div>
          <span class="podium-item__rank podium-item__rank--2">2</span>
          <span class="podium-item__name">{{ store.topThree[1].characterName }}</span>
          <span class="podium-item__value">{{ formatValue(store.topThree[1].value) }}</span>
        </div>
        <!-- 第 1 名（中） -->
        <div class="podium-item podium-item--gold">
          <div class="podium-item__avatar-wrap">
            <div :class="['podium-item__avatar', `podium-item__avatar--${professionClass(store.topThree[0].profession)}`]">
              {{ store.topThree[0].characterName[0] }}
            </div>
            <span v-if="store.topThree[0].isOnline" class="podium-item__online"></span>
          </div>
          <span class="podium-item__rank podium-item__rank--1">1</span>
          <span class="podium-item__name">{{ store.topThree[0].characterName }}</span>
          <span class="podium-item__value">{{ formatValue(store.topThree[0].value) }}</span>
        </div>
        <!-- 第 3 名（右） -->
        <div class="podium-item podium-item--bronze">
          <div class="podium-item__avatar-wrap">
            <div :class="['podium-item__avatar', `podium-item__avatar--${professionClass(store.topThree[2].profession)}`]">
              {{ store.topThree[2].characterName[0] }}
            </div>
            <span v-if="store.topThree[2].isOnline" class="podium-item__online"></span>
          </div>
          <span class="podium-item__rank podium-item__rank--3">3</span>
          <span class="podium-item__name">{{ store.topThree[2].characterName }}</span>
          <span class="podium-item__value">{{ formatValue(store.topThree[2].value) }}</span>
        </div>
      </div>

      <!-- 列表区：第 4 名及以后 -->
      <div class="leaderboard-panel__list">
        <div
          v-for="entry in store.restList"
          :key="entry.characterId"
          class="list-row"
        >
          <span class="list-row__rank">{{ entry.rank }}</span>
          <div :class="['list-row__avatar', `list-row__avatar--${professionClass(entry.profession)}`]">
            {{ entry.characterName[0] }}
          </div>
          <span class="list-row__name">{{ entry.characterName }}</span>
          <span class="list-row__value">{{ formatValue(entry.value) }}</span>
          <span v-if="entry.isOnline" class="list-row__online"></span>
        </div>
      </div>

      <!-- 自己排名 -->
      <div class="leaderboard-panel__self">
        <span class="self-label">我的排名</span>
        <span class="self-rank">#{{ store.myRank }}</span>
        <span class="self-value">{{ formatValue(store.myValue) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeaderboardStore } from '../../stores/leaderboard'
import type { LeaderboardCategory, LeaderboardScope } from '../../types/leaderboard'
import { UiTabs, type UiTabItem } from '../ui'

const store = useLeaderboardStore()

/** 分类 Tab 配置 */
const categoryTabs: UiTabItem[] = [
  { label: '等级', value: 'level' },
  { label: '战力', value: 'power' },
  { label: '比武', value: 'arena' }
]

/** 范围 Tab 配置 */
const scopeTabs: UiTabItem[] = [
  { label: '全服', value: 'all' },
  { label: '好友', value: 'friends' }
]

/**
 * 切换排行榜分类。
 * @param value - UiTabs 传出的分类值
 * @returns 无返回值
 */
function handleCategoryChange(value: string | number): void {
  store.setCategory(value as LeaderboardCategory)
}

/**
 * 切换排行榜范围。
 * @param value - UiTabs 传出的范围值
 * @returns 无返回值
 */
function handleScopeChange(value: string | number): void {
  store.setScope(value as LeaderboardScope)
}

/**
 * 职业转 CSS 类名
 * @param profession - 职业名
 * @returns 职业样式类名片段
 */
function professionClass(profession: string): string {
  const map: Record<string, string> = { Warrior: 'warrior', Mage: 'mage', Hunter: 'hunter' }
  return map[profession] ?? 'warrior'
}

/**
 * 格式化数值显示
 * @param value - 排序值
 * @returns 格式化后的数值文本
 */
function formatValue(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

onMounted(() => {
  store.fetchLeaderboard()
})
</script>

<style scoped>
.leaderboard-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  gap: 12px;
  overflow-y: auto;
}

/* ── 头部：Tab + Toggle ── */
.leaderboard-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.leaderboard-panel__tabs {
  flex: 1 1 auto;
  min-width: 0;
}

.leaderboard-panel__scope {
  flex: 0 0 auto;
}

/* ── 加载态 ── */
.leaderboard-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--text-muted);
  font-size: var(--font-size-caption);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-light);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 领奖台 ── */
.leaderboard-panel__podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 0;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.podium-item--gold { width: 72px; }
.podium-item--silver { width: 60px; }
.podium-item--bronze { width: 60px; }

.podium-item__avatar-wrap {
  position: relative;
}

.podium-item__avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--button-text);
}

.podium-item--gold .podium-item__avatar {
  width: 48px;
  height: 48px;
  font-size: 18px;
  background: var(--accent-gold);
  box-shadow: var(--shadow-float);
}

.podium-item--silver .podium-item__avatar {
  width: 40px;
  height: 40px;
  font-size: 15px;
  background: var(--text-muted);
  box-shadow: var(--shadow-card);
}

.podium-item--bronze .podium-item__avatar {
  width: 40px;
  height: 40px;
  font-size: 15px;
  background: var(--rarity-legendary);
  box-shadow: var(--shadow-card);
}

.podium-item__avatar--warrior { background: var(--accent-red) !important; }
.podium-item__avatar--mage { background: var(--rarity-epic) !important; }
.podium-item__avatar--hunter { background: var(--accent-green) !important; }

.podium-item__online {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2px solid var(--bg-panel);
}

.podium-item__rank {
  font-weight: 700;
  font-size: 16px;
}

.podium-item__rank--1 { color: var(--accent-gold); }
.podium-item__rank--2 { color: var(--text-muted); }
.podium-item__rank--3 { color: var(--rarity-legendary); }

.podium-item__name {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-primary);
}

.podium-item__value {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 列表区 ── */
.leaderboard-panel__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-panel-light);
  border-radius: 10px;
  position: relative;
}

.list-row__rank {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  width: 24px;
  text-align: center;
}

.list-row__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.list-row__avatar--warrior { background: color-mix(in srgb, var(--accent-red) 14%, transparent); color: var(--accent-red); }
.list-row__avatar--mage { background: color-mix(in srgb, var(--rarity-epic) 14%, transparent); color: var(--rarity-epic); }
.list-row__avatar--hunter { background: color-mix(in srgb, var(--accent-green) 14%, transparent); color: var(--accent-green); }

.list-row__name {
  flex: 1;
  font-size: var(--font-size-caption);
  font-weight: 500;
  color: var(--text-primary);
}

.list-row__value {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  font-weight: 500;
}

.list-row__online {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

/* ── 自己排名 ── */
.leaderboard-panel__self {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--accent-blue) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-blue) 24%, transparent);
  border-radius: 12px;
  margin-top: auto;
}

.self-label {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.self-rank {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-blue);
}

.self-value {
  font-size: var(--font-size-caption);
  color: var(--text-primary);
  font-weight: 600;
  margin-left: auto;
}
</style>
