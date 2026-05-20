/**
 * 认证相关 API
 * 登录、注册、登出、用户名检测
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

/** 用户名检测响应 */
export interface CheckUsernameResult {
  available: boolean
}

/** 用户登录 */
export async function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  const res = await request.post<ApiResponse<LoginResult>>('/auth/login', params)
  return res.data
}

/** 用户注册 */
export async function registerApi(params: RegisterParams): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/auth/register', params)
  return res.data
}

/** 用户登出 */
export async function logoutApi(): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/auth/logout')
  return res.data
}

/** 检测用户名是否可用 */
export async function checkUsernameApi(username: string): Promise<ApiResponse<CheckUsernameResult>> {
  const res = await request.get<ApiResponse<CheckUsernameResult>>('/auth/check-username', {
    params: { username }
  })
  return res.data
}
