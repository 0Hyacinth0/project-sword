# 排行榜功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现排行榜系统，支持等级/战力/竞技积分三个分类，全服/好友两个范围，作为底部导航新 Tab 嵌入 HomeView。

**Architecture:** 新建类型、API、Store、Panel 四层文件，遵循项目现有 Pinia Composition API + Mock API 模式。底部导航新增"排行"Tab，centerView 扩展 `leaderboard` 值。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Liquid Glass CSS

---

## File Structure

| File | Action | Responsibility |
|:---|:---|:---|
| `src/types/leaderboard.ts` | Create | 排行榜类型定义 |
| `src/api/leaderboard.ts` | Create | API 层 + Mock 数据 |
| `src/stores/leaderboard.ts` | Create | Pinia 状态管理 |
| `src/components/leaderboard/LeaderboardPanel.vue` | Create | 排行榜面板组件 |
| `src/views/HomeView.vue` | Modify | 底部导航 + centerView |

---

### Task 1: 定义排行榜类型

**Files:**
- Create: `src/types/leaderboard.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
/**
 * 排行榜系统类型定义
 */

/** 排行榜分类 */
export type LeaderboardCategory = 'level' | 'power' | 'arena'

/** 排行榜范围 */
export type LeaderboardScope = 'all' | 'friends'

/** 排行条目 */
export interface LeaderboardEntry {
  /** 排名 */
  rank: number
  /** 角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 排序值（等级=等级，战力=战力，竞技=积分） */
  value: number
  /** 是否在线 */
  isOnline: boolean
}

/** 排行榜 API 响应 */
export interface LeaderboardResponse {
  /** 排行条目列表 */
  entries: LeaderboardEntry[]
  /** 当前角色排名（不在列表中时使用） */
  myRank: number
  /** 当前角色排序值 */
  myValue: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/leaderboard.ts
git commit -m "feat: add leaderboard type definitions"
```

---

### Task 2: 创建排行榜 API + Mock 数据

**Files:**
- Create: `src/api/leaderboard.ts`

- [ ] **Step 1: 创建 API 文件**

```typescript
/**
 * 排行榜相关 API
 * 获取全服/好友排行榜数据
 */
import request from './request'
import type { ApiResponse } from './request'
import type { LeaderboardCategory, LeaderboardScope, LeaderboardResponse } from '../types/leaderboard'
import { isMockEnabled } from '../utils/mockConfig'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Mock 角色名池 */
const MOCK_NAMES = ['勇者', '星辰', '月影', '小红', '小明', '风云', '天命', '破晓', '烈焰', '寒霜', '紫电', '青锋', '银翼', '金鳞', '碧落', '苍穹', '玄冰', '赤焰', '白虹', '墨渊']

/** Mock 职业池 */
const PROFESSIONS = ['Warrior', 'Mage', 'Hunter']

/** 生成 Mock 排行数据 */
function generateMockEntries(category: LeaderboardCategory, count: number): LeaderboardResponse {
  const entries = MOCK_NAMES.slice(0, count).map((name, i) => {
    const level = Math.max(1, 30 - i + Math.floor(Math.random() * 3))
    let value: number
    switch (category) {
      case 'level':
        value = level
        break
      case 'power':
        value = Math.floor((500 + level * 150) * (1 - i * 0.04) + Math.random() * 200)
        break
      case 'arena':
        value = Math.floor((2000 - i * 60) + Math.random() * 100)
        break
    }
    return {
      rank: i + 1,
      characterId: `char-mock-${i + 1}`,
      characterName: name,
      profession: PROFESSIONS[i % 3],
      level,
      value,
      isOnline: Math.random() > 0.4
    }
  })

  return {
    entries,
    myRank: Math.floor(Math.random() * 10) + 11,
    myValue: category === 'level' ? 18 : category === 'power' ? 2800 : 1200
  }
}

/**
 * 获取排行榜数据
 * @param category - 排行分类
 * @param scope - 排行范围
 */
export async function getLeaderboardApi(
  category: LeaderboardCategory,
  scope: LeaderboardScope
): Promise<ApiResponse<LeaderboardResponse>> {
  if (isMockEnabled()) {
    await delay(400)
    const count = scope === 'friends' ? 6 : 20
    const data = generateMockEntries(category, count)
    return { code: 200, message: '操作成功', data }
  }
  return request.get(`/leaderboard/${category}`, { params: { scope } })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/leaderboard.ts
git commit -m "feat: add leaderboard API with mock data"
```

---

### Task 3: 创建排行榜 Pinia Store

**Files:**
- Create: `src/stores/leaderboard.ts`

- [ ] **Step 1: 创建 Store 文件**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLeaderboardApi } from '../api/leaderboard'
import type { LeaderboardCategory, LeaderboardScope, LeaderboardEntry, LeaderboardResponse } from '../types/leaderboard'

/**
 * 排行榜状态管理
 * 管理排行榜分类切换、范围切换、数据缓存
 */
