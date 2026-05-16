<template>
  <section class="battle-console" :class="{ 'battle-console--shake': screenShake }">
    <div v-if="!store.isBattleActive" class="battle-console__empty">
      <h2>暂无战斗</h2>
      <p>请从地图探索、副本或多人房间开始战斗。</p>
      <button type="button" class="battle-console__return" @click="$emit('return-view')">返回</button>
    </div>

    <template v-else>
      <header class="battle-console__header">
        <div class="battle-console__title">
          <span class="battle-console__eyebrow">{{ isDungeonBattle ? 'Dungeon Battle' : 'Wild Battle' }}</span>
          <h2>第 {{ store.round }} 回合</h2>
        </div>
        <div class="battle-console__header-actions">
          <span class="battle-console__phase" :class="store.phase">{{ phaseLabel }}</span>
          <button v-if="store.isBattleOver && !isDungeonBattle" type="button" class="battle-console__end" @click="handleBattleEnd">结束</button>
        </div>
      </header>

      <div class="battle-console__combat-grid">
        <div class="battle-console__field-column">
          <ActionOrderBar class="battle-console__order" :entries="store.battleState?.actionOrderPreview ?? []" />

          <div v-if="isBossMode" class="battle-console__boss-stack">
            <BossPhaseIndicator
              v-if="bossEnemy && bossConfig"
              :visible="true"
              :boss-name="bossEnemy.name"
              :current-phase="store.bossState?.currentPhase ?? 1"
              :total-phases="bossConfig.phases.length"
              :boss-hp="bossEnemy.stats.hp"
              :boss-max-hp="bossEnemy.stats.maxHp"
              :phase-changed="store.bossState?.phaseChanged ?? false"
            />

            <BossEnrageTimer
              v-if="bossConfig"
              :visible="true"
              :is-enraged="store.bossState?.isEnraged ?? false"
              :enrage-round="bossConfig.enrage.enrageRound"
              :current-round="store.bossState?.currentRound ?? 0"
              :attack-mult="bossConfig.enrage.attackMultiplier"
            />
          </div>

          <BattleFocusField
            class="battle-console__field"
            :combatants="store.combatants"
            :current-actor-uid="store.currentActor?.uid"
            :selected-target-uid="selectedTargetUid"
            :is-boss-mode="isBossMode"
            @select-target="selectedTargetUid = $event"
          />
        </div>

        <aside class="battle-console__tactics" aria-label="战术指令">
          <div class="battle-console__tactics-header">
            <span class="battle-console__tactics-label">战术指令</span>
            <span class="battle-console__tactics-state" :class="{ 'battle-console__tactics-state--active': store.waitingForPlayer }">
              {{ store.waitingForPlayer ? '等待出招' : '自动结算' }}
            </span>
          </div>

          <!-- 出招倒计时 -->
          <div v-if="store.waitingForPlayer" class="turn-timer">
            <div class="turn-timer__track">
              <div class="turn-timer__bar" :class="timerBarClass" :style="{ width: `${(turnTimer / TURN_TIMEOUT_SECONDS) * 100}%` }"></div>
            </div>
            <span class="turn-timer__text">{{ turnTimer }}s</span>
          </div>

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

          <div v-if="!store.waitingForPlayer" class="battle-console__status-card">
            <span class="battle-console__status-label">当前单位</span>
            <strong>{{ store.currentActor?.name ?? '等待行动' }}</strong>
            <span>{{ phaseLabel }}</span>
          </div>

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
        </aside>
      </div>

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

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
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

const emit = defineEmits<{
  close: []
  'return-view': []
}>()

const store = useBattleStore()
const dungeonStore = useDungeonStore()
const selectedTargetUid = ref<string | null>(null)
const isResolvingDungeonResult = ref(false)

// ── 出招倒计时 ──
const TURN_TIMEOUT_SECONDS = 30
const turnTimer = ref(TURN_TIMEOUT_SECONDS)
let timerInterval: ReturnType<typeof setInterval> | null = null

/**
 * 启动玩家出招倒计时。
 * @returns 无返回值。
 */
function startTurnTimer(): void {
  turnTimer.value = TURN_TIMEOUT_SECONDS
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (turnTimer.value > 0) {
      turnTimer.value--
    } else {
      handleAutoAction()
    }
  }, 1000)
}

/**
 * 停止并重置玩家出招倒计时。
 * @returns 无返回值。
 */
function stopTurnTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  turnTimer.value = TURN_TIMEOUT_SECONDS
}

/**
 * 在倒计时结束后自动选择一个可攻击目标并执行普攻。
 * @returns 无返回值。
 */
function handleAutoAction(): void {
  stopTurnTimer()
  const targets = store.availableTargets.filter(t => t.isAlive)
  if (targets.length === 0 || !store.currentActor) return
  const target = targets[Math.floor(Math.random() * targets.length)]
  handleAction({ type: 'attack', actorUid: store.currentActor.uid, targetUid: target.uid })
}

// 监听等待玩家状态，控制计时器
watch(() => store.waitingForPlayer, (waiting) => {
  if (waiting) {
    startTurnTimer()
  } else {
    stopTurnTimer()
  }
})

// 组件卸载时清理计时器
onUnmounted(() => {
  stopTurnTimer()
})

const isDungeonBattle = computed(() => dungeonStore.runState !== null)
const phaseLabel = computed(() => getPhaseLabel(store.phase))
const timerBarClass = computed(() => {
  if (turnTimer.value <= 5) return 'turn-timer__bar--danger'
  if (turnTimer.value <= 10) return 'turn-timer__bar--warning'
  return 'turn-timer__bar--safe'
})
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
  if (isResolvingDungeonResult.value) return

  isResolvingDungeonResult.value = true
  try {
    dungeonStore.handleFloorComplete()
    const result = await dungeonStore.startFloorBattle()
    if (!result.success) emit('return-view')
  } finally {
    isResolvingDungeonResult.value = false
  }
}

