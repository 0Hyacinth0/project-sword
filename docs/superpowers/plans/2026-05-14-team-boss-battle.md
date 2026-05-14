# 团队副本 Boss 战 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为多人副本 Boss 层添加四大专属机制：狂暴计时、阶段切换、全屏 AOE、队友复活。

**Architecture:** 新增 Boss 类型、配置、机制引擎，扩展战斗引擎处理阶段/狂暴/复活，新增三个专用 UI 组件，修改 BattleView 显示 Boss 专用界面。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Liquid Glass CSS

---

## File Structure

| File | Action | Responsibility |
|:---|:---|:---|
| `src/types/boss.ts` | Create | Boss 机制类型定义 |
| `src/config/boss_config.ts` | Create | Boss 阶段/狂暴/技能配置 |
| `src/utils/bossMechanics.ts` | Create | Boss 机制引擎（狂暴检测、阶段切换、复活处理） |
| `src/components/battle/BossPhaseIndicator.vue` | Create | Boss 多段血条 + 阶段标签 |
| `src/components/battle/BossEnrageTimer.vue` | Create | 狂暴倒计时 UI |
| `src/components/battle/ReviveButton.vue` | Create | 复活按钮组件 |
| `src/config/dungeon_config.ts` | Modify | 新增团队 Boss 本配置 |
| `src/utils/battleEngine.ts` | Modify | 阶段切换/狂暴/复活逻辑集成 |
| `src/stores/battle.ts` | Modify | 复活 action 处理 |
| `src/views/BattleView.vue` | Modify | Boss 专用 UI 组件显示 |

---

### Task 1: 定义 Boss 类型

**Files:**
- Create: `src/types/boss.ts`

- [ ] **Step 1: 创建 Boss 类型文件**

```typescript
/**
 * Boss 战机制类型定义
 * 包含阶段、狂暴、复活等 Boss 专属机制
 */

/** Boss 阶段配置 */
export interface BossPhase {
  /** 阶段编号（1-indexed） */
  phase: number
  /** 触发血量阈值（百分比，如 0.7 表示 HP≤70% 时进入） */
  hpThreshold: number
  /** 该阶段攻击力倍率 */
  attackMultiplier: number
  /** 该阶段可用技能 ID 列表 */
  skillIds: number[]
}

/** Boss 狂暴配置 */
export interface BossEnrage {
  /** 狂暴触发回合数（从战斗开始计） */
  enrageRound: number
  /** 狂暴后攻击力倍率 */
  attackMultiplier: number
  /** 狂暴后速度倍率 */
  speedMultiplier: number
}

/** 复活机制配置 */
export interface ReviveConfig {
  /** 复活后恢复 HP 百分比（如 30 表示恢复 30% maxHp） */
  reviveHpPercent: number
  /** 复活消耗 MP */
  mpCost: number
  /** 每场战斗最大复活次数 */
  maxRevives: number
}

/** Boss 战完整配置 */
export interface BossBattleConfig {
  /** Boss ID（对应 dungeon_config 中 Boss enemy 的 id） */
  bossId: string
  /** Boss 名称 */
  bossName: string
  /** 阶段列表（按 hpThreshold 降序排列） */
  phases: BossPhase[]
  /** 狂暴配置 */
  enrage: BossEnrage
  /** 复活配置 */
  revive: ReviveConfig
  /** 全屏 AOE 技能 ID 列例 */
  aoeSkillIds: number[]
}

/** Boss 战运行状态 */
export interface BossBattleState {
  /** 当前阶段（初始为 1） */
  currentPhase: number
  /** 是否已狂暴 */
  isEnraged: boolean
  /** 当前回合数（用于狂暴计时） */
  currentRound: number
  /** 已使用复活次数 */
  reviveCount: number
  /** 阶段切换标记（用于 UI 动画触发） */
  phaseChanged: boolean
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/boss.ts
git commit -m "feat: add boss battle type definitions"
```

---

### Task 2: 创建 Boss 配置

**Files:**
- Create: `src/config/boss_config.ts`

- [ ] **Step 1: 创建 Boss 配置文件**

