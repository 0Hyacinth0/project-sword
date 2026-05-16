<template>
  <button
    class="ui-button"
    :class="buttonClasses"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading"
    :title="title"
    @click="handleClick"
  >
    <span v-if="loading || $slots.icon" class="ui-button__icon" aria-hidden="true">
      <span v-if="loading" class="ui-spinner"></span>
      <slot v-else name="icon" />
    </span>
    <span v-if="!iconOnly" class="ui-button__label">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  loading?: boolean
  disabled?: boolean
  block?: boolean
  iconOnly?: boolean
  title?: string
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
  iconOnly: false,
  title: undefined
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

/** 判断按钮是否应禁用，加载态也会阻止重复点击。 */
const isDisabled = computed(() => props.disabled || props.loading)

/** 生成按钮的尺寸、状态和视觉变体类名。 */
const buttonClasses = computed(() => [
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  {
    'ui-button--loading': props.loading,
    'ui-button--block': props.block,
    'ui-button--icon-only': props.iconOnly
  }
])

/**
 * 派发点击事件。
 * @param event - 原生鼠标点击事件
 * @returns 无返回值
 */
function handleClick(event: MouseEvent): void {
  if (isDisabled.value) return
  emit('click', event)
}
</script>
