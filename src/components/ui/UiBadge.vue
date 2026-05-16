<template>
  <span class="ui-badge" :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'rare' | 'epic' | 'legendary'
type BadgeSize = 'sm' | 'md'

const props = withDefaults(defineProps<{
  tone?: BadgeTone
  size?: BadgeSize
}>(), {
  tone: 'neutral',
  size: 'md'
})

/** 生成徽标的语义色和尺寸类名。 */
const badgeClasses = computed(() => [
  `ui-badge--${props.tone}`,
  `ui-badge--${props.size}`
])
</script>