```typescript
/**
 * Boss 战配置
 * 定义各区域 Boss 的阶段、狂暴、复活、AOE 配置
 */
import type { BossBattleConfig } from '../types/boss'

/**
 * Boss 配置表
 * Key 为 Boss enemy 的 sourceId（如 'boss-shadow-dragon'）
 */
export const BOSS_CONFIGS: Record<string, BossBattleConfig> = {
  // ── 暗影森林 ──
  'boss-shadow-wolf': {
    bossId: 'boss-shadow-wolf',
    bossName: '暗影狼王',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9001, 9002] },
      { phase: 2, hpThreshold: 0.5, attackMultiplier: 1.3, skillIds: [9001, 9002, 9010] }
    ],
    enrage: { enrageRound: 15, attackMultiplier: 2.0, speedMultiplier: 1.5 },
    revive: { reviveHpPercent: 30, mpCost: 20, maxRevives: 2 },
    aoeSkillIds: [9010]
  },
  'boss-shadow-dragon': {
    bossId: 'boss-shadow-dragon',
    bossName: '暗影龙',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9001, 9003] },
      { phase: 2, hpThreshold: 0.7, attackMultiplier: 1.2, skillIds: [9001, 9003, 9011] },
      { phase: 3, hpThreshold: 0.3, attackMultiplier: 1.5, skillIds: [9011, 9012] }
    ],
    enrage: { enrageRound: 20, attackMultiplier: 2.5, speedMultiplier: 2.0 },
    revive: { reviveHpPercent: 30, mpCost: 25, maxRevives: 3 },
    aoeSkillIds: [9011]
  },

  // ── 火焰山脉 ──
  'boss-flame-lord': {
    bossId: 'boss-flame-lord',
    bossName: '炎魔领主',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9004, 9005] },
      { phase: 2, hpThreshold: 0.6, attackMultiplier: 1.4, skillIds: [9004, 9005, 9013] },
      { phase: 3, hpThreshold: 0.25, attackMultiplier: 1.8, skillIds: [9013, 9014] }
    ],
    enrage: { enrageRound: 18, attackMultiplier: 3.0, speedMultiplier: 1.8 },
    revive: { reviveHpPercent: 25, mpCost: 30, maxRevives: 2 },
    aoeSkillIds: [9013]
  },

  // ── 冰霜峡谷 ──
  'boss-ice-giant': {
    bossId: 'boss-ice-giant',
    bossName: '冰霜巨人',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9006, 9007] },
      { phase: 2, hpThreshold: 0.4, attackMultiplier: 1.6, skillIds: [9006, 9007, 9015] }
    ],
    enrage: { enrageRound: 12, attackMultiplier: 2.2, speedMultiplier: 1.3 },
    revive: { reviveHpPercent: 35, mpCost: 15, maxRevives: 4 },
    aoeSkillIds: [9015]
  },

  // ── 神秘遗迹 ──
  'boss-ancient-guardian': {
    bossId: 'boss-ancient-guardian',
    bossName: '远古守护者',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9008, 9009] },
      { phase: 2, hpThreshold: 0.75, attackMultiplier: 1.15, skillIds: [9008, 9009, 9016] },
      { phase: 3, hpThreshold: 0.45, attackMultiplier: 1.35, skillIds: [9016, 9017] },
      { phase: 4, hpThreshold: 0.15, attackMultiplier: 2.0, skillIds: [9017, 9018] }
    ],
    enrage: { enrageRound: 25, attackMultiplier: 3.5, speedMultiplier: 2.5 },
    revive: { reviveHpPercent: 20, mpCost: 35, maxRevives: 3 },
    aoeSkillIds: [9016, 9018]
  }
}

/** Boss 专用技能池 */
export const BOSS_SKILLS = {
  // 通用 Boss 技能
  9001: { id: 9001, name: '撕裂', type: 'active_attack', power: 140, cooldown: 0, mpCost: 0, targetType: 'single_enemy', description: '撕裂目标' },
  9002: { id: 9002, name: '蓄力重击', type: 'active_attack', power: 200, cooldown: 3, mpCost: 15, targetType: 'single_enemy', description: '蓄力后重击' },
  9003: { id: 9003, name: '暗影吐息', type: 'active_attack', power: 180, cooldown: 2, mpCost: 20, targetType: 'all_enemies', description: '喷吐暗影能量' },
  9004: { id: 9004, name: '火焰斩', type: 'active_attack', power: 160, cooldown: 1, mpCost: 10, targetType: 'single_enemy', description: '燃烧斩击' },
  9005: { id: 9005, name: '熔岩护甲', type: 'active_buff', power: 0, cooldown: 4, mpCost: 15, targetType: 'self', description: '提升防御', attachedBuff: { name: '熔岩护甲', isDebuff: false, stat: 'defense', value: 20, duration: 3 } },
  9006: { id: 9006, name: '冰锥', type: 'active_attack', power: 150, cooldown: 0, mpCost: 5, targetType: 'single_enemy', description: '发射冰锥' },
  9007: { id: 9007, name: '寒冰屏障', type: 'active_buff', power: 0, cooldown: 3, mpCost: 10, targetType: 'self', description: '提升防御', attachedBuff: { name: '寒冰屏障', isDebuff: false, stat: 'defense', value: 25, duration: 2 } },
  9008: { id: 9008, name: '古老打击', type: 'active_attack', power: 170, cooldown: 0, mpCost: 8, targetType: 'single_enemy', description: '古老力量打击' },
  9009: { id: 9009, name: '能量吸收', type: 'active_buff', power: 0, cooldown: 5, mpCost: 20, targetType: 'self', description: '提升攻击', attachedBuff: { name: '能量吸收', isDebuff: false, stat: 'physicalAttack', value: 30, duration: 4 } },
  // AOE 技能
  9010: { id: 9010, name: '狼群召唤', type: 'active_attack', power: 100, cooldown: 4, mpCost: 25, targetType: 'all_enemies', description: '召唤狼群攻击全体' },
  9011: { id: 9011, name: '暗影风暴', type: 'active_attack', power: 150, cooldown: 5, mpCost: 40, targetType: 'all_enemies', description: '暗影风暴席卷全场' },
  9012: { id: 9012, name: '龙息', type: 'active_attack', power: 250, cooldown: 6, mpCost: 50, targetType: 'all_enemies', description: '龙之吐息' },
  9013: { id: 9013, name: '烈焰风暴', type: 'active_attack', power: 180, cooldown: 5, mpCost: 35, targetType: 'all_enemies', description: '烈焰席卷全场' },
  9014: { id: 9014, name: '末日审判', type: 'active_attack', power: 300, cooldown: 8, mpCost: 60, targetType: 'all_enemies', description: '终极火焰审判' },
  9015: { id: 9015, name: '冰封大地', type: 'active_attack', power: 160, cooldown: 4, mpCost: 30, targetType: 'all_enemies', description: '冰封全场' },
  9016: { id: 9016, name: '能量爆发', type: 'active_attack', power: 200, cooldown: 6, mpCost: 45, targetType: 'all_enemies', description: '能量波爆发' },
  9017: { id: 9017, name: '时光扭曲', type: 'active_buff', power: 0, cooldown: 7, mpCost: 50, targetType: 'self', description: '大幅提升速度', attachedBuff: { name: '时光扭曲', isDebuff: false, stat: 'speed', value: 50, duration: 3 } },
  9018: { id: 9018, name: '毁灭射线', type: 'active_attack', power: 350, cooldown: 10, mpCost: 80, targetType: 'all_enemies', description: '终极毁灭射线' }
}

/**
 * 获取 Boss 配置
 * @param bossId - Boss ID
 */
export function getBossConfig(bossId: string): BossBattleConfig | undefined {
  return BOSS_CONFIGS[bossId]
}

/**
 * 获取 Boss 技能
 * @param skillId - 技能 ID
 */
export function getBossSkill(skillId: number): typeof BOSS_SKILLS[keyof typeof BOSS_SKILLS] | undefined {
  return BOSS_SKILLS[skillId]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/config/boss_config.ts
git commit -m "feat: add boss battle configuration"
```

