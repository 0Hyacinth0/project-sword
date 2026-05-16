<template>
  <Teleport to="body">
    <transition name="ui-modal">
      <div
        v-if="modelValue"
        class="ui-modal"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          class="ui-modal__dialog"
          :class="`ui-modal__dialog--${variant}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
        >
          <div v-if="$slots.icon" class="ui-modal__icon">
            <slot name="icon" />
          </div>
          <h2 v-if="title" :id="titleId" class="ui-modal__title">{{ title }}</h2>
          <div class="ui-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
type ModalVariant = 'default' | 'danger'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  variant?: ModalVariant
  closeOnBackdrop?: boolean
}>(), {
  title: undefined,
  variant: 'default',
  closeOnBackdrop: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const titleId = `ui-modal-title-${Math.random().toString(36).slice(2)}`

/**
 * 处理遮罩点击关闭行为。
 * @returns 无返回值
 */
function handleBackdropClick(): void {
  if (!props.closeOnBackdrop) return
  close()
}

/**
 * 关闭弹窗并同步外部 modelValue。
 * @returns 无返回值
 */
function close(): void {
  emit('update:modelValue', false)
  emit('close')
}
</script>
