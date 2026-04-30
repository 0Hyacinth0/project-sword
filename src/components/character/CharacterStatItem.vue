<!--
  CharacterStatItem.vue
  单个属性项展示组件（原子组件）
  用于展示角色的各项属性数值
-->
<template>
  <div class="stat-item" :style="{ color: color }">
    <span class="stat-item__label">{{ label }}</span>
    <div class="stat-item__value-wrap">
      <span class="stat-item__value">{{ formattedValue }}</span>
      <button
        v-if="showAddButton && addButtonVisible"
        class="stat-item__add-btn"
        title="加点"
        @click.stop="$emit('add')"
      >
        <Plus :size="12" :stroke-width="2.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'

/**
 * 属性项组件
 * @param label - 属性名称（如"力量"、"物攻"）
 * @param value - 属性值
 * @param showPercent - 是否显示百分比符号
 * @param color - 自定义颜色
 * @param showAddButton - 是否显示加点按钮
 * @param addButtonVisible - 加点按钮是否可见（用于控制显示时机）
 */

interface Props {
  label: string
  value: number | string
  showPercent?: boolean
  color?: string
  showAddButton?: boolean
  addButtonVisible?: boolean
}

interface Emits {
  (e: 'add'): void
}

const props = withDefaults(defineProps<Props>(), {
  showPercent: false,
  showAddButton: false,
  addButtonVisible: false
})

defineEmits<Emits>()

/**
 * 格式化显示值
 * 数字类型时保留小数位或显示百分比
 */
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }
  // 百分比属性保留一位小数
  if (props.showPercent) {
    return (props.value * 100).toFixed(1) + '%'
  }
  // 整数属性直接显示
  return Math.floor(props.value)
})
</script>

<style scoped>
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: var(--font-size-small, 14px);
  color: var(--text-primary, #1d1d1f);
}

.stat-item__label {
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.stat-item__value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item__value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-item__add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: var(--accent-blue, #0071e3);
  color: #fff;
  cursor: pointer;
  transition: transform 0.1s ease, filter 0.2s ease;
}

.stat-item__add-btn:hover {
  filter: brightness(1.15);
  transform: scale(1.1);
}

.stat-item__add-btn:active {
  transform: scale(0.95);
}
</style>