---

### Task 3: 创建 Boss 机制引擎

**Files:**
- Create: `src/utils/bossMechanics.ts`

- [ ] **Step 1: 创建 Boss 机制引擎文件**

```typescript
/**
 * Boss 战机制引擎
 * 处理狂暴检测、阶段切换、复活逻辑
 */
import type { BattleState, Combatant, BattleSkill, BattleAction } from '../types/battle'
import { getBossConfig, getBossSkill, BOSS_SKILLS } from '../config/boss_config'
import type { BossBattleState, BossBattleConfig } from '../types/boss'

/** Boss 专用技能转换为 BattleSkill */
function convertBossSkill(skillId: number): BattleSkill {
  const raw = getBossSkill(skillId)
  if (!raw) {
    return { id: skillId, name: '未知', type: 'active_attack', power: 100, cooldown: 0, mpCost: 0, targetType: 'single_enemy', description: '' }
  }
  return { ...raw } as BattleSkill
}

/**
 * 初始化 Boss 战状态
 * @param bossCombatant - Boss 战斗单位
 */
export function initBossBattleState(bossCombatant: Combatant): BossBattleState | null {
  const bossId = bossCombatant.sourceId
  const config = getBossConfig(bossId)
  if (!config) return null

  // 替换 Boss 技能为第一阶段技能
  bossCombatant.skills = config.phases[0].skillIds.map(convertBossSkill)

  return {
    currentPhase: 1,
    isEnraged: false,
    currentRound: 0,
    reviveCount: 0,
    phaseChanged: false
  }
}

/**
 * 检查并处理阶段切换
 * @param state - 战斗状态
 * @param bossState - Boss 战状态
 * @param bossCombatant - Boss 战斗单位
 */
export function checkPhaseTransition(
  state: BattleState,
  bossState: BossBattleState,
  bossCombatant: Combatant
): boolean {
  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return false

  const hpPercent = bossCombatant.stats.hp / bossCombatant.stats.maxHp

  // 从高阈值往低阈值检查（配置已按 hpThreshold 降序）
  for (const phase of config.phases) {
    if (hpPercent <= phase.hpThreshold && bossState.currentPhase < phase.phase) {
      // 进入新阶段
      bossState.currentPhase = phase.phase
      bossState.phaseChanged = true

      // 替换技能列表
      bossCombatant.skills = phase.skillIds.map(convertBossSkill)

      // 应用攻击力倍率
      const baseAtk = bossCombatant.stats.physicalAttack / (config.phases[0].attackMultiplier || 1)
      bossCombatant.stats.physicalAttack = Math.floor(baseAtk * phase.attackMultiplier)
      bossCombatant.stats.magicAttack = Math.floor(bossCombatant.stats.magicAttack * phase.attackMultiplier)

      // 记录日志
      state.log.push({
        round: state.round,
        actor: bossCombatant.name,
        action: 'phase_transition',
        target: null,
        value: phase.phase,
        timestamp: Date.now()
      })

      return true
    }
  }
  return false
}

/**
 * 检查并处理狂暴
 * @param state - 战斗状态
 * @param bossState - Boss 战状态
 * @param bossCombatant - Boss 战斗单位
 */
export function checkEnrage(
  state: BattleState,
  bossState: BossBattleState,
  bossCombatant: Combatant
): boolean {
  if (bossState.isEnraged) return false

  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return false

  if (bossState.currentRound >= config.enrage.enrageRound) {
    bossState.isEnraged = true

    // 应用狂暴倍率
    bossCombatant.stats.physicalAttack = Math.floor(bossCombatant.stats.physicalAttack * config.enrage.attackMultiplier)
    bossCombatant.stats.magicAttack = Math.floor(bossCombatant.stats.magicAttack * config.enrage.attackMultiplier)
    bossCombatant.stats.speed = Math.floor(bossCombatant.stats.speed * config.enrage.speedMultiplier)

    // 记录日志
    state.log.push({
      round: state.round,
      actor: bossCombatant.name,
      action: 'enrage',
      target: null,
      value: config.enrage.attackMultiplier,
      timestamp: Date.now()
    })

    return true
  }
  return false
}

/**
 * 获取死亡的友方单位
 * @param state - 战斗状态
 */
export function getDeadAllies(state: BattleState): Combatant[] {
  return state.combatants.filter(c => c.side === 'ally' && !c.isAlive)
}

/**
 * 执行复活操作
 * @param state - 战斗状态
 * @param bossState - Boss 战状态
 * @param targetUid - 复活目标 UID
 * @param actorMp - 复活者的当前 MP
 */
export function executeRevive(
  state: BattleState,
  bossState: BossBattleState,
  targetUid: string,
  actorMp: number
): { success: boolean; message: string } {
  const config = getBossConfig(state.combatants.find(c => c.side === 'enemy' && c.type === 'enemy')?.sourceId ?? '')
  if (!config) return { success: false, message: '非 Boss 战斗' }

  if (bossState.reviveCount >= config.revive.maxRevives) {
    return { success: false, message: '已达到最大复活次数' }
  }

  if (actorMp < config.revive.mpCost) {
    return { success: false, message: `MP 不足，需要 ${config.revive.mpCost}` }
  }

  const target = state.combatants.find(c => c.uid === targetUid)
  if (!target || target.isAlive) {
    return { success: false, message: '目标不存在或已存活' }
  }

  // 复活目标
  target.isAlive = true
  target.stats.hp = Math.floor(target.stats.maxHp * config.revive.reviveHpPercent / 100)
  target.stats.mp = Math.floor(target.stats.maxMp * 0.5)
  target.buffs = []
  target.actionValue = 0

  bossState.reviveCount++

  // 记录日志
  state.log.push({
    round: state.round,
    actor: '玩家',
    action: 'revive',
    target: target.name,
    value: bossState.reviveCount,
    timestamp: Date.now()
  })

  return { success: true, message: `复活 ${target.name} 成功` }
}

/**
 * 构建 Boss AOE 技能
 * @param bossCombatant - Boss 战斗单位
 */
export function buildBossAoeSkills(bossCombatant: Combatant): BattleSkill[] {
  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return []

  return config.aoeSkillIds.map(convertBossSkill)
}

/**
 * 检查是否为 Boss 战斗
 * @param state - 战斗状态
 */
export function isBossBattle(state: BattleState): boolean {
  const enemy = state.combatants.find(c => c.side === 'enemy')
  if (!enemy) return false
  return getBossConfig(enemy.sourceId) !== undefined
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/bossMechanics.ts
git commit -m "feat: add boss mechanics engine"
```

