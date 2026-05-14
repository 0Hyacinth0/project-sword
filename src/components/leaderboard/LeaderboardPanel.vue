<template>
  <div class="leaderboard-panel">
    <!-- 顶部：分类 Tab + 范围 Toggle -->
    <div class="leaderboard-panel__header">
      <div class="leaderboard-panel__tabs">
        <button
          v-for="tab in categoryTabs"
          :key="tab.value"
          :class="['leaderboard-panel__tab', { 'leaderboard-panel__tab--active': store.category === tab.value }]"
          @click="store.setCategory(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="leaderboard-panel__scope">
        <button
          :class="['leaderboard-panel__scope-btn', { 'leaderboard-panel__scope-btn--active': store.scope === 'all' }]"
          @click="store.setScope('all')"
        >全服</button>
        <button
          :class="['leaderboard-panel__scope-btn', { 'leaderboard-panel__scope-btn--active': store.scope === 'friends' }]"
          @click="store.setScope('friends')"
        >好友</button>
      </div>
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
import type { LeaderboardCategory } from '../../types/leaderboard'

const store = useLeaderboardStore()

/** 分类 Tab 配置 */
const categoryTabs: { label: string; value: LeaderboardCategory }[] = [
  { label: '等级', value: 'level' },
  { label: '战力', value: 'power' },
  { label: '竞技', value: 'arena' }
]

/**
 * 职业转 CSS 类名
 * @param profession - 职业名
 */
function professionClass(profession: string): string {
  const map: Record<string, string> = { Warrior: 'warrior', Mage: 'mage', Hunter: 'hunter' }
  return map[profession] ?? 'warrior'
}

/**
 * 格式化数值显示
 * @param value - 排序值
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
}

.leaderboard-panel__tabs {
  display: flex;
  gap: 0;
  background: rgba(142, 142, 147, 0.12);
  border-radius: 10px;
  padding: 3px;
}

.leaderboard-panel__tab {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.leaderboard-panel__tab--active {
  background: var(--accent-blue);
  color: white;
  font-weight: 600;
}

.leaderboard-panel__scope {
  display: flex;
  gap: 0;
  background: rgba(142, 142, 147, 0.08);
  border-radius: 8px;
  padding: 2px;
}

.leaderboard-panel__scope-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.leaderboard-panel__scope-btn--active {
  background: var(--accent-blue);
  color: white;
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
  border: 2px solid rgba(142, 142, 147, 0.2);
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
  color: white;
}

.podium-item--gold .podium-item__avatar {
  width: 48px;
  height: 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #ffd700, #ffb800);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.podium-item--silver .podium-item__avatar {
  width: 40px;
  height: 40px;
  font-size: 15px;
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  box-shadow: 0 0 8px rgba(192, 192, 192, 0.3);
}

.podium-item--bronze .podium-item__avatar {
  width: 40px;
  height: 40px;
  font-size: 15px;
  background: linear-gradient(135deg, #cd7f32, #e8a849);
  box-shadow: 0 0 8px rgba(205, 127, 50, 0.3);
}

.podium-item__avatar--warrior { background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important; }
.podium-item__avatar--mage { background: linear-gradient(135deg, #7c5cfc, #6c5ce7) !important; }
.podium-item__avatar--hunter { background: linear-gradient(135deg, #00b894, #00a884) !important; }

.podium-item__online {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4cd137;
  border: 2px solid var(--bg-primary);
}

.podium-item__rank {
  font-weight: 700;
  font-size: 16px;
}

.podium-item__rank--1 { color: #ffd700; }
.podium-item__rank--2 { color: #c0c0c0; }
.podium-item__rank--3 { color: #cd7f32; }

.podium-item__name {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-primary);
}

.podium-item__value {
  font-size: 11px;
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
  background: rgba(255, 255, 255, 0.04);
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
  color: white;
}

.list-row__avatar--warrior { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }
.list-row__avatar--mage { background: rgba(124, 92, 252, 0.2); color: #7c5cfc; }
.list-row__avatar--hunter { background: rgba(0, 184, 148, 0.2); color: #00b894; }

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
  background: #4cd137;
}

/* ── 自己排名 ── */
.leaderboard-panel__self {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.12), rgba(0, 113, 227, 0.06));
  border: 1px solid rgba(0, 113, 227, 0.2);
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
