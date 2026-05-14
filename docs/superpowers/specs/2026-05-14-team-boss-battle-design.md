# 团队副本 Boss 战设计

## 概述

在现有多人副本基础上，为 Boss 层增加专属机制：狂暴计时、阶段切换、全屏 AOE、队友复活。复用现有房间和战斗流程，通过 Boss 配置和战斗引擎扩展实现。

---

## 入口方式

扩展现有副本配置，新增团队难度 Boss 本。DungeonRoomPanel 选择团队本后，走现有 startChallenge → enterDungeon → startMultiPlayerFloorBattle 流程。

---

## 数据模型

```typescript
/** Boss 阶段 */
interface BossPhase {
  phase: number
  hpThreshold: number      // 触发血量百分比（如 0.7 = 70%以下进入）
  attackMultiplier: number // 该阶段攻击力倍率
  skillIds: number[]       // 该阶段可用技能 ID
}

/** Boss 狂暴配置 */
interface BossEnrage {
  enrageRound: number       // 触发回合数
  attackMultiplier: number  // 狂暴后攻击力倍率
  speedMultiplier: number   // 狂暴后速度倍率
}

/** 复活配置 */
interface ReviveConfig {
  reviveHpPercent: number  // 复活后恢复 HP 百分比
  mpCost: number           // 复活消耗 MP
  maxRevives: number       // 每场最大复活次数
}

/** Boss 战配置 */
interface BossBattleConfig {
  bossId: string
  phases: BossPhase[]
  enrage: BossEnrage
  revive: ReviveConfig
  aoeSkillIds: number[]
}
```

---

## 四大机制

| 机制 | 行为 |
|:---|:---|
| 狂暴计时 | 达到 enrageRound 后 Boss 获得攻击/速度倍率，UI 红色倒计时 |
| 阶段切换 | Boss HP 跨过 hpThreshold 时替换技能列表+调整攻击倍率，UI 闪烁 |
| 全屏 AOE | Boss 技能 targetType='all_enemies'，命中所有我方单位 |
| 队友复活 | 玩家回合额外显示复活按钮，消耗 MP 复活死亡队友，每场上限 maxRevives 次 |

---

## 文件清单

### 新增

| 文件 | 职责 |
|:---|:---|
| `src/types/boss.ts` | Boss 机制类型定义 |
| `src/config/boss_config.ts` | Boss 阶段/狂暴/技能配置 |
| `src/utils/bossMechanics.ts` | Boss 机制引擎（狂暴检测、阶段切换、复活处理） |
| `src/components/battle/BossPhaseIndicator.vue` | Boss 多段血条 + 阶段标签 |
| `src/components/battle/BossEnrageTimer.vue` | 狂暴倒计时 UI |
| `src/components/battle/ReviveButton.vue` | 复活按钮组件 |

### 修改

| 文件 | 改动 |
|:---|:---|
| `src/config/dungeon_config.ts` | 新增团队 Boss 本配置 |
| `src/stores/dungeon.ts` | Boss 战入口连接 |
| `src/stores/battle.ts` | Boss 机制注入战斗循环 |
| `src/utils/battleEngine.ts` | 阶段切换/狂暴/复活逻辑 |
| `src/views/BattleView.vue` | Boss 专用 UI 组件 |

---

## UI 组件

### BossPhaseIndicator
- 替代普通血条，显示在战场顶部
- 多段血条：每个阶段一段颜色（绿→黄→红）
- 阶段切换时闪烁动画

### BossEnrageTimer
- 正常：白色 "剩余 N 回合"
- 警告（≤3）：橙色闪烁
- 已狂暴：红色 "已狂暴！" + 倍率

### ReviveButton
- 行动面板中额外显示（仅当有死亡队友）
- 点击选择死亡队友目标
- 显示 "复活 1/3" 次数

---

## 不做的功能

- Boss 专属掉落表（复用现有）
- 团队 Buff 共享
- 复活动画
- 阶段切换过场动画

---

## 后端对接

需提供 API：
- `GET /dungeon/boss/:bossId/config` — 返回 BossBattleConfig
- `POST /dungeon/boss/revive` — 复活请求（含 battleId, targetUid）
