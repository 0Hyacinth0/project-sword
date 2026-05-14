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