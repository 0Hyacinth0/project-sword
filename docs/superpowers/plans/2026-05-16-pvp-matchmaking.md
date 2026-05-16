# 实时 PVP 匹配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在竞技场面板内实现 PVP 匹配流程：匹配按钮 → 搜索动画 → 对手确认 → AI 对战 → 积分结算，复用现有 battleEngine。

**Architecture:** 新建 types/pvp + config/pvp_config + api/pvp + stores/pvp 四层数据文件，新建 PvpMatchOverlay + PvpSettlementOverlay 两个覆盖层组件，修改 ArenaPanel 集成匹配按钮和覆盖层。战斗通过 `battleStore.startWildBattle` 发起，对手作为 enemy Combatant 传入。

**Tech Stack:** Vue 3 + TypeScript + Pinia + 现有 battleEngine

---

## File Structure

| File | Action | Responsibility |
|:---|:---|:---|
| `src/types/pvp.ts` | Create | PVP 类型定义 |
| `src/config/pvp_config.ts` | Create | Elo 计算 + Mock 对手池 |
| `src/api/pvp.ts` | Create | API + Mock（匹配、结算） |
| `src/stores/pvp.ts` | Create | Pinia 匹配状态管理 |
| `src/components/arena/PvpMatchOverlay.vue` | Create | 匹配搜索 + 对手确认覆盖层 |
| `src/components/arena/PvpSettlementOverlay.vue` | Create | 战斗结算覆盖层 |
| `src/components/arena/ArenaPanel.vue` | Modify | 添加匹配按钮 + 集成覆盖层 |

---

### Task 1: 定义 PVP 类型

**Files:**
- Create: `src/types/pvp.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
/**
 * PVP 竞技匹配类型定义
 * 匹配状态、对手信息、积分结算
 */
import type { ArenaTier, ArenaSubTier, TierInfo } from './arena'

/** 匹配状态 */
export type PvpMatchState = 'idle' | 'searching' | 'found' | 'ready' | 'in_battle' | 'settling'

/** 匹配到的对手信息 */
export interface PvpOpponent {
  /** 对手角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 段位 */
  tier: ArenaTier
  /** 小级 */
  subTier: ArenaSubTier
  /** 竞技积分 */
  score: number
}

/** 积分结算结果 */
export interface PvpScoreResult {
  /** 积分变化（正=胜，负=败） */
  scoreChange: number
  /** 原积分 */
  oldScore: number
  /** 新积分 */
  newScore: number
  /** 是否升/降段 */
  tierChanged: boolean
  /** 原段位信息 */
  oldTier: TierInfo
  /** 新段位信息 */
  newTier: TierInfo
}

/** 预计积分变化 */
export interface EstimatedScore {
  /** 胜利可获积分 */
  win: number
  /** 失败扣除积分 */
  lose: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/pvp.ts
git commit -m "feat: add PVP matchmaking type definitions"
```

---

### Task 2: 创建 PVP 配置（Elo 计算 + Mock 对手池）

**Files:**
- Create: `src/config/pvp_config.ts`

- [ ] **Step 1: 创建配置文件**

