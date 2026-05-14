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