/**
 * 副本撤退或通关后领取奖励并返回来源视图。
 * @returns Promise，无业务返回值
 */
async function handleDungeonRetreat(): Promise<void> {
  if (isResolvingDungeonResult.value) return

  isResolvingDungeonResult.value = true
  try {
    if (store.battleOutcome === 'victory') {
      dungeonStore.handleFloorComplete()
    } else {
      dungeonStore.handleFloorDefeat()
    }
    await dungeonStore.claimRewardsAndExit()
    emit('return-view')
  } finally {
    isResolvingDungeonResult.value = false
  }
}

watch(() => store.battleState?.lastDamageResults, (results) => {
  if (results && results.length > 0) {
    const actorUid = store.currentActor?.uid
    triggerDamageAnimations(results, actorUid)
  }
})

watch(() => store.battleState?.lastBuffResults, (results) => {
  if (results && results.length > 0) {
    for (const result of results) {
      triggerBuffAnimation(result.targetUid, result.isDebuff)
    }
  }
})

watch(() => store.isBattleOver, (over) => {
  if (over) {
    const deadUnits = store.combatants.filter(unit => !unit.isAlive)
    for (const unit of deadUnits) {
      triggerDeathAnimation(unit.uid)
    }
  }
})
</script>

<style scoped>
.battle-console {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text-primary);
  overflow: visible;
  container-type: inline-size;
}

.battle-console__empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 32px 20px;
  border-radius: 16px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-subtle);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  text-align: center;
}

.battle-console__empty h2 {
  margin: 0;
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
}

.battle-console__empty p {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--text-muted);
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
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  flex-shrink: 0;
}

.battle-console__title {
  min-width: 0;
}

.battle-console__eyebrow {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.battle-console__header h2 {
  margin: 2px 0 0;
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
}

.battle-console__header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.battle-console__phase,
.battle-console__end,
.battle-console__return {
  border-radius: 980px;
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  font-size: var(--font-size-small);
  font-weight: 500;
}

.battle-console__phase {
  color: var(--accent-blue);
  background: rgba(0, 113, 227, 0.1);
}

.battle-console__end,
.battle-console__return {
  color: var(--button-text);
  background: var(--accent-blue);
  cursor: pointer;
}

.battle-console__end:hover,
.battle-console__return:hover {
  filter: brightness(1.1);
}

.battle-console__end:active,
.battle-console__return:active {
  transform: scale(0.98);
}

.battle-console__log {
  flex: 0 0 280px;
  min-height: 260px;
  overflow: visible;
}

.battle-console__log :deep(.log-entries) {
  max-height: none;
  overflow-y: scroll;
}

.battle-console__combat-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 12px;
  flex: 0 0 auto;
  min-height: 0;
}

.battle-console__field-column,
.battle-console__tactics,
.battle-console__boss-stack {
  min-width: 0;
  min-height: 0;
}

.battle-console__field-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.battle-console__field {
  flex: 0 0 auto;
}

.battle-console__boss-stack {
  display: grid;
  gap: 10px;
}

.battle-console__tactics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
  box-shadow: var(--shadow-subtle);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.battle-console__tactics :deep(.action-panel) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.battle-console__tactics-header,
.battle-console__status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.battle-console__tactics-label,
.battle-console__status-label {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.battle-console__tactics-state {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 980px;
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.battle-console__tactics-state--active {
  color: var(--accent-green);
  border-color: var(--accent-green);
}

.battle-console__status-card {
  align-items: flex-start;
  flex-direction: column;
  padding: 14px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-panel-light);
  box-shadow: var(--shadow-subtle);
}

.battle-console__status-card strong {
  font-size: var(--font-size-section);
  color: var(--text-primary);
}

.battle-console__status-card span:last-child {
  font-size: var(--font-size-small);
  color: var(--text-muted);
}

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

@media (max-width: 768px) {
  .battle-console__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .battle-console__header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 375px) {
  .battle-console__empty {
    padding: 24px 16px;
  }

  .battle-console__header {
    padding: 10px 12px;
  }

  .battle-console__tactics {
    padding: 10px;
  }

  .turn-timer {
    padding: 8px 10px;
  }

  .battle-console__phase,
  .battle-console__end,
  .battle-console__return {
    padding: 5px 10px;
    font-size: var(--font-size-caption);
  }
}

@media (max-width: 1180px) {
  .battle-console__combat-grid {
    grid-template-columns: 1fr;
  }

  .battle-console__tactics {
    overflow: visible;
  }
}

@container (max-width: 900px) {
  .battle-console__combat-grid {
    grid-template-columns: 1fr;
  }

  .battle-console__tactics {
    overflow: visible;
  }
}

@media (max-width: 960px) {
  .battle-console {
    height: auto;
    overflow: visible;
  }

  .battle-console__log {
    flex-basis: 280px;
  }
}

/* ── 出招倒计时 ── */
.turn-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-subtle);
}

.turn-timer__track {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.08);
}

.turn-timer__bar {
  height: 6px;
  border-radius: 3px;
  transition: width 0.3s linear, background-color 0.3s ease;
}

.turn-timer__bar--safe {
  background: var(--accent-green);
}

.turn-timer__bar--warning {
  background: var(--accent-gold);
}

.turn-timer__bar--danger {
  background: var(--accent-red);
  animation: timer-pulse 0.5s infinite;
}

@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.turn-timer__text {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-muted);
  min-width: 28px;
  text-align: right;
}

/* ── 深色模式 ── */
[data-theme='dark'] .battle-console__phase {
  background: rgba(0, 113, 227, 0.18);
}
</style>