```typescript
/**
 * PVP 匹配配置
 * 简化 Elo 积分计算、Mock 对手池
 */
import type { PvpOpponent, EstimatedScore } from '../types/pvp'
import type { ArenaTier, ArenaSubTier } from '../types/arena'

/**
 * 计算简化 Elo 积分变化
 * 基础 ±25 分，根据积分差距调整 ±10，范围 ±15 ~ ±35
 * @param myScore - 我的积分
 * @param opponentScore - 对手积分
 * @returns 预计积分变化（胜/败）
 */
export function calculateEloScore(myScore: number, opponentScore: number): EstimatedScore {
  const base = 25
  const diff = Math.round((opponentScore - myScore) / 100)
  const win = Math.max(15, Math.min(35, base + diff))
  const lose = Math.max(15, Math.min(35, base - diff))
  return { win, lose }
}

/** Mock 对手池 */
export const MOCK_PVP_OPPONENTS: PvpOpponent[] = [
  { characterId: 'pvp-opp-001', characterName: '火焰法师', profession: 'Mage', level: 33, tier: 'diamond', subTier: 'III', score: 2450 },
  { characterId: 'pvp-opp-002', characterName: '暗夜刺客', profession: 'Hunter', level: 28, tier: 'platinum', subTier: 'I', score: 2300 },
  { characterId: 'pvp-opp-003', characterName: '圣光骑士', profession: 'Warrior', level: 25, tier: 'platinum', subTier: 'III', score: 1900 },
  { characterId: 'pvp-opp-004', characterName: '冰霜女巫', profession: 'Mage', level: 22, tier: 'gold', subTier: 'I', score: 1700 },
  { characterId: 'pvp-opp-005', characterName: '狂暴战士', profession: 'Warrior', level: 20, tier: 'silver', subTier: 'II', score: 900 },
  { characterId: 'pvp-opp-006', characterName: '影舞者', profession: 'Hunter', level: 15, tier: 'bronze', subTier: 'I', score: 200 }
]

/**
 * 从 Mock 对手池中选取匹配对手
 * 优先选择积分接近的对手，有一定随机性
 * @param myScore - 我的积分
 * @returns 匹配到的对手
 */
export function selectMockOpponent(myScore: number): PvpOpponent {
  // 按积分差距排序（升序）
  const sorted = [...MOCK_PVP_OPPONENTS]
    .map(opp => ({ opp, diff: Math.abs(opp.score - myScore) }))
    .sort((a, b) => a.diff - b.diff)

  // 从前 3 名中随机选取（积分最接近的）
  const topN = sorted.slice(0, Math.min(3, sorted.length))
  const pick = topN[Math.floor(Math.random() * topN.length)]
  return pick.opp
}

/**
 * 根据职业和等级生成对手战斗属性
 * @param opponent - 对手信息
 * @returns 战斗属性
 */
export function generateOpponentStats(opponent: PvpOpponent): {
  maxHp: number; maxMp: number; physicalAttack: number; magicAttack: number
  defense: number; speed: number; dodgeRate: number; criticalRate: number
} {
  const base = opponent.level * 8
  const isMage = opponent.profession === 'Mage'
  const isHunter = opponent.profession === 'Hunter'

  return {
    maxHp: base * 4 + 100,
    maxMp: base * 2,
    physicalAttack: isMage ? base * 0.6 : base,
    magicAttack: isMage ? base * 1.4 : isHunter ? base * 0.8 : base * 0.5,
    defense: base * 0.8,
    speed: isHunter ? 18 : 10,
    dodgeRate: isHunter ? 0.15 : 0.05,
    criticalRate: isHunter ? 0.12 : 0.08
  }
}

/**
 * 获取职业对应的基础战斗技能
 * @param profession - 职业
 * @returns 技能列表
 */
export function getOpponentSkills(profession: string): Array<{
  id: number; name: string; mpCost: number; power: number;
  targetType: 'single_enemy' | 'all_enemies'; cooldown: number; element: string
}> {
  const skillSets: Record<string, Array<{
    id: number; name: string; mpCost: number; power: number;
    targetType: 'single_enemy' | 'all_enemies'; cooldown: number; element: string
  }>> = {
    Warrior: [
      { id: 8001, name: '猛击', mpCost: 8, power: 1.3, targetType: 'single_enemy', cooldown: 0, element: 'none' },
      { id: 8002, name: '旋风斩', mpCost: 15, power: 1.0, targetType: 'all_enemies', cooldown: 3, element: 'none' },
      { id: 8003, name: '战吼', mpCost: 12, power: 1.5, targetType: 'single_enemy', cooldown: 4, element: 'none' }
    ],
    Mage: [
      { id: 8101, name: '火球术', mpCost: 10, power: 1.4, targetType: 'single_enemy', cooldown: 0, element: 'fire' },
      { id: 8102, name: '暴风雪', mpCost: 18, power: 1.1, targetType: 'all_enemies', cooldown: 3, element: 'water' },
      { id: 8103, name: '雷电术', mpCost: 14, power: 1.6, targetType: 'single_enemy', cooldown: 4, element: 'wind' }
    ],
    Hunter: [
      { id: 8201, name: '连射', mpCost: 8, power: 1.2, targetType: 'single_enemy', cooldown: 0, element: 'none' },
      { id: 8202, name: '箭雨', mpCost: 16, power: 0.9, targetType: 'all_enemies', cooldown: 3, element: 'none' },
      { id: 8203, name: '毒箭', mpCost: 12, power: 1.4, targetType: 'single_enemy', cooldown: 4, element: 'wind' }
    ]
  }
  return skillSets[profession] ?? skillSets.Warrior
}
```

- [ ] **Step 2: Commit**

```bash
git add src/config/pvp_config.ts
git commit -m "feat: add PVP config with Elo calculation and mock opponents"
```

---

### Task 3: 创建 PVP API + Mock

**Files:**
- Create: `src/api/pvp.ts`

- [ ] **Step 1: 创建 API 文件**

先查看现有 API 文件确认导入模式。参考 `src/api/arena.ts` 的 `isMockEnabled` + `delay` 模式。

