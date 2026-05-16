# Inline Battle Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将战斗从独立 `/battle` 跳转改为首页中栏内嵌战斗台，并重做为“焦点目标 + 两侧队列”的现代网游战斗布局。

**Architecture:** 保留现有 `useBattleStore`、`useDungeonStore` 和战斗引擎，只移动 UI 容器和入口交互。新增可内嵌 `BattleConsole.vue` 和焦点战场 `BattleFocusField.vue`，让 `HomeView` 负责战斗来源与返回视图，地图/副本/多人房间只负责启动战斗并 emit。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vue Router、CSS scoped、现有 Liquid Glass 设计变量、lucide-vue-next。

---

## File Structure

- Create `src/components/battle/BattleFocusField.vue`
  - 负责焦点目标 + 我方队列 + 敌方队列展示。
  - 只接收 `Combatant[]`、当前行动者、当前选中目标，向外发出目标选择事件。
- Create `src/components/battle/BattleConsole.vue`
  - 负责内嵌战斗台容器：标题栏、行动顺序、焦点战场、行动区、日志、结算层。
  - 从 `useBattleStore`、`useDungeonStore` 读取状态，向父层 emit `close`、`return-view`。
- Modify `src/components/battle/BattleActionPanel.vue`
  - 增加 `modelValue` / `update:modelValue`，让焦点战场和行动面板共享目标选择。
  - 保持旧调用兼容。
- Modify `src/views/HomeView.vue`
  - `CenterView` 增加 `battle`。
  - 新增 `battleReturnView`，接收子组件 `battle-started` 事件后切到战斗台。
  - 在中栏渲染 `BattleConsole`。
- Modify `src/components/map/WorldMapPanel.vue`
  - 启动野外战斗后 emit `battle-started`，删除主流程 `router.push({ name: 'battle' })`。
- Modify `src/components/dungeon/DungeonPanel.vue`
  - 启动单人副本楼层战斗后 emit `battle-started`。
- Modify `src/components/team/DungeonRoomPanel.vue`
  - 启动多人副本战斗后 emit `battle-started`。
- Modify `src/views/BattleView.vue`
  - 保留调试/兼容入口，薄封装 `BattleConsole` 或显示“请从首页进入战斗”的空态。
- Optional modify `src/assets/styles/home.css`
  - 为 `centerView === 'battle'` 补充中栏拉伸、移动端布局规则。

## Task 1: BattleActionPanel Target Sync

**Files:**
- Modify: `src/components/battle/BattleActionPanel.vue`

- [ ] **Step 1: Add model props and emits**

Update props and emits:

```ts
const props = defineProps<{
  visible: boolean
  actorUid: string
  actorName: string
  phase: BattlePhase
  skills: BattleSkill[]
  targets: Combatant[]
  cooldowns: Record<string, number>
  currentMp: number
  modelValue?: string | null
}>()

const emit = defineEmits<{
  action: [action: BattleAction]
  'update:modelValue': [targetUid: string | null]
}>()
```

- [ ] **Step 2: Replace direct selected-target writes with helper**

Add a function-level comment as required by `AGENTS.md`:

```ts
/**
 * 更新当前行动目标，并同步给外层战斗焦点区域。
 * @param targetUid - 目标战斗单位 UID
 * @returns 无返回值
 */
function setSelectedTarget(targetUid: string | null): void {
  selectedTargetUid.value = targetUid
  emit('update:modelValue', targetUid)
}
```

Change target button click:

```vue
@click="setSelectedTarget(target.uid)"
```

- [ ] **Step 3: Watch external model value**

Add:

```ts
watch(() => props.modelValue, (targetUid) => {
  if (targetUid !== undefined && targetUid !== selectedTargetUid.value) {
    selectedTargetUid.value = targetUid
  }
})
```

- [ ] **Step 4: Keep first target auto-selection compatible**

Change the existing targets watcher body to call the helper:

