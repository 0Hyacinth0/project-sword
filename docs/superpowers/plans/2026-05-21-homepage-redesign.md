# 游戏首页内容展示区重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页从"两个按钮"改造为包含玩家数据统计、推荐副本、活动公告、更新公告的混合网格内容展示区。

**Architecture:** 新建独立 `HomePanel.vue` 组件（与 ShopPanel 等同级），新建 `api/home.ts` 提供 Mock 数据和预留 API 接口。HomeView.vue 仅替换 `centerView === 'home'` 区块引用新组件。

**Tech Stack:** Vue 3 + TypeScript + Lucide Icons + Liquid Glass UI 组件库

---

### Task 1: 创建首页类型定义

**Files:**
- Create: `src/types/home.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
/**
 * 首页模块类型定义
 * 覆盖玩家统计、推荐副本、活动公告、更新公告
 */

/** 玩家今日统计数据 */
export interface PlayerDailyStats {
  /** 在线时长（分钟） */
  onlineMinutes: number
  /** 今日战斗次数 */
  battleCount: number
  /** 今日胜场数 */
  winCount: number
  /** 今日获得金币 */
  goldEarned: number
}

/** 推荐副本/地图项 */
export interface RecommendedArea {
  id: string
  /** 区域或副本名称 */
  name: string
  /** 等级范围 */
  levelRange: string
  /** 推荐理由 */
  reason: string
  /** 类型：野外区域 or 副本 */
  type: 'wild' | 'dungeon'
  /** 关联的区域 ID，用于跳转 */
  areaId: string
}

/** 活动公告 */
export interface ActivityAnnouncement {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'ongoing' | 'upcoming' | 'ended'
}

/** 更新公告 */
export interface UpdateAnnouncement {
  id: string
  version: string
  title: string
  date: string
  changes: string[]
}

/** 首页概览响应（汇总所有模块数据） */
export interface HomeOverview {
  stats: PlayerDailyStats
  recommendations: RecommendedArea[]
  activities: ActivityAnnouncement[]
  updates: UpdateAnnouncement[]
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/home.ts
git commit -m "feat(home): add homepage type definitions"
```

---

### Task 2: 创建首页 API + Mock 数据

**Files:**
- Create: `src/api/home.ts`

- [ ] **Step 1: 创建 API 文件**

参考 `src/api/shop.ts` 的模式：先用 Mock 数据返回，函数签名预留真实 API 调用。

