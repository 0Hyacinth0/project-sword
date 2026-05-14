# 排行榜功能设计

## 概述

实现全服/好友排行榜系统，支持等级、战力、竞技积分三个分类排名。作为底部导航新 Tab 嵌入 HomeView。

---

## 入口与布局

- **入口**：底部导航栏新增"排行"Tab（Trophy 图标）
- **centerView 值**：`leaderboard`
- **布局**：方案 A — 顶部分类 Tab + 前三名领奖台 + 全服/好友切换 Toggle

### 面板结构

```
┌─────────────────────────────┐
│  [等级] [战力] [竞技]        │  ← 分类 Tab
│                    [全服|好友] │  ← 范围 Toggle
├─────────────────────────────┤
│     🥈      🥇      🥉      │  ← 领奖台（前三名）
│    小明     勇者     小红      │
│   Lv.28    Lv.30   Lv.25     │
├─────────────────────────────┤
│  4  法  星辰          Lv.23  │  ← 列表区（第 4-20 名）
│  5  猎  月影          Lv.22  │
│  ...                        │
├─────────────────────────────┤
│  我的排名: #12  Lv.18       │  ← 自己排名（固定底部）
└─────────────────────────────┘
```

---

## 数据模型

```typescript
/** 排行榜分类 */
type LeaderboardCategory = 'level' | 'power' | 'arena'

/** 排行榜范围 */
type LeaderboardScope = 'all' | 'friends'

/** 排行条目 */
interface LeaderboardEntry {
  rank: number              // 排名
  characterId: string       // 角色 ID
  characterName: string     // 角色名
  profession: string        // 职业（Warrior/Mage/Hunter）
  level: number             // 等级
  value: number             // 排序值（等级=等级，战力=战力，竞技=积分）
  isOnline: boolean         // 是否在线
}
```

---

## 交互细节

| 交互 | 行为 |
|:---|:---|
| 分类 Tab 切换 | 从 store 缓存读取，无 loading；首次打开时 loading |
| 全服 ↔ 好友切换 | 重新请求数据（好友榜从好友列表筛选） |
| 打开时刷新 | centerView 切换到 leaderboard 时自动 fetchLeaderboard() |
| 领奖台 | 前三名按 银(2)-金(1)-铜(3) 排列，第一名略大居中 |
| 列表区 | 第 4-20 名，排名序号 + 职业头像 + 名称 + 数值 |
| 自己排名 | 固定底部，金蓝渐变背景高亮 |
| 在线状态 | 头像右上角小绿点 |

### 不做的功能

- 分页/加载更多（20 条足够）
- 点击查看角色详情
- 排名变化动画（↑↓箭头）

---

## 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/types/leaderboard.ts` | 新建 | 类型定义 |
| `src/api/leaderboard.ts` | 新建 | API 层 + Mock 数据 |
| `src/stores/leaderboard.ts` | 新建 | 状态管理 |
| `src/components/leaderboard/LeaderboardPanel.vue` | 新建 | 排行榜面板组件 |
| `src/views/HomeView.vue` | 修改 | 底部导航 + centerView |

---

## Mock 数据策略

- **等级榜**：20 条，等级 30~10 随机分布
- **战力榜**：复用同一批角色，战力 500~5000
- **竞技榜**：积分 2000~800
- **好友榜**：从好友列表筛选，5-8 条

---

## 后端对接

需提供 API：
- `GET /leaderboard/:category?scope=all|friends` — 返回 `LeaderboardEntry[]`
- `GET /leaderboard/me?category=:category&scope=all|friends` — 返回当前角色排名