```typescript
/**
 * PVP 匹配相关 API
 * 发起匹配、提交结算
 */
import request from './request'
import type { ApiResponse } from './request'
import type { PvpOpponent, PvpScoreResult } from '../types/pvp'
import { isMockEnabled } from '../utils/mockConfig'
import { selectMockOpponent, calculateEloScore } from '../config/pvp_config'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 发起 PVP 匹配
 * 返回匹配到的对手信息
 */
export async function startMatchmakingApi(myScore: number): Promise<ApiResponse<PvpOpponent>> {
  if (isMockEnabled()) {
    await delay(3000 + Math.random() * 5000)
    const opponent = selectMockOpponent(myScore)
    return { code: 200, message: '匹配成功', data: opponent }
  }
  return request.post('/arena/match', { score: myScore })
}

/**
 * 提交 PVP 战斗结算
 * @param opponentId - 对手 ID
 * @param won - 是否胜利
 * @param myScore - 我的原积分
 * @param opponentScore - 对手积分
 */
export async function settlePvpBattleApi(
  opponentId: string,
  won: boolean,
  myScore: number,
  opponentScore: number
): Promise<ApiResponse<PvpScoreResult>> {
  if (isMockEnabled()) {
    await delay(300)
    const estimated = calculateEloScore(myScore, opponentScore)
    const scoreChange = won ? estimated.win : -estimated.lose
    return {
      code: 200,
      message: '结算成功',
      data: {
        scoreChange,
        oldScore: myScore,
        newScore: myScore + scoreChange,
        tierChanged: false,
        oldTier: {} as any,
        newTier: {} as any
      }
    }
  }
  return request.post('/arena/settle', { opponentId, won })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/pvp.ts
git commit -m "feat: add PVP API with mock matchmaking and settlement"
```

---

### Task 4: 创建 PVP Pinia Store

**Files:**
- Create: `src/stores/pvp.ts`

- [ ] **Step 1: 创建 Store 文件**

此 Store 管理完整匹配生命周期：搜索 → 找到对手 → 确认 → 战斗中 → 结算 → 返回空闲。

```typescript
/**
 * PVP 匹配状态管理
 * 管理匹配流程、对手信息、积分结算
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { startMatchmakingApi, settlePvpBattleApi } from '../api/pvp'
import { calculateEloScore, generateOpponentStats, getOpponentSkills } from '../config/pvp_config'
import { resolveTier } from '../config/arena_config'
import { useArenaStore } from './arena'
import { useBattleStore } from './battle'
import { useCharacterStore } from './character'
import type { PvpMatchState, PvpOpponent, PvpScoreResult, EstimatedScore } from '../types/pvp'
import type { Combatant, BattleSkill } from '../types/battle'

export const usePvpStore = defineStore('pvp', () => {
  // ── 状态 ──
  const matchState = ref<PvpMatchState>('idle')
  const opponent = ref<PvpOpponent | null>(null)
  const scoreResult = ref<PvpScoreResult | null>(null)

  // ── 计算属性 ──

  /** 是否处于匹配流程中（搜索或已找到对手） */
  const isMatching = computed(() =>
    matchState.value === 'searching' || matchState.value === 'found'
  )

  /** 预计积分变化（基于对手积分差） */
  const estimatedScore = computed<EstimatedScore | null>(() => {
    const arena = useArenaStore()
    if (!opponent.value || !arena.playerData) return null
    return calculateEloScore(arena.playerData.score, opponent.value.score)
  })

  // ── 方法 ──

  /**
   * 开始匹配
   * 调用 API 搜索对手，成功后进入 found 状态
   */
  async function startMatchmaking(): Promise<void> {
    const arena = useArenaStore()
    if (!arena.playerData) return

    matchState.value = 'searching'
    opponent.value = null
    scoreResult.value = null

    try {
      const res = await startMatchmakingApi(arena.playerData.score)
      if (res.code === 200) {
        opponent.value = res.data
        matchState.value = 'found'
      } else {
        matchState.value = 'idle'
      }
    } catch {
      matchState.value = 'idle'
    }
  }

  /**
   * 取消匹配
   */
  function cancelMatchmaking(): void {
    matchState.value = 'idle'
    opponent.value = null
  }

  /**
   * 确认战斗，创建对手 Combatant 并发起战斗
   * @returns 战斗发起是否成功
   */
  async function confirmBattle(): Promise<{ success: boolean; message: string }> {
    if (!opponent.value) return { success: false, message: '没有对手' }

    const charStore = useCharacterStore()
    const battleStore = useBattleStore()

    const character = charStore.characterDetail
    if (!character) return { success: false, message: '角色数据不存在' }

    // 创建对手 Combatant
    const oppStats = generateOpponentStats(opponent.value)
    const oppSkills = getOpponentSkills(opponent.value.profession).map(
      (s): BattleSkill => ({
        id: s.id,
        name: s.name,
        mpCost: s.mpCost,
        power: s.power,
        targetType: s.targetType,
        cooldown: s.cooldown,
        currentCooldown: 0,
        element: s.element,
        description: ''
      })
    )

    const enemyCombatant: Combatant = {
      uid: 'enemy-pvp-opponent',
      sourceId: opponent.value.characterId,
      name: opponent.value.characterName,
      side: 'enemy',
      type: 'enemy',
      stats: { ...oppStats, hp: oppStats.maxHp, mp: oppStats.maxMp },
      skills: oppSkills,
      buffs: [],
      cooldowns: {},
      isAlive: true,
      actionValue: 0
    }

    // 使用 startWildBattle 发起战斗
    const result = await battleStore.startWildBattle(
      character.id,
      character.name,
      character.statsBreakdown,
      character.skills?.map(s => ({
        id: s.id,
        name: s.name,
        mpCost: s.mpCost,
        power: s.power,
        targetType: s.targetType as 'single_enemy' | 'all_enemies',
        cooldown: s.cooldown,
        currentCooldown: 0,
        element: s.element ?? 'none',
        description: s.description ?? ''
      })) ?? [],
      enemyCombatant
    )

    if (result.success) {
      matchState.value = 'in_battle'
    }

    return result
  }

  /**
   * 结算 PVP 战斗
   * 根据胜负计算积分变化
   * @param won - 是否胜利
   */
  async function settleBattle(won: boolean): Promise<void> {
    const arena = useArenaStore()
    if (!arena.playerData || !opponent.value) return

    matchState.value = 'settling'

    const res = await settlePvpBattleApi(
      opponent.value.characterId,
      won,
      arena.playerData.score,
      opponent.value.score
    )

    if (res.code === 200) {
      const oldScore = arena.playerData.score
      const newScore = oldScore + res.data.scoreChange
      scoreResult.value = {
        ...res.data,
        oldScore,
        newScore,
        oldTier: resolveTier(oldScore),
        newTier: resolveTier(newScore),
        tierChanged: resolveTier(oldScore).tier !== resolveTier(newScore).tier
      }

      // 更新 arena store 中的玩家数据
      arena.playerData = {
        ...arena.playerData,
        score: newScore,
        wins: arena.playerData.wins + (won ? 1 : 0),
        losses: arena.playerData.losses + (won ? 0 : 1),
        winRate: (arena.playerData.wins + (won ? 1 : 0)) /
          (arena.playerData.wins + arena.playerData.losses + 1)
      }
    }
  }

  /**
   * 重置匹配状态
   */
  function resetMatch(): void {
    matchState.value = 'idle'
    opponent.value = null
    scoreResult.value = null
  }

  return {
    matchState,
    opponent,
    scoreResult,
    isMatching,
    estimatedScore,
    startMatchmaking,
    cancelMatchmaking,
    confirmBattle,
    settleBattle,
    resetMatch
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/pvp.ts
git commit -m "feat: add PVP matchmaking Pinia store"
```