```ts
if (targets.length > 0 && !targets.find(t => t.uid === selectedTargetUid.value)) {
  setSelectedTarget(targets[0].uid)
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

Expected: build exits `0`; no TypeScript errors from new emits or watcher signatures.

## Task 2: Create BattleFocusField

**Files:**
- Create: `src/components/battle/BattleFocusField.vue`

- [ ] **Step 1: Create component template**

Implement this structure:

```vue
<template>
  <section class="battle-focus-field" :class="{ 'battle-focus-field--boss': isBossMode }">
    <div class="battle-focus-field__queue battle-focus-field__queue--ally">
      <button
        v-for="ally in allies"
        :key="ally.uid"
        class="battle-focus-unit battle-focus-unit--ally"
        :class="{ 'battle-focus-unit--active': ally.uid === currentActorUid, 'battle-focus-unit--dead': !ally.isAlive }"
        type="button"
        disabled
      >
        <span class="battle-focus-unit__name">{{ ally.name }}</span>
        <span class="battle-focus-unit__type">{{ getTypeLabel(ally.type) }}</span>
        <span class="battle-focus-unit__hp">
          <span :style="{ width: getHpPercent(ally) + '%' }"></span>
        </span>
      </button>
    </div>

    <button
      v-if="focusTarget"
      type="button"
      class="battle-focus-target"
      :class="{ 'battle-focus-target--active': focusTarget.uid === currentActorUid, 'battle-focus-target--dead': !focusTarget.isAlive }"
      @click="$emit('select-target', focusTarget.uid)"
    >
      <span class="battle-focus-target__eyebrow">{{ isBossMode ? 'Boss Target' : 'Focus Target' }}</span>
      <strong class="battle-focus-target__name">{{ focusTarget.name }}</strong>
      <span class="battle-focus-target__meta">{{ getTypeLabel(focusTarget.type) }}</span>
      <span class="battle-focus-target__hp">
        <span :style="{ width: getHpPercent(focusTarget) + '%' }"></span>
      </span>
      <span class="battle-focus-target__hp-text">{{ focusTarget.stats.hp }} / {{ focusTarget.stats.maxHp }}</span>
    </button>

    <div v-else class="battle-focus-target battle-focus-target--empty">
      <span>暂无可选目标</span>
    </div>

    <div class="battle-focus-field__queue battle-focus-field__queue--enemy">
      <button
        v-for="enemy in sideEnemies"
        :key="enemy.uid"
        class="battle-focus-unit battle-focus-unit--enemy"
        :class="{ 'battle-focus-unit--selected': enemy.uid === selectedTargetUid, 'battle-focus-unit--active': enemy.uid === currentActorUid, 'battle-focus-unit--dead': !enemy.isAlive }"
        type="button"
        @click="$emit('select-target', enemy.uid)"
      >
        <span class="battle-focus-unit__name">{{ enemy.name }}</span>
        <span class="battle-focus-unit__type">{{ getTypeLabel(enemy.type) }}</span>
        <span class="battle-focus-unit__hp">
          <span :style="{ width: getHpPercent(enemy) + '%' }"></span>
        </span>
      </button>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Add script with documented helpers**

