<template>
  <Teleport to="body">
    <div class="ui-toast-host" aria-live="polite" aria-atomic="true">
      <transition-group name="ui-toast" tag="div" class="ui-toast-host__stack">
        <div
          v-for="toast in normalizedToasts"
          :key="toast.key"
          class="ui-toast"
          :class="`ui-toast--${toast.type}`"
          role="status"
          @click="dismiss(toast)"
        >
          <component :is="toast.icon" :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span>{{ toast.message }}</span>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, CircleX, Info } from 'lucide-vue-next'

export type UiToastType = 'success' | 'error' | 'info'

export interface UiToastItem {
  id?: string | number
  message: string
  type?: UiToastType
}

interface NormalizedToast extends Required<Omit<UiToastItem, 'id'>> {
  id?: string | number
  key: string
  icon: typeof CheckCircle
}

const props = withDefaults(defineProps<{
  toasts: UiToastItem[]
}>(), {
  toasts: () => []
})

const emit = defineEmits<{
  dismiss: [toast: UiToastItem]
}>()

/** 标准化 Toast 列表，补齐类型、key 和图标。 */
const normalizedToasts = computed<NormalizedToast[]>(() =>
  props.toasts.map((toast, index) => {
    const type = toast.type ?? 'info'
    return {
      id: toast.id,
      key: String(toast.id ?? `${type}-${toast.message}-${index}`),
      message: toast.message,
      type,
      icon: getToastIcon(type)
    }
  })
)

/**
 * 根据 Toast 类型返回对应图标组件。
 * @param type - Toast 语义类型
 * @returns lucide 图标组件
 */
function getToastIcon(type: UiToastType): typeof CheckCircle {
  if (type === 'success') return CheckCircle
  if (type === 'error') return CircleX
  return Info
}

/**
 * 通知父组件移除指定 Toast。
 * @param toast - 已标准化的 Toast 数据
 * @returns 无返回值
 */
function dismiss(toast: NormalizedToast): void {
  emit('dismiss', {
    id: toast.id,
    message: toast.message,
    type: toast.type
  })
}
</script>