---

### Task 5: 创建匹配覆盖层组件

**Files:**
- Create: `src/components/arena/PvpMatchOverlay.vue`

- [ ] **Step 1: 创建匹配覆盖层组件**

此组件负责匹配搜索动画和对手确认 VS 卡片，以绝对定位覆盖在 ArenaPanel 上方。

```vue
<template>
  <Transition name="overlay-fade">
    <div v-if="visible" class="pvp-match-overlay">
      <!-- 搜索中 -->
      <template v-if="state === 'searching'">
        <div class="pvp-match-overlay__header">
          <span class="match-icon match-icon--spin">⚔️</span>
          <span class="match-title">正在寻找对手...</span>
          <span class="match-subtitle">预计等待 5-15 秒</span>
        </div>
        <div class="pvp-match-overlay__spinner"></div>
        <div class="match-preview">
          <div class="match-preview__self">
            <span class="match-preview__name">{{ myName }}</span>
            <span class="match-preview__tier" :style="{ color: myTierColor }">{{ myTierName }}</span>
          </div>
          <span class="match-preview__vs">VS</span>
          <div class="match-preview__unknown">
            <span class="match-preview__name">???</span>
            <span class="match-preview__tier">等待匹配</span>
          </div>
        </div>
        <button class="match-btn match-btn--cancel" @click="emit('cancel')">取消匹配</button>
      </template>

      <!-- 找到对手 -->
      <template v-else-if="state === 'found' && opponent">
        <div class="pvp-match-overlay__found-badge">对手已找到！</div>
        <div class="match-vs">
          <div class="match-vs__card match-vs__card--self" :style="selfCardStyle">
            <span class="match-vs__icon">{{ myTierIcon }}</span>
            <span class="match-vs__name">{{ myName }}</span>
            <span class="match-vs__tier" :style="{ color: myTierColor }">{{ myTierName }}</span>
            <span class="match-vs__info">Lv.{{ myLevel }} · {{ myScore }}分</span>
          </div>
          <span class="match-vs__divider">VS</span>
          <div class="match-vs__card match-vs__card--opponent" :style="opponentCardStyle">
            <span class="match-vs__icon">{{ opponentTierIcon }}</span>
            <span class="match-vs__name">{{ opponent.characterName }}</span>
            <span class="match-vs__tier" :style="{ color: opponentTierColor }">{{ opponentTierName }}</span>
            <span class="match-vs__info">Lv.{{ opponent.level }} · {{ opponent.score }}分</span>
          </div>
        </div>
        <div class="match-estimate" v-if="estimated">
          胜利 <span class="match-estimate--win">+{{ estimated.win }}</span> · 失败 <span class="match-estimate--lose">-{{ estimated.lose }}</span>
        </div>
        <button class="match-btn match-btn--start" @click="emit('start-battle')">开始战斗</button>
        <button class="match-btn match-btn--giveup" @click="emit('cancel')">放弃匹配</button>
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArenaStore } from '../../stores/arena'
import { getTierConfig } from '../../config/arena_config'
import type { PvpMatchState, PvpOpponent, EstimatedScore } from '../../types/pvp'

const props = defineProps<{
  /** 是否显示覆盖层 */
  visible: boolean
  /** 当前匹配状态 */
  state: PvpMatchState
  /** 匹配到的对手 */
  opponent: PvpOpponent | null
  /** 预计积分变化 */
  estimated: EstimatedScore | null
}>()

const emit = defineEmits<{
  /** 取消匹配 */
  cancel: []
  /** 开始战斗 */
  'start-battle': []
}>()

const arena = useArenaStore()

/** 我的角色名 */
const myName = computed(() => '我的角色')

/** 我的等级 */
const myLevel = computed(() => 30)

/** 我的积分 */
const myScore = computed(() => arena.playerData?.score ?? 0)

/** 我的段位配置 */
const myTierConfig = computed(() => getTierConfig(arena.playerData?.tier ?? 'bronze'))

/** 我的段位名 */
const myTierName = computed(() => `${myTierConfig.value.name} ${arena.playerData?.subTier ?? 'III'}`)

/** 我的段位颜色 */
const myTierColor = computed(() => myTierConfig.value.color)

/** 我的段位图标 */
const myTierIcon = computed(() => myTierConfig.value.icon)

/** 自己卡片的渐变背景 */
const selfCardStyle = computed(() => ({
  background: `linear-gradient(135deg, ${myTierColor.value}1a, ${myTierColor.value}08)`,
  borderColor: `${myTierColor.value}33`
}))

/** 对手段位配置 */
const opponentTierConfig = computed(() => getTierConfig(props.opponent?.tier ?? 'bronze'))

/** 对手段位名 */
const opponentTierName = computed(() => `${opponentTierConfig.value.name} ${props.opponent?.subTier ?? 'III'}`)

/** 对手段位颜色 */
const opponentTierColor = computed(() => opponentTierConfig.value.color)

/** 对手段位图标 */
const opponentTierIcon = computed(() => opponentTierConfig.value.icon)

/** 对手卡片的渐变背景 */
const opponentCardStyle = computed(() => ({
  background: `linear-gradient(135deg, ${opponentTierColor.value}1a, ${opponentTierColor.value}08)`,
  borderColor: `${opponentTierColor.value}33`
}))
</script>

<style scoped>
.pvp-match-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-panel);
  border-radius: 16px;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ── 搜索中 ── */
.pvp-match-overlay__header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-icon {
  font-size: 32px;
  display: block;
}
.match-icon--spin {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.match-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
}

.match-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.pvp-match-overlay__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-light);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.match-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-panel-light);
  border-radius: 12px;
  width: 100%;
}

.match-preview__self,
.match-preview__unknown {
  flex: 1;
}

.match-preview__self {
  text-align: left;
}

.match-preview__unknown {
  text-align: right;
  opacity: 0.4;
}

.match-preview__name {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.match-preview__tier {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.match-preview__vs {
  font-size: var(--font-size-base);
  font-weight: 900;
  color: var(--accent-red);
}

/* ── 找到对手 ── */
.pvp-match-overlay__found-badge {
  font-size: var(--font-size-caption);
  color: var(--accent-gold);
  font-weight: 600;
}

.match-vs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.match-vs__card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.match-vs__icon {
  font-size: 20px;
}

.match-vs__name {
  font-size: var(--font-size-caption);
  font-weight: 700;
  color: var(--text-primary);
}

.match-vs__tier {
  font-size: var(--font-size-xs);
}

.match-vs__info {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.match-vs__divider {
  font-size: 18px;
  font-weight: 900;
  color: var(--accent-red);
}

.match-estimate {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.match-estimate--win {
  color: var(--accent-green);
  font-weight: 600;
}

.match-estimate--lose {
  color: var(--accent-red);
  font-weight: 600;
}

/* ── 按钮 ── */
.match-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
}

.match-btn--start {
  background: linear-gradient(135deg, var(--accent-blue), #7c5cfc);
  color: white;
}

.match-btn--cancel,
.match-btn--giveup {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-light);
}

.match-btn--giveup {
  font-size: var(--font-size-xs);
  padding: 6px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/arena/PvpMatchOverlay.vue
git commit -m "feat: add PvpMatchOverlay component"
```

