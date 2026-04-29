import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, logoutApi } from '../api'
import type { LoginResult } from '../api'

/**
 * 认证状态管理
 * Store 只负责状态管理，API 调用委托给 api 层
 */
export const useAuthStore = defineStore('auth', () => {
  // ── 状态 ──
  const user = ref<LoginResult | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──
  const isLoggedIn = computed(() => !!user.value)

  // ── 初始化：尝试从 localStorage 恢复登录状态 ──
  function init() {
    const saved = localStorage.getItem('auth_user')
    if (saved) {
      try {
        user.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem('auth_user')
      }
    }
  }

  /** 登录 */
  async function login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await loginApi({ username, password })
      if (res.code === 200) {
        user.value = res.data
        localStorage.setItem('auth_user', JSON.stringify(res.data))
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 注册 */
  async function register(username: string, password: string): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await registerApi({ username, password })
      if (res.code === 200) {
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败，请稍后重试'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 登出 */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 登出即使接口失败也要清除本地状态
    }
    user.value = null
    localStorage.removeItem('auth_user')
  }

  // 初始化
  init()

  return {
    user,
    loading,
    isLoggedIn,
    login,
    register,
    logout
  }
})
