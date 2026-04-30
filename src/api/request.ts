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
  // 联调环境：通过 Vite 代理转发到后端
  baseURL: import.meta.env.VITE_API_BASE_URL || '/jeecg-boot/webgame',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/** 不需要携带 token 的接口路径 */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/check-username']

// ── 请求拦截器：自动注入 Token ──
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 公开接口不发 token，避免后端误校验
    const isPublic = PUBLIC_PATHS.some(path => config.url?.includes(path))
    if (isPublic) {
      return config
    }

    // jeecg-boot 使用 X-Access-Token 请求头
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['X-Access-Token'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── 响应拦截器：统一错误处理 ──
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const raw = response.data as unknown as Record<string, unknown>

    // 兼容 jeecg-boot 响应格式：{ success, code, message, result }
    // 统一转换为前端约定格式：{ code, message, data }
    if ('result' in raw && !('data' in raw)) {
      raw.data = raw.result
    }
    if ('success' in raw && typeof raw.success === 'boolean') {
      // jeecg-boot 的 code 可能是 200/0/500 等，以 success 为准
      if (!raw.success && (raw.code === 200 || raw.code === 0)) {
        raw.code = 400
      }
    }

    const data = raw as unknown as ApiResponse

    // 业务层错误（code !== 200）
    if (data.code !== 200) {
      return Promise.reject(new ApiError(data.code, data.message))
    }

    // 把标准化后的 data 写回
    response.data = data
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
        localStorage.removeItem('access_token')
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
