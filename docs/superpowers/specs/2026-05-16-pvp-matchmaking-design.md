# 实时 PVP 匹配设计

## 概述

在竞技场面板（ArenaPanel）内实现 PVP 匹配流程：匹配按钮 → 搜索动画 → 对手确认 VS 卡 → 跳转 BattleView 战斗 → 结算覆盖层展示积分变化。对手由 AI 控制，复用现有战斗引擎。

---

## 入口与流程

- **入口**：ArenaPanel 底部"开始匹配"按钮
- **匹配动画**：覆盖层形式，搜索中显示旋转动画 + 自己的段位卡
- **对手确认**：VS 对战卡，展示双方角色/段位/积分 + 预计积分变化
- **战斗**：跳转 BattleView，复用现有 battleEngine，对手为 AI 控制
- **结算**：返回 ArenaPanel 后显示结算覆盖层，展示积分变化动画

### 流程图

```
ArenaPanel          PvpMatchOverlay         BattleView         PvpSettlementOverlay
    │                     │                     │                     │
    ├─ 点击"开始匹配" ──→ ├─ 搜索动画(3-8s)     │                     │
    │                     ├─ 找到对手            │                     │
    │                     ├─ VS 对战卡           │                     │
    │                     ├─ "开始战斗" ────────→ ├─ PVP战斗           │
    │                     │                     ├─ 战斗结束 ──────────→ ├─ 积分变化动画
    │  ←─ 关闭结算 ──────┤                     │                     ├─ 战绩更新
    ├─ 刷新数据           │                     │                     ├─ "返回竞技场"
```

---

## 数据模型

```typescript
/** 匹配状态 */
type PvpMatchState = 'idle' | 'searching' | 'found' | 'ready' | 'in_battle' | 'settling'

/** 匹配到的对手信息 */
interface PvpOpponent {
  characterId: string
  characterName: string
  profession: string
  level: number
  tier: ArenaTier
  subTier: ArenaSubTier
  score: number
}

/** 积分结算结果 */
interface PvpScoreResult {
  scoreChange: number
  oldScore: number
  newScore: number
  tierChanged: boolean
  oldTier: TierInfo
  newTier: TierInfo
}
```

---

## Elo 积分算法（简化版）

- 基础变化：±25 分
- 积分差距调整：`(opponentScore - myScore) / 100`，上限 ±10
- 最终变化：基础 ± 调整，范围 ±15 ~ ±35
- 胜利为正，失败为负

```
scoreChange = 25 + (opponentScore - myScore) / 100
胜利: +scoreChange（击败高分对手获得更多积分）
失败: -scoreChange（输给低分对手扣除更多积分）
```

---

## 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/types/pvp.ts` | 新建 | PVP 类型定义 |
| `src/config/pvp_config.ts` | 新建 | Elo 计算、Mock 对手生成配置 |
| `src/api/pvp.ts` | 新建 | API + Mock（匹配、结算） |
| `src/stores/pvp.ts` | 新建 | Pinia 匹配状态管理 |
| `src/components/arena/PvpMatchOverlay.vue` | 新建 | 匹配搜索 + 对手确认覆盖层 |
| `src/components/arena/PvpSettlementOverlay.vue` | 新建 | 战斗结算覆盖层 |
| `src/components/arena/ArenaPanel.vue` | 修改 | 添加"开始匹配"按钮 + 集成覆盖层 |
| `src/views/BattleView.vue` | 修改 | PVP 战斗结束回调 |

---

## 组件设计

### PvpMatchOverlay

匹配搜索 + 对手确认的覆盖层组件。

**Props**：
- `visible: boolean` — 是否显示
- `state: PvpMatchState` — 当前匹配状态
- `opponent: PvpOpponent | null` — 匹配到的对手
- `estimatedScore: { win: number; lose: number }` — 预计积分变化

**Events**：
- `cancel` — 取消匹配
- `start-battle` — 开始战斗

**UI 结构**：
1. 搜索中：旋转动画 + 自己的段位卡 + "取消匹配"按钮
2. 找到对手：VS 对战卡（双方角色/段位/积分）+ 预计积分变化 + "开始战斗"/"放弃匹配"

### PvpSettlementOverlay

战斗结算覆盖层。

**Props**：
- `visible: boolean`
- `result: PvpScoreResult | null`
- `isVictory: boolean`
- `wins: number` / `losses: number` / `winRate: number`

**Events**：
- `close` — 关闭结算

**UI 结构**：
1. 胜负结果大字 + 段位变化提示
2. 积分变化：原积分 → 变化值 → 新积分，带进度条
3. 战绩更新：胜场/败场/胜率变化高亮
4. "返回竞技场"按钮

---

## Store 设计 (stores/pvp.ts)

```typescript
usePvpStore('pvp', () => {
  // 状态
  matchState: Ref<PvpMatchState>
  opponent: Ref<PvpOpponent | null>
  scoreResult: Ref<PvpScoreResult | null>

  // 方法
  startMatchmaking()     // 开始匹配，Mock 延迟后生成对手
  cancelMatchmaking()    // 取消匹配
  confirmBattle()        // 确认战斗，创建对手 Combatant，跳转 BattleView
  settleBattle(won)      // 结算战斗，计算 Elo 积分变化
  resetMatch()           // 重置匹配状态

  // 计算属性
  estimatedScore         // 预计积分变化（基于对手积分差）
})
```

---

## Mock 数据

### 对手池（6 个 Mock 对手）

| 角色 | 职业 | 等级 | 段位 | 积分 |
|:---|:---|:---|:---|:---|
| 火焰法师 | Mage | 33 | 钻石 III | 2450 |
| 暗夜刺客 | Hunter | 28 | 铂金 I | 2300 |
| 圣光骑士 | Warrior | 25 | 铂金 III | 1900 |
| 冰霜女巫 | Mage | 22 | 黄金 I | 1700 |
| 狂暴战士 | Warrior | 20 | 白银 II | 900 |
| 影舞者 | Hunter | 15 | 青铜 I | 200 |

匹配时随机选取一个对手（模拟 Elo 匹配：优先选择积分接近的）。

---

## 不做的功能

- WebSocket 双端实时同步（独立功能）
- PVP 战斗中的特殊机制（嘲讽、表情等）
- 段位奖励领取
- 匹配历史记录
- 观战功能

---

## 后端对接

需提供 API：
- `POST /arena/match` — 发起匹配，返回对手信息
- `POST /arena/settle` — 提交战斗结果，返回积分变化