```ts
<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant, CombatantType } from '../../types/battle'

const props = defineProps<{
  combatants: Combatant[]
  currentActorUid?: string
  selectedTargetUid?: string | null
  isBossMode?: boolean
}>()

defineEmits<{
  'select-target': [targetUid: string]
}>()

const allies = computed(() => props.combatants.filter(unit => unit.side === 'ally'))
const enemies = computed(() => props.combatants.filter(unit => unit.side === 'enemy'))

const focusTarget = computed(() => {
  const selected = enemies.value.find(unit => unit.uid === props.selectedTargetUid)
  if (selected) return selected
  return enemies.value.find(unit => unit.isAlive) ?? enemies.value[0] ?? null
})

const sideEnemies = computed(() => enemies.value.filter(unit => unit.uid !== focusTarget.value?.uid))

/**
 * 计算战斗单位当前生命百分比。
 * @param combatant - 战斗单位
 * @returns 0 到 100 的生命百分比
 */
function getHpPercent(combatant: Combatant): number {
  if (combatant.stats.maxHp <= 0) return 0
  return Math.max(0, Math.min(100, (combatant.stats.hp / combatant.stats.maxHp) * 100))
}

/**
 * 获取战斗单位类型的中文标签。
 * @param type - 战斗单位类型
 * @returns 类型标签
 */
function getTypeLabel(type: CombatantType): string {
  if (type === 'player') return '角色'
  if (type === 'pet') return '战宠'
  return '敌人'
}
</script>
```

- [ ] **Step 3: Add scoped CSS**

Use existing `DESIGN.md` variables only. Required selectors:

```css
.battle-focus-field {
  display: grid;
  grid-template-columns: minmax(96px, 0.82fr) minmax(180px, 1.45fr) minmax(96px, 0.82fr);
  gap: 10px;
  align-items: stretch;
  min-height: 260px;
}

.battle-focus-field__queue {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.battle-focus-unit,
.battle-focus-target {
  border: 1px solid var(--border-light);
  background: var(--bg-panel-light);
  color: var(--text-primary);
  box-shadow: var(--shadow-subtle);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
}

.battle-focus-unit {
  min-height: 64px;
  border-radius: 14px;
  padding: 9px;
  text-align: left;
  display: grid;
  gap: 6px;
  cursor: pointer;
}

.battle-focus-unit:disabled {
  cursor: default;
}

.battle-focus-target {
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  display: grid;
  align-content: center;
  gap: 8px;
  cursor: pointer;
}
```

Complete CSS with selected, active, dead, HP fill, and mobile rules:

```css
.battle-focus-target__eyebrow,
.battle-focus-unit__type {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.battle-focus-target__name {
  font-size: var(--font-size-subheading);
  font-weight: 600;
}

.battle-focus-unit__name {
  font-size: var(--font-size-small);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.battle-focus-unit__hp,
.battle-focus-target__hp {
  height: 8px;
  border-radius: 980px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.battle-focus-unit__hp > span,
.battle-focus-target__hp > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-red), var(--accent-gold));
}

.battle-focus-unit--ally .battle-focus-unit__hp > span {
  background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
}

.battle-focus-unit--selected,
.battle-focus-target--active,
.battle-focus-unit--active {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-card), 0 0 0 4px var(--accent-blue-glow);
}

.battle-focus-unit--dead,
.battle-focus-target--dead {
  opacity: 0.52;
  filter: grayscale(0.45);
}

@media (max-width: 720px) {
  .battle-focus-field {
    grid-template-columns: 1fr;
  }

  .battle-focus-field__queue {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 3: Create BattleConsole

**Files:**
- Create: `src/components/battle/BattleConsole.vue`

- [ ] **Step 1: Move battle runtime script from BattleView**

Create a component that imports:

```ts
import { computed, ref, watch } from 'vue'
import { BattlePhase } from '../../types/battle'
import type { BattleAction } from '../../types/battle'
import { useBattleStore } from '../../stores/battle'
import { useDungeonStore } from '../../stores/dungeon'
import { triggerDamageAnimations, triggerBuffAnimation, triggerDeathAnimation, screenShake } from '../../utils/battleAnimation'
import ActionOrderBar from './ActionOrderBar.vue'
import BattleActionPanel from './BattleActionPanel.vue'
import BattleFocusField from './BattleFocusField.vue'
import BattleLog from './BattleLog.vue'
import BattleResultOverlay from './BattleResultOverlay.vue'
import BossEnrageTimer from './BossEnrageTimer.vue'
import BossPhaseIndicator from './BossPhaseIndicator.vue'
import ReviveButton from './ReviveButton.vue'
import DungeonFloorResultOverlay from '../dungeon/DungeonFloorResultOverlay.vue'
import { getBossConfig } from '../../config/boss_config'
import { getDeadAllies } from '../../utils/bossMechanics'
```

Define emits:

```ts
const emit = defineEmits<{
  close: []
  'return-view': []
}>()
```

- [ ] **Step 2: Add documented phase label helper**

```ts
/**
 * 获取当前战斗阶段中文标签。
 * @param phase - 战斗状态机阶段
 * @returns 阶段中文名称
 */
