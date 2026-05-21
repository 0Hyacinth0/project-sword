<!-- 首页内容展示面板 — 混合网格布局 -->
<template>
  <div class="home-panel">
    <!-- 加载状态 -->
    <div v-if="loading" class="home-loading" aria-live="polite">
      <Loader2 :size="24" class="home-loading__spinner" />
      <span>正在加载...</span>
    </div>

    <template v-else>
      <!-- ═══ 上半区：左右两栏 ═══ -->
      <div class="home-top-row">
        <!-- 玩家数据统计 -->
        <section class="home-section">
          <h3 class="home-section__title">
            <BarChart3 :size="16" class="home-section__icon" />
            今日数据
          </h3>
          <div class="stat-grid">
            <div v-for="item in statCards" :key="item.label" class="stat-card">
              <component :is="item.icon" :size="18" class="stat-card__icon" :style="{ color: item.color }" />
              <span class="stat-card__value">{{ item.value }}</span>
              <span class="stat-card__label">{{ item.label }}</span>
            </div>
          </div>
        </section>

        <!-- 推荐副本/地图 -->
        <section class="home-section">
          <h3 class="home-section__title">
            <Compass :size="16" class="home-section__icon" />
            推荐探索
          </h3>
          <div class="recommend-list">
            <article v-for="rec in overview.recommendations" :key="rec.id" class="recommend-card">
              <div class="recommend-card__info">
                <div class="recommend-card__name">
                  <span class="recommend-card__badge">{{ rec.type === 'wild' ? '野外' : '副本' }}</span>
                  {{ rec.name }}
                </div>
                <span class="recommend-card__level">{{ rec.levelRange }}</span>
                <p class="recommend-card__reason">{{ rec.reason }}</p>
              </div>
              <UiButton size="sm" @click="handleNavigate(rec)">
                <template #icon><ArrowRight :size="14" /></template>
                前往
              </UiButton>
            </article>
          </div>
        </section>
      </div>

      <!-- ═══ 下半区：公告纵向堆叠 ═══ -->

      <!-- 活动公告 -->
      <section class="home-section">
        <button class="home-section__toggle" @click="activityExpanded = !activityExpanded">
          <h3 class="home-section__title">
            <Sparkles :size="16" class="home-section__icon" />
            活动公告
          </h3>
          <ChevronDown :size="16" class="home-section__chevron" :class="{ 'home-section__chevron--open': activityExpanded }" />
        </button>
        <Transition name="collapse">
          <div v-if="activityExpanded" class="announce-list">
            <article
              v-for="activity in overview.activities"
              :key="activity.id"
              class="announce-item"
            >
              <div class="announce-item__header">
                <span class="announce-item__title">{{ activity.title }}</span>
                <UiBadge :tone="activityTone(activity.status)" size="sm">
                  {{ activityLabel(activity.status) }}
                </UiBadge>
              </div>
              <p class="announce-item__desc">{{ activity.description }}</p>
              <span class="announce-item__time">{{ formatTimeRange(activity.startTime, activity.endTime) }}</span>
            </article>
          </div>
        </Transition>
      </section>

      <!-- 更新公告 -->
      <section class="home-section">
        <button class="home-section__toggle" @click="updateExpanded = !updateExpanded">
          <h3 class="home-section__title">
            <FileText :size="16" class="home-section__icon" />
            更新公告
          </h3>
          <ChevronDown :size="16" class="home-section__chevron" :class="{ 'home-section__chevron--open': updateExpanded }" />
        </button>
        <Transition name="collapse">
          <div v-if="updateExpanded && latestUpdate" class="update-detail">
            <div class="update-detail__header">
              <span class="update-detail__version">{{ latestUpdate.version }}</span>
              <span class="update-detail__date">{{ latestUpdate.date }}</span>
            </div>
            <h4 class="update-detail__title">{{ latestUpdate.title }}</h4>
            <ul class="update-detail__changes">
              <li v-for="(change, i) in latestUpdate.changes" :key="i">{{ change }}</li>
            </ul>
          </div>
        </Transition>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getHomeOverviewApi } from '../../api/home'
import { UiBadge, UiButton } from '../ui'
import type { HomeOverview, RecommendedArea, ActivityAnnouncement } from '../../types/home'
import {
  Loader2, BarChart3, Compass, Sparkles, FileText,
  Clock, Swords, Trophy, Coins,
  ArrowRight, ChevronDown
} from 'lucide-vue-next'

defineProps<{
  /** 当前角色等级，用于推荐副本（预留） */
  characterLevel?: number
}>()

const emit = defineEmits<{
  /** 导航到指定视图 */
  navigate: [view: string, areaId?: string]
}>()

const loading = ref(false)
const activityExpanded = ref(true)
const updateExpanded = ref(true)

const overview = ref<HomeOverview>({
  stats: { onlineMinutes: 0, battleCount: 0, winCount: 0, goldEarned: 0 },
  recommendations: [],
  activities: [],
  updates: []
})

