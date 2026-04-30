/**
 * 认证相关 API
 * 登录、注册、登出、用户名检测
 */
import request from './request'
import type { ApiResponse } from './request'
import { isMockEnabled } from '../utils/mockConfig'

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

/** 用户名检测响应 */
export interface CheckUsernameResult {
  available: boolean
}

// ──────────────────────────────────────────
// Mock 已注册用户（用户名 → 密码）
// ──────────────────────────────────────────
const mockRegisteredUsers: Map<string, string> = new Map([
  ['123456', '123456'],
  ['admin', 'admin123'],
  ['test', 'test123']
])

/** 用户登录 */
export async function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  if (isMockEnabled()) {
    return mockLogin(params)
  }
  const res = await request.post<ApiResponse<LoginResult>>('/auth/login', params)
  return res.data
}

/** 用户注册 */
export async function registerApi(params: RegisterParams): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockRegister(params)
  }
  const res = await request.post<ApiResponse<null>>('/auth/register', params)
  return res.data
}

/** 用户登出 */
export async function logoutApi(): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return { code: 200, message: '已退出登录', data: null }
  }
  const res = await request.post<ApiResponse<null>>('/auth/logout')
  return res.data
}

/** 检测用户名是否可用 */
export async function checkUsernameApi(username: string): Promise<ApiResponse<CheckUsernameResult>> {
  if (isMockEnabled()) {
    return mockCheckUsername(username)
  }
  const res = await request.get<ApiResponse<CheckUsernameResult>>('/auth/check-username', {
    params: { username }
  })
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

  const lowerName = params.username.toLowerCase()
  const storedPassword = mockRegisteredUsers.get(lowerName)

  if (!storedPassword) {
    return { code: 401, message: '用户名不存在', data: null as unknown as LoginResult }
  }

  if (params.password !== storedPassword) {
    return { code: 401, message: '密码错误', data: null as unknown as LoginResult }
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

  const lowerName = params.username.toLowerCase()
  if (mockRegisteredUsers.has(lowerName)) {
    return { code: 409, message: '该用户名已被注册', data: null }
  }

  mockRegisteredUsers.set(lowerName, params.password)
  return { code: 200, message: '注册成功，请登录', data: null }
}

async function mockCheckUsername(username: string): Promise<ApiResponse<CheckUsernameResult>> {
  await delay(600)

  const available = !mockRegisteredUsers.has(username.toLowerCase())
  return {
    code: 200,
    message: available ? '用户名可用' : '该用户名已被注册',
    data: { available }
  }
}