---

### Task 4: 创建 BossPhaseIndicator 组件

**Files:**
- Create: `src/components/battle/BossPhaseIndicator.vue`

- [ ] **Step 1: 创建 Boss 阶段指示器组件**

```vue
<template>
  <div class="boss-phase-indicator" v-if="visible">
    <div class="boss-phase-indicator__header">
      <span class="boss-name">{{ bossName }}</span>
      <span class="phase-tag">阶段 {{ currentPhase }}/{{ totalPhases }}</span>
      <span v-if="phaseChanged" class="phase-flash">!</span>
    </div>
    <div class="boss-phase-indicator__hp-bar">
      <div
        v-for="(seg, i) in phaseSegments"
        :key="i"
        :class="['hp-segment', seg.class, { 'hp-segment--active': i === currentPhase - 1 }]"
        :style="{ width: `${seg.percent}%` }"
      >
        <div
          v-if="i === currentPhase - 1"
          class="hp-fill"
          :style="{ width: `${currentHpPercent}%` }"
        ></div>
      </div>
    </div>
    <div class="boss-phase-indicator__hp-text">
      {{ bossHp }} / {{ bossMaxHp }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** Boss 名称 */
  bossName: string
  /** 当前阶段 */
  currentPhase: number
  /** 总阶段数 */
  totalPhases: number
  /** Boss 当前 HP */
  bossHp: number
  /** Boss 最大 HP */
  bossMaxHp: number
  /** 是否刚切换阶段 */
  phaseChanged?: boolean
}>()

/** 阶段血条分段 */
const phaseSegments = computed(() => {
  const segs = []
  for (let i = 0; i < props.totalPhases; i++) {
    const threshold = i === 0 ? 100 : (i === props.totalPhases - 1 ? 0 : (100 - i * 25))
    segs.push({
      percent: i === props.totalPhases - 1 ? threshold : 25,
      class: i === 0 ? 'hp-segment--green' : i === 1 ? 'hp-segment--yellow' : 'hp-segment--red'
    })
  }
  return segs
})

/** 当前阶段内的 HP 百分比 */
const currentHpPercent = computed(() => {
  if (props.bossMaxHp === 0) return 0
  return Math.round((props.bossHp / props.bossMaxHp) * 100)
})
</script>

<style scoped>
.boss-phase-indicator {
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.boss-phase-indicator__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.boss-name {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
}

.phase-tag {
  font-size: var(--font-size-caption);
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(175, 82, 222, 0.15);
  color: #af52de;
  font-weight: 600;
}

.phase-flash {
  animation: flash 0.5s ease-in-out 3;
  color: #ffd700;
  font-size: 16px;
  font-weight: 700;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.boss-phase-indicator__hp-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(142, 142, 147, 0.2);
}

.hp-segment {
  position: relative;
  overflow: hidden;
}

.hp-segment--green { background: rgba(52, 199, 89, 0.2); }
.hp-segment--yellow { background: rgba(255, 149, 0, 0.2); }
.hp-segment--red { background: rgba(255, 59, 48, 0.2); }

.hp-segment--active {
  background: transparent;
}

.hp-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #ff3b30, #ff6b6b);
  transition: width 0.3s ease;
}

.boss-phase-indicator__hp-text {
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/battle/BossPhaseIndicator.vue
git commit -m "feat: add BossPhaseIndicator component"
```

