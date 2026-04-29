/**
 * 认证相关 API
 * 登录、注册、登出
 */
import request from './request'
import type { ApiResponse } from './request'

/** 登录响应数据 */
export interface LoginResult {
  id: string
  username: string
  token: string
}

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  password: string
}

// ──────────────────────────────────────────
// 以下为 Mock 实现，后端就绪后切换为真实请求
// ──────────────────────────────────────────

const USE_MOCK = true

/** 用户登录 */
export async function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  if (USE_MOCK) {
    return mockLogin(params)
  }
  const res = await request.post<ApiResponse<LoginResult>>('/auth/login', params)
  return res.data
}

/** 用户注册 */
export async function registerApi(params: RegisterParams): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    return mockRegister(params)
  }
  const res = await request.post<ApiResponse<null>>('/auth/register', params)
  return res.data
}

/** 用户登出 */
export async function logoutApi(): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    return { code: 200, message: '已退出登录', data: null }
  }
  const res = await request.post<ApiResponse<null>>('/auth/logout')
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function mockLogin(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  await delay(1200)

  if (params.username.length < 3) {
    return { code: 401, message: '用户名不存在', data: null as unknown as LoginResult }
  }

  return {
    code: 200,
    message: '登录成功',
    data: {
      id: crypto.randomUUID(),
      username: params.username,
      token: `mock_jwt_${Date.now()}`
    }
  }
}

async function mockRegister(params: RegisterParams): Promise<ApiResponse<null>> {
  await delay(1500)

  if (params.username.toLowerCase() === 'admin') {
    return { code: 409, message: '该用户名已被注册', data: null }
  }

  return { code: 200, message: '注册成功，请登录', data: null }
}
