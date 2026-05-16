<template>
  <div class="action-order-bar">
    <div class="bar-label">行动顺序</div>
    <div class="order-track">
      <div
        v-for="(entry, i) in entries"
        :key="`${entry.uid}-${i}`"
        class="order-card"
        :class="[entry.side, entry.type, { current: i === 0 }]"
      >
        <div class="card-icon">
          {{ entry.type === 'player' ? '⚔' : entry.type === 'pet' ? '🐾' : '👹' }}
        </div>
        <div class="card-name">{{ entry.name }}</div>
        <div class="card-index">{{ i + 1 }}</div>
      </div>
      <div v-if="entries.length === 0" class="empty-hint">等待行动...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActionOrderEntry } from '../../types/battle'

defineProps<{
  entries: ActionOrderEntry[]
}>()
</script>

<style scoped>
.action-order-bar {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
}

.bar-label {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.order-track {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-gutter: stable;
}

.order-track::-webkit-scrollbar {
  height: 5px;
}

.order-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-panel-light);
  min-width: 64px;
  position: relative;
  transition: all 0.3s ease;
}

.order-card.current {
  border-color: var(--accent-blue);
  box-shadow: 0 0 8px rgba(0, 113, 227, 0.3);
  background: rgba(0, 113, 227, 0.08);
}

.order-card.ally { border-left: 3px solid var(--accent-blue); }
.order-card.enemy { border-left: 3px solid var(--accent-red); }

.card-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.card-name {
  font-size: var(--font-size-caption);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-index {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}

.empty-hint {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  padding: 8px;
}

/* ── 深色模式 ── */
[data-theme='dark'] .order-card.current {
  background: rgba(0, 113, 227, 0.15);
}
</style>
