/**
 * Axios 请求实例
 * 统一处理：baseURL、JWT 注入、响应拦截、错误处理
 */
import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

/** 后端统一响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ── 创建 Axios 实例 ──
const request = axios.create({
  // TODO: 后端部署后替换为真实地址
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ── 请求拦截器：自动注入 JWT Token ──
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`
        }
      } catch {
        // token 解析失败，忽略
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── 响应拦截器：统一错误处理 ──
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 业务层错误（code !== 200）
    if (data.code !== 200) {
      return Promise.reject(new ApiError(data.code, data.message))
    }

    return response
  },
  (error) => {
    // 网络/HTTP 层错误
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || getHttpErrorMessage(status)

      // 401: Token 过期 → 清除登录状态，跳转登录页
      if (status === 401) {
        localStorage.removeItem('auth_user')
        // 避免在登录页重复跳转
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

      return Promise.reject(new ApiError(status, message))
    }

    // 网络不可达
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError(0, '请求超时，请检查网络'))
    }

    return Promise.reject(new ApiError(0, '网络连接失败，请检查网络'))
  }
)

/** 业务错误类 */
export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/** HTTP 状态码映射中文提示 */
function getHttpErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    409: '资源冲突',
    429: '请求过于频繁，请稍后再试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂不可用'
  }
  return messages[status] || `服务器错误 (${status})`
}

export default request