---

### Task 5: 创建 BossEnrageTimer 组件

**Files:**
- Create: `src/components/battle/BossEnrageTimer.vue`

- [ ] **Step 1: 创建狂暴倒计时组件**

```vue
<template>
  <div class="boss-enrage-timer" v-if="visible">
    <div v-if="!isEnraged" :class="['timer-normal', { 'timer-warning': roundsLeft <= 3 }]">
      <span class="timer-icon">⏱</span>
      <span class="timer-text">狂暴倒计时 {{ roundsLeft }} 回合</span>
    </div>
    <div v-else class="timer-enraged">
      <span class="enraged-badge">已狂暴</span>
      <span class="enraged-mult">ATK ×{{ attackMult }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 是否已狂暴 */
  isEnraged: boolean
  /** 狂暴触发回合 */
  enrageRound: number
  /** 当前回合 */
  currentRound: number
  /** 狂暴攻击倍率 */
  attackMult: number
}>()

const roundsLeft = computed(() => {
  return Math.max(0, props.enrageRound - props.currentRound)
})
</script>

<style scoped>
.boss-enrage-timer {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.timer-normal {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
}

.timer-warning {
  background: rgba(255, 149, 0, 0.15);
  color: var(--accent-gold);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.timer-icon {
  margin-right: 4px;
}

.timer-text {
  font-weight: 500;
}

.timer-enraged {
  background: rgba(255, 59, 48, 0.15);
  color: var(--accent-red);
  gap: 8px;
}

.enraged-badge {
  font-weight: 700;
}

.enraged-mult {
  font-size: 11px;
  opacity: 0.8;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/battle/BossEnrageTimer.vue
git commit -m "feat: add BossEnrageTimer component"
```

---

### Task 6: 创建 ReviveButton 组件

**Files:**
- Create: `src/components/battle/ReviveButton.vue`

- [ ] **Step 1: 创建复活按钮组件**

