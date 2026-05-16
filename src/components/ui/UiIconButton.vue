<template>
  <button
    class="ui-icon-button"
    :class="buttonClasses"
    :type="type"
    :disabled="isDisabled"
    :aria-label="label"
    :aria-busy="loading"
    :title="label"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-spinner" aria-hidden="true"></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type IconButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(defineProps<{
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  type?: IconButtonType
  loading?: boolean
  disabled?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

/** 判断图标按钮是否应进入不可交互状态。 */
const isDisabled = computed(() => props.disabled || props.loading)

/** 生成图标按钮的尺寸与视觉变体类名。 */
const buttonClasses = computed(() => [
  `ui-icon-button--${props.variant}`,
  `ui-icon-button--${props.size}`,
  { 'ui-icon-button--loading': props.loading }
])

/**
 * 派发图标按钮点击事件。
 * @param event - 原生鼠标点击事件
 * @returns 无返回值
 */
function handleClick(event: MouseEvent): void {
  if (isDisabled.value) return
  emit('click', event)
}
</script>
