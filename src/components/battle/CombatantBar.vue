<template>
  <div class="combatant-bar" :class="[side, { dead: !combatant.isAlive, active: isActive }]">
    <div class="combatant-info">
      <div class="combatant-icon" :class="combatant.type">
        {{ combatant.type === 'player' ? '⚔' : combatant.type === 'pet' ? '🐾' : '👹' }}
      </div>
      <div class="combatant-details">
        <div class="combatant-name">{{ combatant.name }}</div>
        <div class="combatant-badges">
          <span v-for="buff in combatant.buffs" :key="buff.uid" class="buff-badge" :class="{ debuff: buff.isDebuff }">
            {{ buff.name }}({{ buff.remainingTurns }})
          </span>
        </div>
      </div>
    </div>
    <div class="bar-group">
      <div class="bar hp-bar">
        <div class="bar-fill" :style="hpStyle"></div>
        <span class="bar-text">{{ combatant.stats.hp }} / {{ combatant.stats.maxHp }}</span>
      </div>
      <div class="bar mp-bar">
        <div class="bar-fill mp" :style="mpStyle"></div>
        <span class="bar-text">{{ combatant.stats.mp }} / {{ combatant.stats.maxMp }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant } from '../../types/battle'

const props = defineProps<{
  combatant: Combatant
  isActive: boolean
  side: 'ally' | 'enemy'
}>()

const hpPercent = computed(() => {
  if (props.combatant.stats.maxHp === 0) return 0
  return Math.max(0, Math.min(100, (props.combatant.stats.hp / props.combatant.stats.maxHp) * 100))
})

const mpPercent = computed(() => {
  if (props.combatant.stats.maxMp === 0) return 0
  return Math.max(0, Math.min(100, (props.combatant.stats.mp / props.combatant.stats.maxMp) * 100))
})

const hpStyle = computed(() => ({
  width: `${hpPercent.value}%`,
  background: hpPercent.value < 25 ? 'var(--accent-red)' : hpPercent.value < 50 ? 'var(--accent-gold)' : 'var(--accent-green)'
}))

const mpStyle = computed(() => ({
  width: `${mpPercent.value}%`
}))
</script>