---

### Task 6: 创建结算覆盖层组件

**Files:**
- Create: `src/components/arena/PvpSettlementOverlay.vue`

- [ ] **Step 1: 创建结算覆盖层组件**

```vue
<template>
  <Transition name="overlay-fade">
    <div v-if="visible && result" class="pvp-settlement-overlay">
      <!-- 结果标题 -->
      <span class="settlement-result" :class="isVictory ? 'settlement-result--win' : 'settlement-result--lose'">
        {{ isVictory ? '胜利！' : '失败' }}
      </span>
      <span class="settlement-tier-change" v-if="result.tierChanged">
        {{ result.oldTier.tierName }} → {{ result.newTier.tierName }}
      </span>

      <!-- 积分变化 -->
      <div class="settlement-score">
        <div class="settlement-score__block">
          <span class="settlement-score__label">原积分</span>
          <span class="settlement-score__value">{{ result.oldScore }}</span>
        </div>
        <span class="settlement-score__change" :class="isVictory ? 'settlement-score__change--win' : 'settlement-score__change--lose'">
          {{ isVictory ? '+' : '' }}{{ result.scoreChange }}
        </span>
        <div class="settlement-score__block">
          <span class="settlement-score__label">新积分</span>
          <span class="settlement-score__value" :class="isVictory ? 'settlement-score__value--up' : 'settlement-score__value--down'">
            {{ result.newScore }}
          </span>
        </div>
      </div>

      <!-- 段位进度条 -->
      <div class="settlement-progress">
        <div class="settlement-progress__bar" :style="{ width: `${result.newTier.progress * 100}%` }"></div>
      </div>
      <span class="settlement-progress__text">
        距下一级还需 {{ result.newTier.remainingScore }} 积分
      </span>

      <!-- 战绩更新 -->
      <div class="settlement-stats">
        <div class="settlement-stats__item">
          <span class="settlement-stats__value settlement-stats__value--win">{{ wins }}</span>
          <span class="settlement-stats__label">胜场{{ isVictory ? ' (+1)' : '' }}</span>
        </div>
        <div class="settlement-stats__item">
          <span class="settlement-stats__value settlement-stats__value--lose">{{ losses }}</span>
          <span class="settlement-stats__label">败场{{ isVictory ? '' : ' (+1)' }}</span>
        </div>
        <div class="settlement-stats__item">
          <span class="settlement-stats__value settlement-stats__value--rate">{{ winRateText }}</span>
          <span class="settlement-stats__label">胜率</span>
        </div>
      </div>

      <button class="settlement-btn" @click="emit('close')">返回竞技场</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PvpScoreResult } from '../../types/pvp'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 结算结果 */
  result: PvpScoreResult | null
  /** 是否胜利 */
  isVictory: boolean
  /** 当前胜场 */
  wins: number
  /** 当前败场 */
  losses: number
  /** 当前胜率 */
  winRate: number
}>()

const emit = defineEmits<{
  /** 关闭结算 */
  close: []
}>()

/** 胜率显示文本 */
const winRateText = computed(() => {
  if (!props.wins && !props.losses) return '0%'
  return `${(props.winRate * 100).toFixed(1)}%`
})
</script>

<style scoped>
.pvp-settlement-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  background: var(--bg-panel);
  border-radius: 16px;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ── 结果标题 ── */
.settlement-result {
  font-size: 28px;
  font-weight: 900;
}
.settlement-result--win {
  color: var(--accent-gold);
}
.settlement-result--lose {
  color: var(--accent-red);
}

.settlement-tier-change {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

/* ── 积分变化 ── */
.settlement-score {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-panel-light);
  border-radius: 12px;
  width: 100%;
}

.settlement-score__block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.settlement-score__label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.settlement-score__value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.settlement-score__value--up {
  color: var(--accent-green);
}
.settlement-score__value--down {
  color: var(--accent-red);
}

.settlement-score__change {
  font-size: 20px;
  font-weight: 700;
}
.settlement-score__change--win {
  color: var(--accent-green);
}
.settlement-score__change--lose {
  color: var(--accent-red);
}

/* ── 进度条 ── */
.settlement-progress {
  width: 100%;
  height: 8px;
  background: var(--bg-panel-light);
  border-radius: 4px;
  overflow: hidden;
}

.settlement-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, #00b894, #00d2ff);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.settlement-progress__text {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 战绩 ── */
.settlement-stats {
  display: flex;
  gap: 8px;
  width: 100%;
}

.settlement-stats__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  background: var(--bg-panel-light);
  border-radius: 8px;
}

.settlement-stats__value {
  font-size: var(--font-size-base);
  font-weight: 700;
}
.settlement-stats__value--win { color: var(--accent-green); }
.settlement-stats__value--lose { color: var(--accent-red); }
.settlement-stats__value--rate { color: var(--accent-blue); }

.settlement-stats__label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ── 按钮 ── */
.settlement-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: var(--accent-blue);
  color: white;
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/arena/PvpSettlementOverlay.vue
git commit -m "feat: add PvpSettlementOverlay component"
```

