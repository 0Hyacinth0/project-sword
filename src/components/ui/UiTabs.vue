<template>
  <div class="ui-tabs" :class="tabsClasses" role="tablist">
    <button
      v-for="item in items"
      :key="String(item.value)"
      class="ui-tabs__button"
      :class="{ 'ui-tabs__button--active': item.value === modelValue }"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      :disabled="item.disabled"
      @click="selectItem(item)"
    >
      <component v-if="item.icon" :is="item.icon" :size="iconSize" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

export interface UiTabItem {
  value: string | number
  label: string
  icon?: Component | null
  disabled?: boolean
}

type TabsSize = 'sm' | 'md'

const props = withDefaults(defineProps<{
  modelValue: string | number
  items: UiTabItem[]
  size?: TabsSize
  block?: boolean
}>(), {
  size: 'md',
  block: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

/** 根据标签尺寸返回图标尺寸。 */
const iconSize = computed(() => props.size === 'sm' ? 12 : 14)

/** 生成标签容器的尺寸与布局类名。 */
const tabsClasses = computed(() => [
  `ui-tabs--${props.size}`,
  { 'ui-tabs--block': props.block }
])

/**
 * 选择一个标签项并同步 v-model。
 * @param item - 被点击的标签配置
 * @returns 无返回值
 */
function selectItem(item: UiTabItem): void {
  if (item.disabled) return
  emit('update:modelValue', item.value)
}
</script>
