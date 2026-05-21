# 游戏首页内容展示区重设计

## 背景

当前首页（`centerView === 'home'`）仅显示"欢迎"文字和"开始探索/进入副本"两个按钮，缺乏游戏主页面应有的内容丰富度。需要改造为包含更新公告、活动公告、玩家数据统计、推荐副本等内容展示区。

## 方案

将首页内容抽离为独立 `HomePanel.vue` 组件（与 `ShopPanel`、`ArenaPanel` 同级），HomeView.vue 作为壳只负责调度。

## 布局

采用混合网格布局：

- **上半区**：左右两栏等宽（玩家数据统计 | 推荐副本/地图）
- **下半区**：公告纵向堆叠（活动公告 + 更新公告），各自可折叠展开

响应式适配：
- 桌面端（> 768px）：上半区左右两栏，公告全宽
- 移动端（≤ 768px）：四个模块全部纵向堆叠

## 模块设计

### 1. 玩家数据统计（左栏）

展示玩家今日游戏数据，增强归属感和成就感。

数据项（Mock）：

| 指标 | 示例值 | 图标 |
|------|--------|------|
| 今日在线时长 | 2小时15分 | Clock |
| 今日战斗次数 | 12场 | Swords |
| 今日胜率 | 75% | Trophy |
| 累计获得金币 | 1,280 | Coins |

视觉：4 个数据卡片 2×2 网格排列，每个卡片包含图标 + 数值 + 标签，使用 Liquid Glass 卡片样式。

### 2. 推荐副本/地图（右栏）

根据角色等级智能推荐适合的探索区域。

推荐逻辑（Mock）：返回 2 个推荐项（一个野外区域 + 一个副本），每项包含名称、等级范围、推荐理由、快捷入口按钮。点击按钮跳转 `centerView = 'map'` 或打开对应副本面板。

### 3. 活动公告

展示限时活动、节日活动等，标题栏带展开/折叠箭头。

数据结构：

```typescript
interface ActivityAnnouncement {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'ongoing' | 'upcoming' | 'ended'
}
```

视觉：展开后显示最多 3 条活动，每条包含标题 + 状态徽章（进行中绿色/即将开始蓝色/已结束灰色）+ 剩余时间。

### 4. 更新公告

展示版本更新记录，标题栏带展开/折叠箭头。

数据结构：

```typescript
interface UpdateAnnouncement {
  id: string
  version: string
  title: string
  date: string
  changes: string[]
}
```

视觉：展开后显示最新一条更新详情，版本号蓝色胶囊标签 + 发布日期 + 更新内容列表。

## API 预留

当前用 Mock 数据，组件预留 API 结构便于后续对接。

| 接口 | 路径 | 返回数据 |
|------|------|----------|
| 获取今日统计 | `/api/home/stats` | 玩家数据统计 |
| 获取推荐副本 | `/api/home/recommendations` | 推荐副本列表 |
| 获取活动公告 | `/api/home/activities` | 活动公告列表 |
| 获取更新公告 | `/api/home/updates` | 更新公告列表 |

API 文件：`src/api/home.ts`

## 涉及文件

- **新增**：`src/components/home/HomePanel.vue` — 首页内容展示组件
- **新增**：`src/api/home.ts` — 首页 API + Mock 数据
- **修改**：`src/views/HomeView.vue` — 替换 `centerView === 'home'` 区块为 HomePanel 组件