---

### Task 7: 修改 ArenaPanel 集成 PVP 匹配

**Files:**
- Modify: `src/components/arena/ArenaPanel.vue`

ArenaPanel 需要：
1. 在段位列表下方添加"开始匹配"按钮
2. 添加 PvpMatchOverlay 覆盖层（搜索 + 对手确认）
3. 添加 PvpSettlementOverlay 覆盖层（积分结算）
4. 处理匹配流程的生命周期

- [ ] **Step 1: 添加 import**

在 `<script setup>` 开头的 import 区域添加：

```typescript
import { usePvpStore } from '../../stores/pvp'
import { useBattleStore } from '../../stores/battle'
import PvpMatchOverlay from './PvpMatchOverlay.vue'
import PvpSettlementOverlay from './PvpSettlementOverlay.vue'
```

- [ ] **Step 2: 添加 pvp store 和 battle store 引用**

在 `const store = useArenaStore()` 之后添加：

```typescript
const pvpStore = usePvpStore()
const battleStore = useBattleStore()
```

- [ ] **Step 3: 添加 emit**

在 script setup 中添加 emit 声明（用于通知 HomeView 进入战斗视图）：

```typescript
const emit = defineEmits<{
  /** 请求进入战斗视图 */
  'battle-started': []
}>()
```

