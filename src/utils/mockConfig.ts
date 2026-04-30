import { ref, watch } from 'vue'

/**
 * 全局 Mock 开关状态管理
 * 提供页面级别的 Mock 模式切换，无需后端即可测试全部功能
 * 状态持久化到 localStorage，刷新页面后保持
 */

const STORAGE_KEY = 'mock_mode_enabled'

/** 全局 Mock 总开关 */
const mockEnabled = ref(loadFromStorage())

/** 从 localStorage 恢复状态 */
function loadFromStorage(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'true'
}

/** 状态变更时同步到 localStorage */
watch(mockEnabled, (val) => {
  localStorage.setItem(STORAGE_KEY, String(val))
})

/**
 * 判断当前是否应使用 Mock 数据
 * 各 API 模块调用此函数决定走 Mock 还是真实后端
 */
export function isMockEnabled(): boolean {
  return mockEnabled.value
}

/** 开启 Mock 模式 */
export function enableMock(): void {
  mockEnabled.value = true
}

/** 关闭 Mock 模式 */
export function disableMock(): void {
  mockEnabled.value = false
}

/** 切换 Mock 模式 */
export function toggleMock(): void {
  mockEnabled.value = !mockEnabled.value
}

/** 响应式引用，供组件绑定 */
export function useMockRef() {
  return mockEnabled
}
