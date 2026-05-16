# 30 秒出招倒计时设计

## 概述

在战斗行动选择阶段添加 30 秒倒计时，超时后自动执行普攻（随机选择存活敌人）。

---

## 机制

- 当 `waitingForPlayer` 变为 true 时启动 30 秒倒计时
- 每秒递减，UI 显示剩余时间和进度条
- 最后 5 秒进度条变红并闪烁警告
- 倒计时到 0 时，自动从 `availableTargets` 中随机选取一个存活敌人，执行普攻
- 玩家主动提交行动或战斗状态变化时，停止并重置计时器

---

## 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/components/battle/BattleConsole.vue` | 修改 | 计时器逻辑 + 进度条 UI |

---

## UI 设计

进度条位于 BattleActionPanel 上方：
- 宽度从 100% 线性递减到 0%
- 颜色渐变：绿色（>10s）→ 黄色（5-10s）→ 红色（<5s，闪烁）
- 显示剩余秒数文本

---

## 自动普攻逻辑

```typescript
function handleAutoAction() {
  const targets = store.availableTargets.filter(t => t.isAlive)
  if (targets.length === 0) return
  const target = targets[Math.floor(Math.random() * targets.length)]
  handleAction({ type: 'attack', actorUid: store.currentActor!.uid, targetUid: target.uid })
}
```

---

## 不做的功能

- 可配置超时时间
- PVP/PvE 不同超时策略
- 服务器端超时校验
- 倒计时音效
