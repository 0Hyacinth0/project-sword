<template>
  <div class="ui-stat-bar" :class="[`ui-stat-bar--${tone}`, { 'ui-stat-bar--flash': flash }]">
    <div class="ui-stat-bar__header">
      <span class="ui-stat-bar__label">
        {{ label }}
        <span v-if="tag" class="ui-stat-bar__tag">{{ tag }}</span>
      </span>
      <span v-if="showValue" class="ui-stat-bar__value">{{ formattedValue }}</span>
    </div>
    <div class="ui-stat-bar__track" role="progressbar" :aria-valuenow="value" :aria-valuemax="max" aria-valuemin="0">
      <span class="ui-stat-bar__fill" :style="{ width: `${percent}%` }"></span>
      <span v-if="flash" class="ui-stat-bar__flash" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type StatTone = 'hp' | 'mp' | 'exp' | 'success' | 'warning' | 'danger'

const props = withDefaults(defineProps<{
  label: string
  value: number
  max: number
  tone?: StatTone
  showValue?: boolean
  unit?: string
  valueText?: string
  tag?: string
  flash?: boolean
}>(), {
  tone: 'success',
  showValue: true,
  unit: '',
  valueText: '',
  tag: '',
  flash: false
})

/**
 * 计算进度条百分比，并限制在 0 到 100。
 * @returns 当前进度百分比
 */
const percent = computed(() => {
  if (props.max <= 0) return 0
  return Math.max(0, Math.min(100, (props.value / props.max) * 100))
})

/**
 * 格式化进度值显示文本。
 * @returns 自定义文本或默认的 value / max 文案
 */
const formattedValue = computed(() =>
  props.valueText || `${props.value}${props.unit} / ${props.max}${props.unit}`
)
</script>