```vue
<template>
  <div class="revive-panel" v-if="visible && deadAllies.length > 0 && canRevive">
    <button
      class="revive-btn"
      :disabled="currentMp < mpCost"
      @click="showTargetSelect = true"
    >
      <span class="revive-icon">⚡</span>
      复活队友
      <span class="revive-count">{{ reviveCount }}/{{ maxRevives }}</span>
    </button>

    <!-- 目标选择弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTargetSelect" class="revive-modal" @click.self="showTargetSelect = false">
          <div class="revive-modal__card">
            <h3 class="revive-modal__title">选择复活目标</h3>
            <div class="revive-modal__list">
              <button
                v-for="ally in deadAllies"
                :key="ally.uid"
                class="revive-modal__item"
                @click="handleRevive(ally.uid)"
              >
                <span class="ally-name">{{ ally.name }}</span>
                <span class="ally-info">HP 0/{{ ally.stats.maxHp }}</span>
              </button>
            </div>
            <button class="revive-modal__cancel" @click="showTargetSelect = false">取消</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Combatant } from '../../types/battle'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 死亡的友方单位 */
  deadAllies: Combatant[]
  /** 当前 MP */
  currentMp: number
  /** 复活消耗 MP */
  mpCost: number
  /** 已使用复活次数 */
  reviveCount: number
  /** 最大复活次数 */
  maxRevives: number
}>()

const emit = defineEmits<{
  /** 执行复活 */
  revive: [targetUid: string]
}>()

const showTargetSelect = ref(false)

const canRevive = computed(() => props.reviveCount < props.maxRevives)

function handleRevive(targetUid: string) {
  emit('revive', targetUid)
  showTargetSelect.value = false
}
</script>

<style scoped>
.revive-panel {
  margin-top: 8px;
}

.revive-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(52, 199, 89, 0.3);
  background: rgba(52, 199, 89, 0.12);
  color: var(--accent-green);
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.revive-btn:hover:not(:disabled) {
  background: rgba(52, 199, 89, 0.2);
}

.revive-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.revive-icon {
  font-size: 14px;
}

.revive-count {
  font-size: 11px;
  opacity: 0.7;
}

/* ── Modal ── */
.revive-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.revive-modal__card {
  background: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 20px;
  min-width: 280px;
}

.revive-modal__title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  text-align: center;
}

.revive-modal__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.revive-modal__item {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.revive-modal__item:hover {
  background: rgba(52, 199, 89, 0.1);
}

.ally-name {
  font-weight: 600;
}

.ally-info {
  color: var(--text-muted);
  font-size: 11px;
}

.revive-modal__cancel {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  cursor: pointer;
}

/* ── Animation ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/battle/ReviveButton.vue
git commit -m "feat: add ReviveButton component"
```

---

### Task 7: 修改 dungeon_config.ts 新增团队 Boss 本

**Files:**
- Modify: `src/config/dungeon_config.ts`

- [ ] **Step 1: 在文件末尾添加团队 Boss 本配置**

在 `src/config/dungeon_config.ts` 最后一个 dungeon 配置之后添加：

```typescript
// ─────────────────────────────────────────────────────
// 团队 Boss 副本（多人高难度）
// ─────────────────────────────────────────────────────

/** 团队 Boss 副本列表 */
export const TEAM_BOSS_DUNGEONS: DungeonConfig[] = [
  {
    id: 'team-boss-shadow-dragon',
    name: '暗影龙巢穴',
    areaId: 'shadow-forest',
    difficulty: 'elite',
    staminaCost: 50,
    levelRequirement: 25,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-shadow-dragon',
            name: '暗影龙',
            level: 30,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 500,
      bonusGold: 200,
      guaranteedItems: [
        { itemId: 3010, name: '暗影龙鳞', quantity: 1, rarity: 'Epic' },
        { itemId: 3011, name: '龙牙戒指', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-flame-lord',
    name: '炎魔深渊',
    areaId: 'flame-mountain',
    difficulty: 'elite',
    staminaCost: 60,
    levelRequirement: 28,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-flame-lord',
            name: '炎魔领主',
            level: 35,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 600,
      bonusGold: 250,
      guaranteedItems: [
        { itemId: 3012, name: '炎魔之心', quantity: 1, rarity: 'Epic' },
        { itemId: 3013, name: '烈焰战甲', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-ancient-guardian',
    name: '远古遗迹',
    areaId: 'mystery-ruins',
    difficulty: 'elite',
    staminaCost: 80,
    levelRequirement: 35,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-ancient-guardian',
            name: '远古守护者',
            level: 40,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 800,
      bonusGold: 350,
      guaranteedItems: [
        { itemId: 3014, name: '远古符文', quantity: 1, rarity: 'Legendary' },
        { itemId: 3015, name: '守护者之盾', quantity: 1, rarity: 'Legendary' }
      ]
    }
  }
]
```

同时需要导入 DungeonConfig 类型（已在文件顶部导入）。

- [ ] **Step 2: Commit**

```bash
git add src/config/dungeon_config.ts
git commit -m "feat: add team boss dungeon configs"
```

---

### Task 8: 修改 battleEngine.ts 集成 Boss 机制

**Files:**
- Modify: `src/utils/battleEngine.ts`

这个任务涉及多处修改，分步进行。

- [ ] **Step 1: 在文件顶部添加导入**

在 `src/utils/battleEngine.ts` 的导入区域添加：

```typescript
import {
  initBossBattleState,
  checkPhaseTransition,
  checkEnrage,
  isBossBattle,
  executeRevive
} from './bossMechanics'
import type { BossBattleState } from '../types/boss'
```

- [ ] **Step 2: 在 BattleState 类型中添加 bossState 字段**

在 `src/types/battle.ts` 的 BattleState 接口中添加字段（如果使用内联类型，在 battleEngine.ts 的 createBattleState 函数中添加）：