- [ ] **Step 4: 添加匹配相关方法**

在 `onMounted` 之前添加：

```typescript
/**
 * 开始 PVP 匹配
 */
function handleStartMatch(): void {
  pvpStore.startMatchmaking()
}

/**
 * 取消匹配
 */
function handleCancelMatch(): void {
  pvpStore.cancelMatchmaking()
}

/**
 * 确认战斗，发起 PVP 对战并通知 HomeView 切换视图
 */
async function handleStartBattle(): Promise<void> {
  const result = await pvpStore.confirmBattle()
  if (result.success) {
    emit('battle-started')
  }
}

/**
 * PVP 战斗结束回调
 * 由 HomeView 的 returnFromBattle 触发
 * @param won - 是否胜利
 */
async function handlePvpBattleEnd(won: boolean): Promise<void> {
  await pvpStore.settleBattle(won)
}

/**
 * 关闭结算覆盖层
 */
function handleCloseSettlement(): void {
  pvpStore.resetMatch()
}
```

- [ ] **Step 5: 修改模板**

将 ArenaPanel 最外层 `<div class="arena-panel">` 改为相对定位容器以支持覆盖层，并在主内容末尾（段位列表之后）添加"开始匹配"按钮和两个覆盖层。

在外层 div 上添加 `style="position: relative"`：

```html
<div class="arena-panel" style="position: relative">
```

在段位列表 `</div>` 之后、`</template>` 之前，添加匹配按钮：

```html
      <!-- PVP 匹配按钮 -->
      <button
        v-if="store.playerData"
        class="arena-panel__match-btn"
        @click="handleStartMatch"
      >
        ⚔️ 开始匹配
      </button>
    </template>

    <!-- PVP 匹配覆盖层 -->
    <PvpMatchOverlay
      :visible="pvpStore.isMatching"
      :state="pvpStore.matchState"
      :opponent="pvpStore.opponent"
      :estimated="pvpStore.estimatedScore"
      @cancel="handleCancelMatch"
      @start-battle="handleStartBattle"
    />

    <!-- PVP 结算覆盖层 -->
    <PvpSettlementOverlay
      :visible="pvpStore.matchState === 'settling'"
      :result="pvpStore.scoreResult"
      :is-victory="(pvpStore.scoreResult?.scoreChange ?? 0) > 0"
      :wins="store.playerData?.wins ?? 0"
      :losses="store.playerData?.losses ?? 0"
      :win-rate="store.playerData?.winRate ?? 0"
      @close="handleCloseSettlement"
    />
  </div>
```

注意需要移除原来的 `</template>` 和 `</div>` 的对应闭合标签位置，确保结构正确。

- [ ] **Step 6: 添加匹配按钮样式**

在 `<style scoped>` 底部添加：

```css
/* ── 匹配按钮 ── */
.arena-panel__match-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent-blue), #7c5cfc);
  color: white;
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.arena-panel__match-btn:hover {
  opacity: 0.9;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/arena/ArenaPanel.vue
git commit -m "feat: integrate PVP matchmaking into ArenaPanel"
```

---

### Task 8: 修改 HomeView 支持 PVP 战斗流程

**Files:**
- Modify: `src/views/HomeView.vue`

HomeView 需要处理从 ArenaPanel 发起的 PVP 战斗和结束回调。

- [ ] **Step 1: 找到 ArenaPanel 使用位置并添加事件监听**

在 HomeView.vue 模板中找到：

```html
<ArenaPanel />
```

替换为：

```html
<ArenaPanel @battle-started="enterBattleView('arena')" />
```

- [ ] **Step 2: 修改 returnFromBattle 处理 PVP 结算**

找到 HomeView 中的 `returnFromBattle` 函数（或类似的战斗返回处理函数）。需要在返回 `arena` 视图时触发 PVP 结算。