```typescript
/**
 * 首页 API
 * 提供玩家统计、推荐副本、活动公告、更新公告能力
 */
import type { ApiResponse } from './request'
import type { HomeOverview, PlayerDailyStats, RecommendedArea, ActivityAnnouncement, UpdateAnnouncement } from '../types/home'

// ── Mock 数据 ──

const mockStats: PlayerDailyStats = {
  onlineMinutes: 135,
  battleCount: 12,
  winCount: 9,
  goldEarned: 1280
}

const mockRecommendations: RecommendedArea[] = [
  {
    id: 'rec-1',
    name: '迷雾森林',
    levelRange: 'Lv.1-10',
    reason: '适合当前等级，可获取经验与基础装备',
    type: 'wild',
    areaId: 'mist_forest'
  },
  {
    id: 'rec-2',
    name: '哥布林洞穴',
    levelRange: 'Lv.5-15',
    reason: '推荐副本：掉落猎人初级套装材料',
    type: 'dungeon',
    areaId: 'goblin_cave'
  }
]

const mockActivities: ActivityAnnouncement[] = [
  {
    id: 'act-1',
    title: '五一限时活动「勇者试炼」',
    description: '通关任意精英副本可获传说装备碎片，集齐10片可兑换随机传说装备',
    startTime: '2026-05-01T00:00:00Z',
    endTime: '2026-05-07T23:59:59Z',
    status: 'ongoing'
  },
  {
    id: 'act-2',
    title: '新区「冰霜雪原」即将开放',
    description: '全新区域 Lv.31-40 即将开放，冰巨人、雪狼等你挑战',
    startTime: '2026-05-10T00:00:00Z',
    endTime: '2026-06-10T23:59:59Z',
    status: 'upcoming'
  },
  {
    id: 'act-3',
    title: '战宠进化材料掉率翻倍',
    description: '活动期间所有副本的战宠进化材料掉率提升至 2 倍',
    startTime: '2026-04-25T00:00:00Z',
    endTime: '2026-04-30T23:59:59Z',
    status: 'ended'
  }
]

const mockUpdates: UpdateAnnouncement[] = [
  {
    id: 'upd-1',
    version: 'v1.3.0',
    title: '战宠系统全面上线',
    date: '2026-05-20',
    changes: [
      '新增战宠获取、出战、喂食、进化功能',
      '战宠作为独立单位参与回合制战斗',
      '新增 10 种战宠类型，含 N/R/SR/SSR 品质',
      '新增战宠图鉴页面，记录收集进度',
      '修复部分装备套装效果未正确触发的问题'
    ]
  },
  {
    id: 'upd-2',
    version: 'v1.2.0',
    title: '竞技场与 PVP 对战',
    date: '2026-05-15',
    changes: [
      '新增实时 PVP 竞技场，支持 Elo 积分匹配',
      '新增 6 级段位系统（青铜至王者）',
      '新增 30 秒出招倒计时',
      '新增非实时好友挑战功能'
    ]
  }
]

// ── API 函数 ──

/**
 * 获取首页概览数据（统计+推荐+活动+更新）。
 * 当前使用 Mock 数据，后续对接真实 API。
 * @returns 首页概览响应
 */
export async function getHomeOverviewApi(): Promise<ApiResponse<HomeOverview>> {
  // TODO: 对接真实 API 后替换为：
  // const res = await request.get<ApiResponse<HomeOverview>>('/home/overview')
  // return res.data

  return {
    code: 200,
    message: '操作成功',
    data: {
      stats: mockStats,
      recommendations: mockRecommendations,
      activities: mockActivities,
      updates: mockUpdates
    }
  }
}

/**
 * 获取玩家今日统计数据。
 * @returns 统计数据响应
 */
export async function getHomeStatsApi(): Promise<ApiResponse<PlayerDailyStats>> {
  // TODO: const res = await request.get<ApiResponse<PlayerDailyStats>>('/home/stats')
  // return res.data
  return { code: 200, message: '操作成功', data: mockStats }
}

/**
 * 获取推荐副本/地图。
 * @returns 推荐列表响应
 */
export async function getHomeRecommendationsApi(): Promise<ApiResponse<RecommendedArea[]>> {
  // TODO: const res = await request.get<ApiResponse<RecommendedArea[]>>('/home/recommendations')
  // return res.data
  return { code: 200, message: '操作成功', data: mockRecommendations }
}

/**
 * 获取活动公告列表。
 * @returns 活动公告响应
 */
export async function getHomeActivitiesApi(): Promise<ApiResponse<ActivityAnnouncement[]>> {
  // TODO: const res = await request.get<ApiResponse<ActivityAnnouncement[]>>('/home/activities')
  // return res.data
  return { code: 200, message: '操作成功', data: mockActivities }
}

/**
 * 获取更新公告列表。
 * @returns 更新公告响应
 */
export async function getHomeUpdatesApi(): Promise<ApiResponse<UpdateAnnouncement[]>> {
  // TODO: const res = await request.get<ApiResponse<UpdateAnnouncement[]>>('/home/updates')
  // return res.data
  return { code: 200, message: '操作成功', data: mockUpdates }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/home.ts
git commit -m "feat(home): add homepage API with mock data"
```

---

### Task 3: 创建 HomePanel 组件 — 模板与脚本

**Files:**
- Create: `src/components/home/HomePanel.vue`

- [ ] **Step 1: 创建 HomePanel.vue**

组件接收 `characterLevel` prop（用于推荐副本），以及 `@navigate` 事件用于跳转。

```vue
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

/** 格式化在线时长 */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分钟`
  return `${h}小时${m}分`
}

/** 统计卡片数据 */
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

/** 活动状态对应的 Badge 色调 */
function activityTone(status: ActivityAnnouncement['status']): 'success' | 'primary' | 'neutral' {
  const map: Record<string, 'success' | 'primary' | 'neutral'> = {
    ongoing: 'success',
    upcoming: 'primary',
    ended: 'neutral'
  }
  return map[status] ?? 'neutral'
}