```typescript
bossState?: BossBattleState
```

- [ ] **Step 3: 在 createBattleState 中初始化 Boss 状态**

在 `createBattleState` 函数中，创建 BattleState 后，检查是否有 Boss 敌人：

```typescript
// 在 return { ... } 之前添加
const bossEnemy = enemies.find(e => e.type === 'enemy')
if (bossEnemy) {
  const bossState = initBossBattleState(bossEnemy)
  if (bossState) {
    state.bossState = bossState
  }
}
```

- [ ] **Step 4: 在 advanceBattle 中处理阶段和狂暴**

在 `advanceBattle` 函数的回合开始（ROUND_START phase）添加 Boss 机制检测：

```typescript
// 在 case BattlePhase.ROUND_START 分支中，phase = BattlePhase.BUFF_SETTLEMENT 之前添加
if (state.bossState) {
  const boss = state.combatants.find(c => c.side === 'enemy')
  if (boss) {
    state.bossState.currentRound++
    state.bossState.phaseChanged = false
    checkPhaseTransition(state, state.bossState, boss)
    checkEnrage(state, state.bossState, boss)
  }
}
```

- [ ] **Step 5: 添加复活 action 类型**

在 `src/types/battle.ts` 的 BattleAction 类型中添加：

```typescript
type BattleActionType = 'attack' | 'skill' | 'defend' | 'flee' | 'revive'
```

修改 BattleAction 接口：

```typescript
export interface BattleAction {
  type: 'attack' | 'skill' | 'defend' | 'flee' | 'revive'
  skillId?: number
  targetUid?: string
}
```

- [ ] **Step 6: 在 submitPlayerAction 中处理复活**

在 `submitPlayerAction` 函数中添加 revive 处理：

```typescript
// 在 switch (action.type) 中添加 case
case 'revive':
  if (state.bossState && action.targetUid) {
    const player = state.combatants.find(c => c.type === 'player')
    if (player) {
      const result = executeRevive(state, state.bossState, action.targetUid, player.stats.mp)
      if (result.success) {
        player.stats.mp -= getBossConfig(bossCombatant?.sourceId ?? '')?.revive.mpCost ?? 0
      }
    }
  }
  break
```

- [ ] **Step 7: Commit**

```bash
git add src/utils/battleEngine.ts src/types/battle.ts
git commit -m "feat: integrate boss mechanics into battle engine"
```

---

### Task 9: 修改 battle.ts store 添加复活处理

**Files:**
- Modify: `src/stores/battle.ts`

- [ ] **Step 1: 添加 Boss 相关计算属性**

在 `useBattleStore` 中添加：

```typescript
import { isBossBattle } from '../utils/bossMechanics'

/** 是否为 Boss 战斗 */
const isBossFight = computed(() => battleState.value ? isBossBattle(battleState.value) : false)

/** Boss 战状态 */
const bossState = computed(() => battleState.value?.bossState)
```

- [ ] **Step 2: 在 return 中导出**

```typescript
return {
  // ...existing
  isBossFight,
  bossState
}
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/battle.ts
git commit -m "feat: add boss state to battle store"
```

---

### Task 10: 修改 BattleView.vue 显示 Boss UI

**Files:**
- Modify: `src/views/BattleView.vue`

- [ ] **Step 1: 添加组件导入**

```typescript
import BossPhaseIndicator from '../components/battle/BossPhaseIndicator.vue'
import BossEnrageTimer from '../components/battle/BossEnrageTimer.vue'
import ReviveButton from '../components/battle/ReviveButton.vue'
import { getBossConfig } from '../config/boss_config'
import { getDeadAllies } from '../utils/bossMechanics'
```

- [ ] **Step 2: 添加 Boss 数据计算属性**

```typescript
const bossEnemy = computed(() => store.combatants.find(c => c.side === 'enemy'))
const bossConfig = computed(() => bossEnemy.value ? getBossConfig(bossEnemy.value.sourceId) : null)
const deadAllies = computed(() => store.battleState ? getDeadAllies(store.battleState) : [])
const playerCombatant = computed(() => store.combatants.find(c => c.type === 'player'))
```

- [ ] **Step 3: 在模板中添加 Boss UI**

在 battlefield-divider 上方添加：

```html
<!-- Boss 阶段指示器 -->
<BossPhaseIndicator
  v-if="store.isBossFight && bossEnemy && bossConfig"
  :visible="true"
  :boss-name="bossEnemy.name"
  :current-phase="store.bossState?.currentPhase ?? 1"
  :total-phases="bossConfig.phases.length"
  :boss-hp="bossEnemy.stats.hp"
  :boss-max-hp="bossEnemy.stats.maxHp"
  :phase-changed="store.bossState?.phaseChanged ?? false"
/>
<BossEnrageTimer
  v-if="store.isBossFight && bossConfig"
  :visible="true"
  :is-enraged="store.bossState?.isEnraged ?? false"
  :enrage-round="bossConfig.enrage.enrageRound"
  :current-round="store.bossState?.currentRound ?? 0"
  :attack-mult="bossConfig.enrage.attackMultiplier"
/>
```

