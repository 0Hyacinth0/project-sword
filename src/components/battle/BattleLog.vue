<template>
  <div class="battle-log" ref="logContainer">
    <div class="log-header">
      <span class="log-title">战斗日志</span>
      <span class="round-badge">R{{ currentRound }}</span>
    </div>
    <div class="log-entries">
      <div
        v-for="(entry, index) in displayEntries"
        :key="index"
        class="log-entry"
        :class="entry.type"
      >
        <span class="log-round" v-if="entry.type === 'system'">◆</span>
        <span class="log-text">{{ entry.message }}</span>
      </div>
      <div v-if="entries.length === 0" class="log-empty">等待战斗开始...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { BattleLogEntry } from '../../types/battle'

const props = defineProps<{
  entries: BattleLogEntry[]
  currentRound: number
}>()

const logContainer = ref<HTMLElement | null>(null)

/** 只显示最近 50 条日志 */
const displayEntries = computed(() => {
  return props.entries.slice(-50)
})

/** 自动滚动到底部 */
watch(() => props.entries.length, async () => {
  await nextTick()
  if (logContainer.value) {
    const scrollEl = logContainer.value.querySelector('.log-entries') as HTMLElement
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight
    }
  }
})
</script>
