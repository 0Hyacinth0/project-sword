# 竞技场入口与赛季展示设计

## 概述

实现竞技场入口面板，包含赛季信息展示、6级段位系统、战绩统计。作为底部导航新 Tab 嵌入 HomeView。

---

## 入口与布局

- **入口**：底部导航栏新增"竞技"Tab（Swords 图标）
- **centerView 值**：`arena`
- **布局**：赛季标题 + 段位卡片 + 战绩统计 + 段位列表

### 面板结构

```
┌─────────────────────────────┐
│  当前赛季                    │
│  S3 · 龙焰纪元               │
│  剩余 23 天 14 小时           │
├─────────────────────────────┤
│     ◆ 铂金 II                │  ← 段位卡片（渐变背景）
│     积分: 1850               │
│     ████████░░ 75%           │  ← 进度条（距下一段位）
│     距铂金 I 还需 150 积分    │
├─────────────────────────────┤
│  42胜  │  28败  │  60%胜率   │  ← 战绩统计
├─────────────────────────────┤
│  👑 王者     2800+           │  ← 段位列表
│  ◆ 钻石     2400-2799       │
│  ◆ 铂金     1800-2399  [当前]│
│  ◆ 黄金     1200-1799       │
│  ◆ 白银     600-1199        │
│  ◆ 青铜     0-599           │
└─────────────────────────────┘
```

---

## 段位系统

### 6 级段位

| 段位 | 积分范围 | 颜色 | 小级 |
|:---|:---|:---|:---|
| 青铜 | 0-599 | #8b8b8b | I/II/III |
| 白银 | 600-1199 | #c0c0c0 | I/II/III |
| 黄金 | 1200-1799 | #ffd700 | I/II/III |
| 铂金 | 1800-2399 | #00b894 | I/II/III |
| 钻石 | 2400-2799 | #7c5cfc | I/II/III |
| 王者 | 2800+ | 渐变红金 | 无小级 |

### 小级划分

每个段位（除王者）分 III → II → I 三个小级，积分区间均分三段。例如铂金：
- 铂金 III: 1800-1999
- 铂金 II: 2000-2199
- 铂金 I: 2200-2399

---

## 数据模型

```typescript
/** 段位等级 */
type ArenaTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'king'

/** 段位小级 */
type ArenaSubTier = 'I' | 'II' | 'III'

/** 赛季信息 */
interface ArenaSeason {
  seasonId: string
  seasonName: string
  seasonNumber: number
  startDate: string
  endDate: string
  isActive: boolean
}

/** 竞技场玩家数据 */
interface ArenaPlayerData {
  tier: ArenaTier
  subTier: ArenaSubTier
  score: number
  wins: number
  losses: number
  winRate: number
  seasonId: string
}

/** 段位配置 */
interface ArenaTierConfig {
  tier: ArenaTier
  name: string
  minScore: number
  maxScore: number
  color: string
  icon: string
}
```

---

## 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/types/arena.ts` | 新建 | 竞技场类型定义 |
| `src/api/arena.ts` | 新建 | API + Mock 数据 |
| `src/stores/arena.ts` | 新建 | 状态管理 |
| `src/config/arena_config.ts` | 新建 | 段位配置 |
| `src/components/arena/ArenaPanel.vue` | 新建 | 竞技场面板组件 |
| `src/views/HomeView.vue` | 修改 | 底部导航 + centerView |

---

## Mock 数据

- 当前赛季：S3 · 龙焰纪元，剩余 23 天
- 玩家段位：铂金 II，积分 1850
- 战绩：42胜 28败 60%胜率

---

## 不做的功能

- 实时 PVP 匹配（第 534 行，独立功能）
- 战斗流程
- 段位奖励领取
- 赛季历史回顾

---

## 后端对接

需提供 API：
- `GET /arena/season` — 返回当前赛季信息
- `GET /arena/me` — 返回当前角色竞技数据（段位/积分/战绩）