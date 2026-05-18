import { computed, ref } from 'vue'
import type { UiToastItem, UiToastType } from '../components/ui'

/** 默认 Toast 展示时长（毫秒）。 */
const DEFAULT_TOAST_DURATION = 3000

interface InternalToast extends UiToastItem {
  id: string
  type: UiToastType
}

/**
 * 提供局部 Toast 列表和展示/隐藏方法。
 * @returns Toast 列表、展示方法和隐藏方法
 */
export function useUiToasts() {
  const queue = ref<InternalToast[]>([])

  /**
   * 展示一条 Toast。
   * @param message - 提示文案
   * @param type - 提示类型
   * @param duration - 自动隐藏时长，传 0 表示不自动隐藏
   * @returns 新 Toast 的 ID
   */
  function showToast(
    message: string,
    type: UiToastType = 'info',
    duration: number = DEFAULT_TOAST_DURATION
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    queue.value = [...queue.value, { id, message, type }]

    if (duration > 0) {
      window.setTimeout(() => hideToast(id), duration)
    }

    return id
  }

  /**
   * 隐藏指定 Toast；不传参数时清空全部 Toast。
   * @param target - Toast ID 或 Toast 对象
   * @returns 无返回值
   */
  function hideToast(target?: string | number | UiToastItem): void {
    if (target === undefined) {
      queue.value = []
      return
    }

    const id = typeof target === 'object' ? target.id : target
    queue.value = queue.value.filter(toast => toast.id !== String(id))
  }

  const toasts = computed<UiToastItem[]>(() => queue.value)

  return {
    toasts,
    showToast,
    hideToast
  }
}
