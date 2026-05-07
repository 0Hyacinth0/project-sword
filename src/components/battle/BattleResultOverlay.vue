<template>
  <div class="battle-result-overlay" v-if="visible">
    <div class="result-card">
      <div class="result-title" :class="outcome">{{ outcomeLabel }}</div>

      <div class="result-stats" v-if="outcome === 'victory' && rewards">
        <div class="stat-item">
          <span class="stat-label">获得经验</span>
          <span class="stat-value">+{{ rewards.exp }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">获得金币</span>
          <span class="stat-value">+{{ rewards.gold }}</span>
        </div>
        <div class="stat-item" v-for="item in rewards.items" :key="item.itemId">
          <span class="stat-label">{{ item.name }}</span>
          <span class="stat-value">×{{ item.quantity }}</span>
        </div>
      </div>

      <div class="result-stats" v-if="outcome === 'defeat'">
        <p class="defeat-message">胜败乃兵家常事，下次再接再厉！</p>
      </div>

      <div class="result-stats" v-if="outcome === 'fled'">
        <p class="flee-message">成功脱离了战斗</p>
      </div>

      <button class="confirm-btn" @click="$emit('confirm')">
        {{ outcome === 'victory' ? '领取奖励' : '返回' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BattleOutcome, BattleRewards } from '../../types/battle'

const props = defineProps<{
  visible: boolean
  outcome: BattleOutcome | null
  rewards: BattleRewards | null
}>()

defineEmits<{
  confirm: []
}>()

const outcomeLabel = computed(() => {
  switch (props.outcome) {
    case 'victory': return '战斗胜利'
    case 'defeat': return '战斗失败'
    case 'fled': return '成功逃脱'
    default: return ''
  }
})
</script>