function getPhaseLabel(phase: BattlePhase): string {
  switch (phase) {
    case BattlePhase.IDLE: return '空闲'
    case BattlePhase.ROUND_START: return '回合开始'
    case BattlePhase.BUFF_SETTLEMENT: return 'Buff/Debuff 结算'
    case BattlePhase.ACTION_SELECT: return '行动选择'
    case BattlePhase.DAMAGE_CALCULATION: return '伤害计算'
    case BattlePhase.DODGE_CRIT_CHECK: return '闪避/暴击判定'
    case BattlePhase.SETTLEMENT: return '结算'
    case BattlePhase.ROUND_END: return '回合结束'
    case BattlePhase.BATTLE_END: return '战斗结束'
    default: return ''
  }
}
```

- [ ] **Step 3: Add computed state**

Use these computed values:

```ts
const store = useBattleStore()
const dungeonStore = useDungeonStore()
const selectedTargetUid = ref<string | null>(null)

const isDungeonBattle = computed(() => dungeonStore.runState !== null)
const phaseLabel = computed(() => getPhaseLabel(store.phase))
const bossEnemy = computed(() => store.combatants.find(unit => unit.side === 'enemy'))
const bossConfig = computed(() => bossEnemy.value ? getBossConfig(bossEnemy.value.sourceId) : null)
const isBossMode = computed(() => store.isBossFight || Boolean(bossConfig.value))
const deadAllies = computed(() => store.battleState ? getDeadAllies(store.battleState) : [])
const playerCombatant = computed(() => store.combatants.find(unit => unit.type === 'player'))
const dungeonFloorOutcome = computed<'victory' | 'defeat'>(() => store.battleOutcome === 'victory' ? 'victory' : 'defeat')
const currentFloorRewards = computed(() => store.battleRewards)
const latestFloorMemberDrops = computed(() => {
  const history = dungeonStore.runState?.floorHistory ?? []
  return history[history.length - 1]?.memberDrops
})
```

- [ ] **Step 4: Add documented action handlers**

Implement:

```ts
/**
 * 提交玩家选择的战斗行动。
 * @param action - 玩家行动
 * @returns Promise，无业务返回值
 */
async function handleAction(action: BattleAction): Promise<void> {
  await store.submitAction(action)
}

/**
 * 复活已死亡的友方单位。
 * @param targetUid - 需要复活的友方单位 UID
 * @returns Promise，无业务返回值
 */
async function handleRevive(targetUid: string): Promise<void> {
  await store.submitAction({ type: 'revive', actorUid: store.currentPlayer?.uid || '', targetUid })
}

/**
 * 结束普通战斗并通知首页返回来源视图。
 * @returns Promise，无业务返回值
 */
async function handleBattleEnd(): Promise<void> {
  await store.finishBattle()
  emit('return-view')
}

/**
 * 副本楼层胜利后进入下一层战斗。
 * @returns Promise，无业务返回值
 */
async function handleDungeonContinue(): Promise<void> {
  dungeonStore.handleFloorComplete()
  const result = await dungeonStore.startFloorBattle()
  if (!result.success) emit('return-view')
}

/**
 * 副本撤退或通关后领取奖励并返回来源视图。
 * @returns Promise，无业务返回值
 */