在 `returnFromBattle` 函数或 `enterBattleView` 相关逻辑中，检查如果上一个视图是 `arena`，则需要在 BattleConsole 返回时通知 ArenaPanel 进行 PVP 结算。

查找 BattleConsole 组件的使用位置，在 `@return-view` 事件处理中添加 PVP 结算逻辑：

在 HomeView script 中找到 `returnFromBattle` 函数，修改为：

```typescript
/** 记录战斗来源视图 */
const battleSourceView = ref<string>('home')

/** 进入战斗视图 */
function enterBattleView(source: string) {
  battleSourceView.value = source
  centerView.value = 'battle'
}

/** 从战斗视图返回 */
async function returnFromBattle() {
  const source = battleSourceView.value
  if (source === 'arena') {
    // PVP 战斗结束，返回竞技场并触发结算
    centerView.value = 'arena'
    const battleStore = useBattleStore()
    const pvpStore = usePvpStore()
    if (pvpStore.matchState === 'in_battle' && battleStore.battleOutcome) {
      const won = battleStore.battleOutcome === 'victory'
      await pvpStore.settleBattle(won)
    }
  } else {
    centerView.value = source as CenterView
  }
}
```

注意：如果 `returnFromBattle` 和 `enterBattleView` 已经存在（参考已有的 team/dungeon 战斗模式），只需修改 `returnFromBattle` 添加 arena 分支即可。需要检查 `useBattleStore` 和 `usePvpStore` 是否已导入。

- [ ] **Step 3: 添加 import（如需要）**

在 HomeView.vue 的 `<script setup>` import 区域添加（如果尚未导入）：

```typescript
import { usePvpStore } from '../stores/pvp'
```

确保 `useBattleStore` 也已导入。

- [ ] **Step 4: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: connect PVP battle flow in HomeView"
```

---

### Task 9: 创建后端对接文档 + 更新开发方案 + 构建验证

**Files:**
- Create: `实时PVP匹配-后端对接文档.md`
- Modify: `开发方案.md` 第 534 行

- [ ] **Step 1: 创建后端对接文档**

创建 `实时PVP匹配-后端对接文档.md`：

```markdown
# 实时 PVP 匹配 - 后端对接文档

## 概述

PVP 匹配系统支持玩家发起竞技匹配，根据 Elo 积分寻找对手，战斗后结算积分变化。

---

## 1. API 接口

### 1.1 发起匹配

POST /arena/match

请求体：
```json
{
  "score": 2050
}
```

响应：
```json
{
  "code": 200,
  "message": "匹配成功",
  "data": {
    "characterId": "pvp-opp-001",
    "characterName": "火焰法师",
    "profession": "Mage",
    "level": 33,
    "tier": "diamond",
    "subTier": "III",
    "score": 2450
  }
}
```

### 1.2 提交战斗结算

POST /arena/settle

请求体：
```json
{
  "opponentId": "pvp-opp-001",
  "won": true
}
```

响应：
```json
{
  "code": 200,
  "message": "结算成功",
  "data": {
    "scoreChange": 35,
    "oldScore": 2050,
    "newScore": 2085,
    "tierChanged": false,
    "oldTier": { "tier": "platinum", "subTier": "II", "tierName": "◆ 铂金 II", "progress": 0.14, "remainingScore": 115 },
    "newTier": { "tier": "platinum", "subTier": "II", "tierName": "◆ 铂金 II", "progress": 0.48, "remainingScore": 81 }
  }
}
```

---

## 2. 积分算法

简化 Elo：
- 基础变化 ±25 分
- 积分差距调整 `(opponentScore - myScore) / 100`，范围 ±10
- 最终范围 ±15 ~ ±35

---

## 3. 前端 Mock 行为

| 功能 | Mock 实现 |
|:---|:---|
| 匹配搜索 | 3-8 秒随机延迟，从 6 人对手池选取 |
| 对手选取 | 优先积分接近的对手 |
| 对手属性 | 根据职业/等级生成战斗属性 |
| 积分结算 | 前端计算，更新 arena store |

---

## 4. 类型定义

参见 src/types/pvp.ts
```

- [ ] **Step 2: 更新开发方案第 534 行**

将 `| 实时 PVP 匹配（Elo 积分、WebSocket 双端同步） | P0 | 核心竞技玩法 |` 改为 `| 实时 PVP 匹配（Elo 积分、WebSocket 双端同步） | P0 | ✅ 已完成（匹配流程+本地模拟对战） | Elo积分、匹配动画、对手确认、AI对战、积分结算、后端对接文档 |`

- [ ] **Step 3: 运行构建验证**

```bash
cd "/Users/hyacinth/Desktop/project sword" && npm run build
```

Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 4: Commit**

```bash
git add 实时PVP匹配-后端对接文档.md 开发方案.md
git commit -m "docs: add PVP matchmaking backend doc and mark feature as completed"
```