- [ ] **Step 4: 在 BattleActionPanel 下方添加 ReviveButton**

```html
<ReviveButton
  v-if="store.isBossFight && bossConfig && store.waitingForPlayer"
  :visible="true"
  :dead-allies="deadAllies"
  :current-mp="playerCombatant?.stats.mp ?? 0"
  :mp-cost="bossConfig.revive.mpCost"
  :revive-count="store.bossState?.reviveCount ?? 0"
  :max-revives="bossConfig.revive.maxRevives"
  @revive="handleRevive"
/>
```

- [ ] **Step 5: 添加 handleRevive 函数**

```typescript
async function handleRevive(targetUid: string) {
  await store.submitAction({ type: 'revive', targetUid })
}
```

- [ ] **Step 6: Commit**

```bash
git add src/views/BattleView.vue
git commit -m "feat: integrate boss UI components into BattleView"
```

---

### Task 11: 创建后端对接文档

**Files:**
- Create: `团队副本Boss战-后端对接文档.md`

- [ ] **Step 1: 创建文档**

```markdown
# 团队副本 Boss 战 - 后端对接文档

## 概述

团队副本 Boss 战在现有多人副本基础上增加 Boss 专属机制：狂暴计时、阶段切换、全屏 AOE、队友复活。

---

## 1. Boss 配置 API

### 1.1 获取 Boss 配置

```
GET /boss/:bossId/config
```

**响应：**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "bossId": "boss-shadow-dragon",
    "bossName": "暗影龙",
    "phases": [
      { "phase": 1, "hpThreshold": 1.0, "attackMultiplier": 1.0, "skillIds": [9001, 9003] },
      { "phase": 2, "hpThreshold": 0.7, "attackMultiplier": 1.2, "skillIds": [9001, 9003, 9011] },
      { "phase": 3, "hpThreshold": 0.3, "attackMultiplier": 1.5, "skillIds": [9011, 9012] }
    ],
    "enrage": { "enrageRound": 20, "attackMultiplier": 2.5, "speedMultiplier": 2.0 },
    "revive": { "reviveHpPercent": 30, "mpCost": 25, "maxRevives": 3 },
    "aoeSkillIds": [9011]
  }
}
```

---

## 2. 复活 API

### 2.1 复活队友

```
POST /battle/revive
```

**请求：**

```json
{
  "battleId": "battle-001",
  "targetUid": "ally-member-002"
}
```

**响应：**

```json
{
  "code": 200,
  "message": "复活成功",
  "data": {
    "targetUid": "ally-member-002",
    "newHp": 36,
    "reviveCount": 1
  }
}
```

**后端逻辑：**
1. 校验 battleId 存在且为 Boss 战斗
2. 校验 reviveCount < maxRevives
3. 校验玩家 MP >= mpCost
4. 设置目标 HP = maxHp × reviveHpPercent%
5. 增加 reviveCount
6. 扣减玩家 MP

---

## 3. 阶段/狂暴通知（可选）

若采用 WebSocket 实时通知：

```
{
  "type": "boss_phase_change",
  "battleId": "battle-001",
  "newPhase": 2,
  "attackMultiplier": 1.2
}

{
  "type": "boss_enrage",
  "battleId": "battle-001",
  "attackMultiplier": 2.5,
  "speedMultiplier": 2.0
}
```

---

## 4. 前端 Mock 行为

| 功能 | Mock 实现 |
|:---|:---|:---|
| Boss 配置 | 前端 `boss_config.ts` 预定义 |
| 阶段切换 | battleEngine.ts 每回合检测 HP 百分比 |
| 狂暴触发 | battleEngine.ts 检测回合数 |
| 复活处理 | bossMechanics.ts 本地执行 |
| AOE 技能 | 复用现有 targetType='all_enemies' |

后端对接后：
- Boss 配置从 API 获取
- 复活请求发送到后端校验
- 阶段/狂暴可改为服务端推送

---

## 5. 类型定义

参见 `src/types/boss.ts`
```

- [ ] **Step 2: Commit**

```bash
git add 团队副本Boss战-后端对接文档.md
git commit -m "docs: add team boss battle backend integration doc"
```

---

### Task 12: 更新开发方案 + 构建验证

**Files:**
- Modify: `开发方案.md`

- [ ] **Step 1: 更新开发方案第 521 行**

将 `| 团队副本 Boss 战 | P2 | 高难度多人协作 |` 改为 `| 团队副本 Boss 战 | P2 | ✅ 已完成 | 狂暴计时、阶段切换、全屏AOE、队友复活、Boss专用UI、后端对接文档 |`

- [ ] **Step 2: 运行构建验证**

```bash
cd "/Users/hyacinth/Desktop/project sword" && npm run build
```

Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 3: Commit**

```bash
git add 开发方案.md
git commit -m "docs: mark team boss battle feature as completed"
```