/** 活动状态标签文字 */
function activityLabel(status: ActivityAnnouncement['status']): string {
  const map: Record<string, string> = { ongoing: '进行中', upcoming: '即将开始', ended: '已结束' }
  return map[status] ?? status
}

/** 格式化时间范围 */
function formatTimeRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(s)} — ${fmt(e)}`
}

/** 点击推荐区域的"前往"按钮 */
function handleNavigate(rec: RecommendedArea): void {
  if (rec.type === 'wild') {
    emit('navigate', 'map')
  } else {
    emit('navigate', 'dungeon', rec.areaId)
  }
}

/** 加载首页数据 */
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
```

- [ ] **Step 2: 提交**

```bash
mkdir -p src/components/home
git add src/components/home/HomePanel.vue
git commit -m "feat(home): create HomePanel component with template and script"
```

---

### Task 4: HomePanel 样式

**Files:**
- Modify: `src/components/home/HomePanel.vue` — 追加 `<style scoped>` 块

- [ ] **Step 1: 在 HomePanel.vue 的 `</script>` 标签后追加样式块**

```css
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
```

- [ ] **Step 2: 提交**

```bash
git add src/components/home/HomePanel.vue
git commit -m "feat(home): add HomePanel styles with Liquid Glass design"
```

---

### Task 5: 集成 HomePanel 到 HomeView

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 在 HomeView.vue 的 import 区域新增 HomePanel 引用**

在 `import ShopPanel from '../components/shop/ShopPanel.vue'` 后面添加：

```typescript
import HomePanel from '../components/home/HomePanel.vue'
```

- [ ] **Step 2: 替换 `centerView === 'home'` 区块**

将 HomeView.vue 中第 135-152 行的欢迎视图替换为：

```vue
        <!-- 主页内容展示 -->
        <UiPanel v-else-if="centerView === 'home'" class="game-main" stretch>
          <HomePanel
            :character-level="charDetail?.level"
            @navigate="handleHomeNavigate"
          />
        </UiPanel>
```

- [ ] **Step 3: 在 script 区域添加 handleHomeNavigate 函数**

在 `handleOpenDungeon` 函数附近添加：

```typescript
/**
 * 处理首页面板的导航事件。
 * @param view - 目标视图名称
 * @param areaId - 可选的区域 ID（跳转副本时使用）
 */
function handleHomeNavigate(view: string, areaId?: string): void {
  if (view === 'dungeon' && areaId) {
    selectedAreaId.value = areaId
  }
  centerView.value = view as CenterView
}
```

- [ ] **Step 4: 删除不再需要的样式**

删除 HomeView.vue 中不再需要的 `game-main__welcome`、`game-main__desc`、`game-main__actions` 相关样式（在 scoped style 的响应式区块中）。

具体来说，在 `@media (max-width: 768px)` 中删除：

```css
  .game-main__welcome {
    font-size: var(--font-size-base);
  }

  .game-main__desc {
    font-size: var(--font-size-xs);
  }
```

在 `@media (max-width: 375px)` 中删除：

```css
  .game-main__actions,
```

以及在 768px 断点中的 `game-main__actions,` 行。

- [ ] **Step 5: 提交**

```bash
git add src/views/HomeView.vue
git commit -m "feat(home): integrate HomePanel into HomeView, replace welcome buttons"
```

---

### Task 6: 验证与暗色模式测试

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 浏览器验证**

在浏览器中验证以下内容：

1. 登录后进入首页，中间面板应显示四个模块
2. 上半区左右两栏：左侧今日数据（4 个统计卡片），右侧推荐探索（2 个推荐卡片）
3. 下半区：活动公告（默认展开，3 条活动带状态徽章），更新公告（默认展开，最新一条版本信息）
4. 点击活动/更新公告标题栏可折叠/展开
5. 点击推荐副本的"前往"按钮可跳转到地图/副本视图
6. 切换暗色模式，确认所有模块样式正常
7. 缩小浏览器窗口到 768px 以下，确认上半区变为纵向堆叠

- [ ] **Step 3: 修复发现的问题（如有）**

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "fix(home): address visual issues from manual testing"
```