async function handleDungeonRetreat(): Promise<void> {
  if (store.battleOutcome === 'victory') {
    dungeonStore.handleFloorComplete()
  }
  await dungeonStore.claimRewardsAndExit()
  emit('return-view')
}
```

- [ ] **Step 5: Add watchers from BattleView**

Copy existing watchers for `lastDamageResults`, `lastBuffResults`, and `store.isBattleOver`. Keep the dungeon defeat logic:

```ts
watch(() => store.isBattleOver, (over) => {
  if (over) {
    const deadUnits = store.combatants.filter(unit => !unit.isAlive)
    for (const unit of deadUnits) {
      triggerDeathAnimation(unit.uid)
    }
    if (isDungeonBattle.value && store.battleOutcome !== 'victory') {
      dungeonStore.handleFloorDefeat()
    }
  }
})
```

- [ ] **Step 6: Add template**

Use this layout:

```vue
<template>
  <section class="battle-console" :class="{ 'battle-console--shake': screenShake }">
    <div v-if="!store.isBattleActive" class="battle-console__empty">
      <h2>暂无战斗</h2>
      <p>请从地图探索、副本或多人房间开始战斗。</p>
      <button type="button" class="battle-console__return" @click="$emit('return-view')">返回</button>
    </div>

    <template v-else>
      <header class="battle-console__header">
        <div>
          <span class="battle-console__eyebrow">{{ isDungeonBattle ? 'Dungeon Battle' : 'Wild Battle' }}</span>
          <h2>第 {{ store.round }} 回合</h2>
        </div>
        <div class="battle-console__header-actions">
          <span class="battle-console__phase" :class="store.phase">{{ phaseLabel }}</span>
          <button v-if="store.isBattleOver" type="button" class="battle-console__end" @click="handleBattleEnd">结束</button>
        </div>
      </header>

      <ActionOrderBar :entries="store.battleState?.actionOrderPreview ?? []" />

      <BossPhaseIndicator
        v-if="isBossMode && bossEnemy && bossConfig"
        :visible="true"
        :boss-name="bossEnemy.name"
        :current-phase="store.bossState?.currentPhase ?? 1"
        :total-phases="bossConfig.phases.length"
        :boss-hp="bossEnemy.stats.hp"
        :boss-max-hp="bossEnemy.stats.maxHp"
        :phase-changed="store.bossState?.phaseChanged ?? false"
      />

      <BossEnrageTimer
        v-if="isBossMode && bossConfig"
        :visible="true"
        :is-enraged="store.bossState?.isEnraged ?? false"
        :enrage-round="bossConfig.enrage.enrageRound"
        :current-round="store.bossState?.currentRound ?? 0"
        :attack-mult="bossConfig.enrage.attackMultiplier"
      />

      <BattleFocusField
        :combatants="store.combatants"
        :current-actor-uid="store.currentActor?.uid"
        :selected-target-uid="selectedTargetUid"
        :is-boss-mode="isBossMode"
        @select-target="selectedTargetUid = $event"
      />

      <BattleActionPanel
        v-model="selectedTargetUid"
        :visible="store.waitingForPlayer"
        :actor-uid="store.currentActor?.uid ?? ''"
        :actor-name="store.currentActor?.name ?? ''"
        :phase="store.phase"
        :skills="store.currentActor?.skills ?? []"
        :targets="store.availableTargets"
        :cooldowns="store.currentActor?.cooldowns ?? {}"
        :current-mp="store.currentActor?.stats.mp ?? 0"
        @action="handleAction"
      />

      <ReviveButton
        v-if="isBossMode && bossConfig && store.waitingForPlayer"
        :visible="true"
        :dead-allies="deadAllies"
        :current-mp="playerCombatant?.stats.mp ?? 0"
        :mp-cost="bossConfig.revive.mpCost"
        :revive-count="store.bossState?.reviveCount ?? 0"
        :max-revives="bossConfig.revive.maxRevives"
        @revive="handleRevive"
      />

      <BattleLog class="battle-console__log" :entries="store.log" :current-round="store.round" />

      <BattleResultOverlay
        v-if="!isDungeonBattle"
        :visible="store.isBattleOver"
        :outcome="store.battleOutcome"
        :rewards="store.battleRewards"
        :statistics="store.battleStatistics"
        @confirm="handleBattleEnd"
      />

      <DungeonFloorResultOverlay
        v-if="isDungeonBattle && dungeonStore.runState"
        :visible="store.isBattleOver"
        :floor-number="dungeonStore.runState.currentFloor"
        :total-floors="dungeonStore.runState.totalFloors"
        :is-last-floor="dungeonStore.isLastFloor"
        :outcome="dungeonFloorOutcome"
        :floor-rewards="currentFloorRewards"
        :accumulated-rewards="dungeonStore.runState.accumulatedRewards"
        :is-elite="dungeonStore.currentConfig?.difficulty === 'elite'"
        :member-drops="latestFloorMemberDrops"
        @continue="handleDungeonContinue"
        @retreat="handleDungeonRetreat"
      />
    </template>
  </section>