/**
 * 格式化在线时长为可读字符串。
 * @param minutes - 在线分钟数
 * @returns 格式化后的时长字符串
 */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分钟`
  return `${h}小时${m}分`
}

/** 统计卡片数据，从 overview.stats 派生 */
const statCards = computed(() => [
  {
    label: '在线时长',
    value: formatDuration(overview.value.stats.onlineMinutes),
    icon: Clock,
    color: 'var(--accent-blue)'
  },
  {
    label: '战斗次数',
    value: `${overview.value.stats.battleCount}场`,
    icon: Swords,
    color: 'var(--accent-red)'
  },
  {
    label: '今日胜率',
    value: overview.value.stats.battleCount > 0
      ? `${Math.round((overview.value.stats.winCount / overview.value.stats.battleCount) * 100)}%`
      : '0%',
    icon: Trophy,
    color: 'var(--accent-gold)'
  },
  {
    label: '获得金币',
    value: overview.value.stats.goldEarned.toLocaleString(),
    icon: Coins,
    color: 'var(--accent-green)'
  }
])

/** 最新一条更新公告 */
const latestUpdate = computed(() => overview.value.updates[0] ?? null)

/**
 * 获取活动状态对应的 Badge 色调。
 * @param status - 活动状态
 * @returns Badge 色调值
 */
function activityTone(status: ActivityAnnouncement['status']): 'success' | 'primary' | 'neutral' {
  const map: Record<string, 'success' | 'primary' | 'neutral'> = {
    ongoing: 'success',
    upcoming: 'primary',
    ended: 'neutral'
  }
  return map[status] ?? 'neutral'
}

/**
 * 获取活动状态的中文标签。
 * @param status - 活动状态
 * @returns 中文标签文字
 */
function activityLabel(status: ActivityAnnouncement['status']): string {
  const map: Record<string, string> = { ongoing: '进行中', upcoming: '即将开始', ended: '已结束' }
  return map[status] ?? status
}

/**
 * 格式化时间范围为可读字符串。
 * @param start - ISO 开始时间
 * @param end - ISO 结束时间
 * @returns 格式化后的时间范围
 */
function formatTimeRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(s)} — ${fmt(e)}`
}

/**
 * 点击推荐区域的"前往"按钮，派发导航事件。
 * @param rec - 被点击的推荐项
 */
function handleNavigate(rec: RecommendedArea): void {
  if (rec.type === 'wild') {
    emit('navigate', 'map')
  } else {
    emit('navigate', 'dungeon', rec.areaId)
  }
}

/**
 * 加载首页概览数据。
 */
async function loadOverview(): Promise<void> {
  loading.value = true
  try {
    const res = await getHomeOverviewApi()
    if (res.code === 200) {
      overview.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOverview()
})
</script>

<style scoped>
.home-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 加载状态 ── */
.home-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-muted);
}

.home-loading__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 上半区两栏布局 ── */
.home-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── 模块通用 ── */
.home-section {
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 16px;
  position: relative;
}

.home-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
}

.home-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.015em;
}

.home-section__icon {
  color: var(--accent-blue);
}

.home-section__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: -16px -16px 0;
  padding: 16px;
  border-radius: 16px 16px 0 0;
  transition: background 0.2s;
}

.home-section__toggle:hover {
  background: rgba(255, 255, 255, 0.05);
}

.home-section__toggle .home-section__title {
  margin: 0;
}

.home-section__chevron {
  color: var(--text-muted);
  transition: transform 0.3s var(--ease-smooth);
}

.home-section__chevron--open {
  transform: rotate(180deg);
}

/* ── 统计卡片网格 ── */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  transition: transform 0.2s var(--ease-smooth);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card__icon {
  margin-bottom: 2px;
}

.stat-card__value {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.stat-card__label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 推荐副本列表 ── */
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommend-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  transition: transform 0.2s var(--ease-smooth);
}

.recommend-card:hover {
  transform: translateY(-2px);
}

.recommend-card__info {
  flex: 1;
  min-width: 0;
}

.recommend-card__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-small);
}

.recommend-card__badge {
  font-size: var(--font-size-caption);
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 113, 227, 0.12);
  color: var(--accent-blue);
  font-weight: 500;
  white-space: nowrap;
}

.recommend-card__level {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 2px;
  display: block;
}

.recommend-card__reason {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 4px 0 0;
  line-height: 1.4;
}

/* ── 公告列表 ── */
.announce-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.announce-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.announce-item:last-child {
  border-bottom: none;
}

.announce-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.announce-item__title {
  font-weight: 500;
  font-size: var(--font-size-small);
  color: var(--text-primary);
}

.announce-item__desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 4px 0;
  line-height: 1.5;
}

.announce-item__time {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

/* ── 更新公告详情 ── */
.update-detail {
  padding-top: 4px;
}

.update-detail__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.update-detail__version {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 980px;
  background: rgba(0, 113, 227, 0.12);
  color: var(--accent-blue);
  font-size: var(--font-size-caption);
  font-weight: 500;
}

.update-detail__date {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.update-detail__title {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.update-detail__changes {
  margin: 0;
  padding-left: 16px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  line-height: 1.6;
}

.update-detail__changes li {
  margin-bottom: 2px;
}

/* ── 折叠动画 ── */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s var(--ease-smooth);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ── 暗色模式 ── */
[data-theme='dark'] .home-loading {
  color: var(--text-muted);
}

[data-theme='dark'] .home-section__toggle:hover {
  background: rgba(255, 255, 255, 0.04);
}

[data-theme='dark'] .recommend-card__badge {
  background: rgba(10, 132, 255, 0.15);
}

[data-theme='dark'] .update-detail__version {
  background: rgba(10, 132, 255, 0.15);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .home-top-row {
    grid-template-columns: 1fr;
  }

  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }

  .home-section {
    padding: 12px;
  }
}

@media (max-width: 375px) {
  .home-panel {
    gap: 10px;
  }

  .home-section {
    padding: 10px;
    border-radius: 12px;
  }

  .stat-card {
    padding: 8px 6px;
  }

  .recommend-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .recommend-card .ui-button {
    width: 100%;
  }
}
</style>