export const useLeaderboardStore = defineStore('leaderboard', () => {
  // ── 状态 ──
  const category = ref<LeaderboardCategory>('level')
  const scope = ref<LeaderboardScope>('all')
  const entries = ref<LeaderboardEntry[]>([])
  const myRank = ref(0)
  const myValue = ref(0)
  const loading = ref(false)

  /** 缓存：key = "category:scope" */
  const cache = ref<Record<string, LeaderboardResponse>>({})

  // ── 计算属性 ──
  /** 前三名 */
  const topThree = computed(() => entries.value.slice(0, 3))

  /** 第 4 名及以后 */
  const restList = computed(() => entries.value.slice(3))

  /** 缓存 key */
  const cacheKey = computed(() => `${category.value}:${scope.value}`)

  /**
   * 获取排行榜数据
   * 优先从缓存读取，无缓存则请求 API
   */
  async function fetchLeaderboard(): Promise<void> {
    if (cache.value[cacheKey.value]) {
      const cached = cache.value[cacheKey.value]
      entries.value = cached.entries
      myRank.value = cached.myRank
      myValue.value = cached.myValue
      return
    }

    loading.value = true
    try {
      const res = await getLeaderboardApi(category.value, scope.value)
      if (res.code === 200) {
        entries.value = res.data.entries
        myRank.value = res.data.myRank
        myValue.value = res.data.myValue
        cache.value[cacheKey.value] = res.data
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换分类
   * @param newCategory - 新分类
   */
  async function setCategory(newCategory: LeaderboardCategory): Promise<void> {
    if (category.value === newCategory) return
    category.value = newCategory
    await fetchLeaderboard()
  }

  /**
   * 切换范围
   * @param newScope - 新范围
   */
  async function setScope(newScope: LeaderboardScope): Promise<void> {
    if (scope.value === newScope) return
    scope.value = newScope
    await fetchLeaderboard()
  }

  /** 清除缓存（用于强制刷新） */
  function clearCache(): void {
    cache.value = {}
  }

  return {
    category,
    scope,
    entries,
    myRank,
    myValue,
    loading,
    topThree,
    restList,
    fetchLeaderboard,
    setCategory,
    setScope,
    clearCache
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/leaderboard.ts
git commit -m "feat: add leaderboard Pinia store"
```

---

### Task 4: 创建排行榜面板组件

**Files:**
- Create: `src/components/leaderboard/LeaderboardPanel.vue`

- [ ] **Step 1: 创建组件文件**

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/leaderboard/LeaderboardPanel.vue
git commit -m "feat: add LeaderboardPanel component with podium layout"
```

---

### Task 5: 修改 HomeView 集成排行榜

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 添加 import**

在 HomeView.vue 的 `<script setup>` 中添加导入：

```typescript
import LeaderboardPanel from '../components/leaderboard/LeaderboardPanel.vue'
import { Trophy } from 'lucide-vue-next'
```

- [ ] **Step 2: 扩展 centerView 类型**

将 centerView ref 的类型从 `'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team'` 扩展为 `'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team' | 'leaderboard'`。

- [ ] **Step 3: 添加排行榜视图区域**

在模板中，在 team 视图之后添加：

```html
<div v-else-if="centerView === 'leaderboard'" class="game-panel game-main">
  <LeaderboardPanel />
</div>
```

- [ ] **Step 4: 添加底部导航 Tab**

在底部导航栏中，在"商店"Tab 之前添加"排行"Tab：

```html
<button class="nav-item" :class="{ active: centerView === 'leaderboard' }" @click="centerView = 'leaderboard'">
  <Trophy :size="20" />
  <span>排行</span>
</button>
```

- [ ] **Step 5: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: integrate leaderboard tab into HomeView navigation"
```

---

### Task 6: 创建后端对接文档

**Files:**
- Create: `排行榜-后端对接文档.md`

- [ ] **Step 1: 创建文档**

```markdown
# 排行榜 - 后端对接文档

## 概述

排行榜系统支持等级、战力、竞技积分三个分类，全服/好友两个范围。

---

## 1. API 接口

### 1.1 获取排行榜

```
GET /leaderboard/:category?scope=all|friends
```

**路径参数：**

| 参数 | 值 | 说明 |
|:---|:---|:---|
| category | level / power / arena | 排行分类 |

**查询参数：**

| 参数 | 值 | 说明 |
|:---|:---|:---|
| scope | all / friends | 排行范围 |

**响应：**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "entries": [
      {
        "rank": 1,
        "characterId": "char-001",
        "characterName": "勇者",
        "profession": "Warrior",
        "level": 30,
        "value": 30,
        "isOnline": true
      }
    ],
    "myRank": 12,
    "myValue": 18
  }
}
```

---

## 2. 数据说明

### 2.1 value 字段含义

| category | value 含义 | 示例 |
|:---|:---|:---|
| level | 角色等级 | 30 |
| power | 战力值（综合属性计算） | 4500 |
| arena | 竞技积分 | 1800 |

### 2.2 好友排行

scope=friends 时，仅返回当前角色好友列表中的排名数据。需要后端从好友关系表筛选。

---

## 3. 前端 Mock 行为

| 功能 | Mock 实现 |
|:---|:---|
| 数据生成 | 前端 generateMockEntries() 生成 20 条/6 条数据 |
| 缓存 | Pinia store 内存缓存，key=category:scope |
| 刷新 | 打开面板时自动 fetchLeaderboard() |

后端对接后，前端仅保留 API 调用层，Mock 数据移除。
```

- [ ] **Step 2: Commit**

```bash
git add 排行榜-后端对接文档.md
git commit -m "docs: add leaderboard backend integration doc"
```

---

### Task 7: 更新开发方案 + 构建验证

**Files:**
- Modify: `开发方案.md`

- [ ] **Step 1: 更新开发方案第 520 行**

将 `| 排行榜（等级、战力、竞技积分） | P1 | 竞争激励 |` 改为 `| 排行榜（等级、战力、竞技积分） | P1 | ✅ 已完成 | 底部导航排行Tab、等级/战力/竞技三分类、全服/好友切换、领奖台+列表布局、后端对接文档 |`

- [ ] **Step 2: 运行构建验证**

```bash
cd "/Users/hyacinth/Desktop/project sword" && npm run build
```

Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 3: Commit**

```bash
git add 开发方案.md
git commit -m "docs: mark leaderboard feature as completed"
```