</template>
```

- [ ] **Step 7: Add scoped CSS**

Use `DESIGN.md` variables. Include:

```css
.battle-console {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.battle-console__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-subtle);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
}

.battle-console__eyebrow {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.battle-console__header h2 {
  margin: 2px 0 0;
  font-size: var(--font-size-section);
  color: var(--text-primary);
}

.battle-console__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.battle-console__phase,
.battle-console__end,
.battle-console__return {
  border-radius: 980px;
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  font-size: var(--font-size-small);
}

.battle-console__phase {
  color: var(--accent-blue);
  background: rgba(0, 113, 227, 0.1);
}

.battle-console__end {
  color: var(--button-text);
  background: var(--accent-blue);
  cursor: pointer;
}

.battle-console__log {
  min-height: 150px;
  max-height: 220px;
}
```

Add shake and mobile rules:

```css
.battle-console--shake {
  animation: battle-console-shake 0.3s ease-out;
}

@keyframes battle-console-shake {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 2px); }
  50% { transform: translate(3px, -2px); }
  75% { transform: translate(-1px, 1px); }
  100% { transform: translate(0, 0); }
}

@media (max-width: 720px) {
  .battle-console__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .battle-console__header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 4: Wire HomeView Battle Center

**Files:**
- Modify: `src/views/HomeView.vue`
- Modify: `src/assets/styles/home.css`

- [ ] **Step 1: Import BattleConsole**

Add:

```ts
import BattleConsole from '../components/battle/BattleConsole.vue'
```

- [ ] **Step 2: Extend CenterView type**

Change:

```ts
type CenterView = 'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team' | 'leaderboard' | 'arena'
```

to:

```ts
type CenterView = 'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team' | 'leaderboard' | 'arena' | 'battle'
type BattleReturnView = Exclude<CenterView, 'home' | 'battle'>
```

- [ ] **Step 3: Add return-view state and helpers**

Add:

```ts
const battleReturnView = ref<BattleReturnView>('map')

/**
 * 切换到内嵌战斗视图，并记录战斗结束后的返回位置。
 * @param returnView - 战斗结束后要恢复的中栏视图
 * @returns 无返回值
 */
function enterBattleView(returnView: BattleReturnView): void {
  battleReturnView.value = returnView
  centerView.value = 'battle'
}

/**
 * 从内嵌战斗视图回到最近的业务来源视图。
 * @returns 无返回值
 */
function returnFromBattle(): void {
  centerView.value = battleReturnView.value
}
```

- [ ] **Step 4: Add BattleConsole branch before map/dungeon branches**

In template inside `.game-center`, add before map view:

```vue
<UiPanel v-if="centerView === 'battle'" class="game-main game-main--battle" stretch>
  <BattleConsole @return-view="returnFromBattle" />
</UiPanel>
```

Then change the existing first map branch to `v-else-if`.

- [ ] **Step 5: Listen for battle-started events**

Update children:

```vue
<WorldMapPanel @back="centerView = 'home'" @open-dungeon="handleOpenDungeon" @battle-started="enterBattleView('map')" />
<DungeonPanel :area-id="selectedAreaId" @back="centerView = 'map'" @battle-started="enterBattleView('dungeon')" />
<TeamPanel @battle-started="enterBattleView('team')" />
```

If `TeamPanel` does not currently forward `battle-started`, add that in Task 7.

- [ ] **Step 6: Avoid bottom nav setting invalid battle view**

No `battle` item should be added to `bottomNavItems`. Existing `Exclude<CenterView, 'home' | 'dungeon'>` must become:

```ts
const bottomNavItems: { value: Exclude<CenterView, 'home' | 'dungeon' | 'battle'>; label: string; icon: Component }[] = [
```

- [ ] **Step 7: Add battle-specific CSS**

In `src/assets/styles/home.css`:

```css
.game-main--battle {
  align-items: stretch;
  justify-content: flex-start;
  text-align: left;
  overflow: hidden;
}

.game-main--battle > .battle-console {
  flex: 1;
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 5: Replace Map And Dungeon Route Pushes

**Files:**
- Modify: `src/components/map/WorldMapPanel.vue`
- Modify: `src/components/dungeon/DungeonPanel.vue`

- [ ] **Step 1: Update WorldMapPanel emits**

Find existing `defineEmits` and include:

```ts
const emit = defineEmits<{
  back: []
  openDungeon: [areaId: string]
  'battle-started': []
}>()
```

Remove `useRouter` import and `const router = useRouter()` if no longer used.

- [ ] **Step 2: Emit instead of pushing battle route in WorldMapPanel**

Change:

```ts
if (result.success) {
  router.push({ name: 'battle' })
} else {
  showToast(result.message, 'error')
}
```

to:

```ts
if (result.success) {
  emit('battle-started')
} else {
  showToast(result.message, 'error')
}
```

- [ ] **Step 3: Update DungeonPanel emits**

Include:

```ts
const emit = defineEmits<{
  back: []
  'battle-started': []
}>()
```

Remove `useRouter` import and `const router = useRouter()` if no longer used.

- [ ] **Step 4: Emit instead of pushing battle route in DungeonPanel**

Change:

```ts
if (battleResult.success) {
  router.push({ name: 'battle' })
}
```

to:

```ts
if (battleResult.success) {
  emit('battle-started')
}
```

- [ ] **Step 5: Verify no direct battle pushes remain in these files**

Run:

```bash
rg -n "router\\.push\\(\\{ name: 'battle' \\}\\)|router\\.push\\('/battle'\\)" src/components/map src/components/dungeon
```

Expected: no matches.

- [ ] **Step 6: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 6: Wire Team / Dungeon Room Battle Events

**Files:**
- Modify: `src/components/team/TeamPanel.vue`
- Modify: `src/components/team/DungeonRoomPanel.vue`

- [ ] **Step 1: Inspect TeamPanel room rendering**

Run:

```bash
rg -n "DungeonRoomPanel|defineEmits|battle-started" src/components/team/TeamPanel.vue src/components/team/DungeonRoomPanel.vue
```

Expected: identify where `DungeonRoomPanel` is rendered.

- [ ] **Step 2: Add battle-started emit to DungeonRoomPanel**

Add:

```ts
const emit = defineEmits<{
  'battle-started': []
}>()
```

If `DungeonRoomPanel` already has emits, merge this event into the existing type.

- [ ] **Step 3: Replace route push in DungeonRoomPanel**

Change:

```ts
if (battleResult.success) {
  router.push({ name: 'battle' })
} else {
  alert(battleResult.message)
}
```

to:

```ts
if (battleResult.success) {
  emit('battle-started')
} else {
  alert(battleResult.message)
}
```

Remove `useRouter` import and `const router = useRouter()` if unused.

- [ ] **Step 4: Forward event from TeamPanel**

In `TeamPanel.vue`, add an emit:

```ts
const emit = defineEmits<{
  'battle-started': []
}>()
```

Forward from room component:

```vue
<DungeonRoomPanel @battle-started="emit('battle-started')" />
```

If `DungeonRoomPanel` receives props/events already, keep them and only add the new event.

- [ ] **Step 5: Verify no battle route push remains in team components**

Run:

```bash
rg -n "router\\.push\\(\\{ name: 'battle' \\}\\)|router\\.push\\('/battle'\\)" src/components/team
```

Expected: no matches.

- [ ] **Step 6: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 7: Convert BattleView To Compatibility Wrapper

**Files:**
- Modify: `src/views/BattleView.vue`

- [ ] **Step 1: Replace large route page with wrapper**

Replace the template/script/style with:

```vue
<template>
  <main class="battle-route-shell">
    <BattleConsole @return-view="goHome" />
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BattleConsole from '../components/battle/BattleConsole.vue'

const router = useRouter()

/**
 * 从兼容战斗路由返回首页。
 * @returns 无返回值
 */
function goHome(): void {
  router.push({ name: 'home' })
}
</script>

<style scoped>
.battle-route-shell {
  min-height: 100vh;
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 28px 40px;
}

@media (max-width: 720px) {
  .battle-route-shell {
    padding: 16px 12px 28px;
  }
}
</style>
```

- [ ] **Step 2: Verify removed duplicated logic**

Run:

```bash
rg -n "handleStartBattle|phaseSteps|warriorSkills|DamageBreakdownPanel" src/views/BattleView.vue
```

Expected: no matches.

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: build exits `0`.

## Task 8: Final Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Search for remaining battle route pushes**

Run:

```bash
rg -n "router\\.push\\(\\{ name: 'battle' \\}\\)|router\\.push\\('/battle'\\)|path: '/battle'" src
```

Expected: only the router route definition may remain. No component should push to battle route.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build exits `0`.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a localhost URL. Keep the process running for browser QA.

- [ ] **Step 4: Browser QA desktop**

Open `/` in the browser with mock mode enabled.

Check:

- From 地图, click 探索. Expected: center panel becomes battle console; URL remains `/`.
- Select an enemy side unit. Expected: center focus target changes; action panel target follows.
- Finish a normal battle. Expected: result overlay confirms; after confirm, center returns to 地图.
- Enter a single dungeon. Expected: center battle console opens; URL remains `/`.
- Win a floor. Expected: dungeon floor result overlay appears inside battle console.

- [ ] **Step 5: Browser QA mobile**

Use a viewport below `720px`.

Check:

- Battle console does not create horizontal scroll.
- Focus target, side queues, action buttons, and log do not overlap.
- Header actions wrap cleanly.

- [ ] **Step 6: Commit implementation**

If all checks pass:

```bash
git add src/components/battle/BattleActionPanel.vue src/components/battle/BattleFocusField.vue src/components/battle/BattleConsole.vue src/views/HomeView.vue src/assets/styles/home.css src/components/map/WorldMapPanel.vue src/components/dungeon/DungeonPanel.vue src/components/team/TeamPanel.vue src/components/team/DungeonRoomPanel.vue src/views/BattleView.vue
git commit -m "feat: embed battle console in home view"
```

Expected: commit succeeds with only frontend files staged.

## Self-Review

- Spec coverage: the plan covers the内嵌中栏模式、焦点目标 + 两侧队列、地图/副本/多人房间入口、返回来源视图、移动端不溢出、构建和浏览器验证。
- Placeholder scan: no placeholder markers or unspecified edge handling remains.
- Type consistency: `battle-started` is consistently emitted upward; `selectedTargetUid` uses `string | null`; `BattleConsole` emits `return-view` for HomeView and BattleView wrapper.
