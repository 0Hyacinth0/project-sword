import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 用户信息接口 */
export interface UserInfo {
  id: string
  username: string
  token: string
}

/**
 * 认证状态管理
 * 管理用户登录/注册状态，后续对接真实 API
 */
export const useAuthStore = defineStore('auth', () => {
  // ── 状态 ──
  const user = ref<UserInfo | null>(null)
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

  /**
   * 登录（Mock 实现）
   * 后续替换为真实 API 请求
   */
  async function login(username: string, _password: string): Promise<{ success: boolean; message: string }> {
    loading.value = true

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1200))

    try {
      // Mock 验证逻辑
      if (username.length < 3) {
        return { success: false, message: '用户名不存在' }
      }

      // Mock 成功登录
      const mockUser: UserInfo = {
        id: crypto.randomUUID(),
        username,
        token: `mock_jwt_${Date.now()}`
      }

      user.value = mockUser
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      return { success: true, message: '登录成功' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 注册（Mock 实现）
   * 后续替换为真实 API 请求
   */
  async function register(username: string, _password: string): Promise<{ success: boolean; message: string }> {
    loading.value = true

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // Mock 检查用户名是否已存在
      if (username.toLowerCase() === 'admin') {
        return { success: false, message: '该用户名已被注册' }
      }

      // Mock 注册成功
      return { success: true, message: '注册成功，请登录' }
    } finally {
      loading.value = false
    }
  }

  /** 登出 */
  function logout() {
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
