<template>
  <section class="battle-focus-field" :class="{ 'battle-focus-field--boss': isBossMode }">
    <div class="battle-focus-field__queue battle-focus-field__queue--ally" aria-label="我方队列">
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
          <span class="battle-focus-unit__hp-fill" :style="{ width: getHpPercent(ally) + '%' }"></span>
        </span>
      </button>
    </div>

    <button
      v-if="focusTarget"
      class="battle-focus-target"
      :class="{ 'battle-focus-target--active': focusTarget.uid === currentActorUid, 'battle-focus-target--selected': focusTarget.uid === selectedTargetUid, 'battle-focus-target--dead': !focusTarget.isAlive }"
      type="button"
      :disabled="!focusTarget.isAlive"
      @click="selectTarget(focusTarget.uid)"
    >
      <span class="battle-focus-target__eyebrow">焦点目标</span>
      <span class="battle-focus-target__name">{{ focusTarget.name }}</span>
      <span class="battle-focus-target__meta">{{ getTypeLabel(focusTarget.type) }}</span>
      <span class="battle-focus-target__hp">
        <span class="battle-focus-target__hp-fill" :style="{ width: getHpPercent(focusTarget) + '%' }"></span>
      </span>
      <span class="battle-focus-target__hp-text">{{ focusTarget.stats.hp }} / {{ focusTarget.stats.maxHp }}</span>
    </button>

    <div v-else class="battle-focus-target battle-focus-target--empty">
      <span class="battle-focus-target__eyebrow">焦点目标</span>
      <span class="battle-focus-target__name">暂无敌人</span>
    </div>

    <div class="battle-focus-field__queue battle-focus-field__queue--enemy" aria-label="敌方队列">
      <button
        v-for="enemy in sideEnemies"
        :key="enemy.uid"
        class="battle-focus-unit battle-focus-unit--enemy"
        :class="{ 'battle-focus-unit--active': enemy.uid === currentActorUid, 'battle-focus-unit--selected': enemy.uid === selectedTargetUid, 'battle-focus-unit--dead': !enemy.isAlive }"
        type="button"
        :disabled="!enemy.isAlive"
        @click="selectTarget(enemy.uid)"
      >
        <span class="battle-focus-unit__name">{{ enemy.name }}</span>
        <span class="battle-focus-unit__type">{{ getTypeLabel(enemy.type) }}</span>
        <span class="battle-focus-unit__hp">
          <span class="battle-focus-unit__hp-fill" :style="{ width: getHpPercent(enemy) + '%' }"></span>
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant, CombatantType } from '../../types/battle'

const props = defineProps<{
  combatants: Combatant[]
  currentActorUid?: string
  selectedTargetUid?: string | null
  isBossMode?: boolean
}>()

const emit = defineEmits<{
  'select-target': [targetUid: string]
}>()

const allies = computed(() => props.combatants.filter(combatant => combatant.side === 'ally'))
const enemies = computed(() => props.combatants.filter(combatant => combatant.side === 'enemy'))

const focusTarget = computed(() => {
  const selectedEnemy = enemies.value.find(enemy => enemy.uid === props.selectedTargetUid)
  if (selectedEnemy) return selectedEnemy

  const aliveEnemy = enemies.value.find(enemy => enemy.isAlive)
  if (aliveEnemy) return aliveEnemy

  return enemies.value[0] ?? null
})

const sideEnemies = computed(() => enemies.value.filter(enemy => enemy.uid !== focusTarget.value?.uid))

/**
 * 计算参战单位当前 HP 百分比。
 * @param combatant 需要计算生命值比例的参战单位。
 * @returns 介于 0 到 100 之间的 HP 百分比。
 */
function getHpPercent(combatant: Combatant): number {
  if (combatant.stats.maxHp <= 0) return 0
  return Math.max(0, Math.min(100, (combatant.stats.hp / combatant.stats.maxHp) * 100))
}

/**
 * 获取参战单位类型的中文展示标签。
 * @param type 参战单位类型。
 * @returns 类型对应的中文标签。
 */
function getTypeLabel(type: CombatantType): string {
  switch (type) {
    case 'player': return '角色'
    case 'pet': return '战宠'
    case 'enemy': return '敌人'
  }
}

/**
 * 派发目标选择事件。
 * @param targetUid 被选中的敌方目标 uid。
 * @returns 无返回值。
 */
function selectTarget(targetUid: string): void {
  const target = props.combatants.find(combatant => combatant.uid === targetUid && combatant.side === 'enemy' && combatant.isAlive)
  if (!target) return

  emit('select-target', targetUid)
}
</script>

<style scoped>
.battle-focus-field {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(190px, 1.2fr) minmax(120px, 1fr);
  align-items: center;
  min-height: 260px;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background:
    linear-gradient(90deg, rgba(0, 113, 227, 0.08), transparent 34%, transparent 66%, rgba(255, 59, 48, 0.08)),
    var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  box-shadow: var(--shadow-subtle);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.battle-focus-field::before {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
  pointer-events: none;
}

.battle-focus-field::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.45;
}

.battle-focus-field--boss {
  border-color: var(--accent-gold);
}

.battle-focus-field__queue {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.battle-focus-unit,
.battle-focus-target {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-panel-light);
  color: var(--text-primary);
  box-shadow: var(--shadow-subtle);
  position: relative;
  z-index: 1;
}

.battle-focus-unit,
.battle-focus-target {
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, filter 0.2s ease;
}

.battle-focus-unit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 8px;
  align-items: center;
  padding: 10px 12px;
  text-align: left;
}

.battle-focus-unit:disabled {
  cursor: default;
  opacity: 0.8;
}

.battle-focus-unit--enemy:not(:disabled):hover,
.battle-focus-target:not(:disabled):hover {
  border-color: var(--accent-blue);
  filter: brightness(1.04);
  transform: translateY(-1px);
}

.battle-focus-unit--active {
  border-color: var(--accent-green);
  box-shadow: var(--shadow-card), 0 0 0 4px var(--accent-blue-glow);
}

.battle-focus-unit--selected,
.battle-focus-target--active,
.battle-focus-target--selected {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-card), 0 0 0 4px var(--accent-blue-glow);
}

.battle-focus-unit--dead,
.battle-focus-target--dead {
  color: var(--text-muted);
  opacity: 0.58;
}

.battle-focus-unit__name,
.battle-focus-target__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.battle-focus-unit__name {
  font-size: var(--font-size-small);
}

.battle-focus-unit__type,
.battle-focus-target__eyebrow,
.battle-focus-target__meta,
.battle-focus-target__hp-text {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.battle-focus-unit__type {
  justify-self: end;
}

.battle-focus-unit__hp,
.battle-focus-target__hp {
  grid-column: 1 / -1;
  display: block;
  height: 6px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--border-light);
}

.battle-focus-unit__hp-fill,
.battle-focus-target__hp-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent-green);
}

.battle-focus-unit--dead .battle-focus-unit__hp-fill,
.battle-focus-target--dead .battle-focus-target__hp-fill {
  background: var(--accent-red);
}

.battle-focus-target {
  display: flex;
  min-height: 188px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  text-align: center;
}

.battle-focus-target {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-elevated);
}

.battle-focus-target__eyebrow {
  text-transform: uppercase;
}

.battle-focus-target__name {
  max-width: 100%;
  font-size: var(--font-size-subheading);
  text-align: center;
}

.battle-focus-target__meta {
  font-size: var(--font-size-small);
}

.battle-focus-target__hp {
  width: 100%;
}

@media (max-width: 768px) {
  .battle-focus-field {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .battle-focus-field__queue {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .battle-focus-target {
    min-height: 148px;
  }
}

@media (max-width: 375px) {
  .battle-focus-field {
    padding: 12px;
    gap: 10px;
    min-height: 200px;
  }

  .battle-focus-field__queue {
    gap: 6px;
  }

  .battle-focus-unit {
    padding: 8px 10px;
    gap: 4px 6px;
  }

  .battle-focus-unit__name {
    font-size: var(--font-size-caption);
  }

  .battle-focus-unit__hp {
    height: 5px;
  }

  .battle-focus-target {
    min-height: 120px;
    padding: 12px;
    gap: 6px;
  }

  .battle-focus-target__name {
    font-size: var(--font-size-base);
  }

  .battle-focus-target__hp {
    height: 5px;
  }
}
</style>
