/**
 * 测试辅助工具
 * 提供测试数据生成、异步等待、认证状态管理、请求配置等通用工具函数
 */

import request from '../../api/request'
import type { LogEntry } from '../core/types'

/** 测试用固定密码 */
export const TEST_PASSWORD = 'Test123456!'

/**
 * 生成测试用唯一用户名
 * 格式：test_<36进制时间戳>_<4位随机字符>
 * @returns 唯一测试用户名字符串
 */
export function generateTestUsername(): string {
  const timestamp36 = Date.now().toString(36)
  const random4 = Math.random().toString(36).substring(2, 6)
  return `test_${timestamp36}_${random4}`
}

/**
 * 生成测试用唯一角色名
 * 格式：<前缀>_<36进制时间戳>_<3位随机字符>
 * @param prefix - 角色名前缀
 * @returns 唯一测试角色名字符串
 */
export function generateTestCharName(prefix: string): string {
  const timestamp36 = Date.now().toString(36)
  const random3 = Math.random().toString(36).substring(2, 5)
  return `${prefix}_${timestamp36}_${random3}`
}

/**
 * 延迟指定毫秒数
 * @param ms - 延迟时间（毫秒）
 * @returns Promise，在指定时间后 resolve
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 轮询等待直到条件函数返回 true
 * @param fn - 条件判断函数，返回 true 表示条件满足
 * @param timeout - 超时时间（毫秒），默认 5000
 * @param interval - 轮询间隔（毫秒），默认 200
 * @throws Error 当超时仍未满足条件时
 */
export async function waitFor(
  fn: () => boolean,
  timeout: number = 5000,
  interval: number = 200
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (fn()) return
    await sleep(interval)
  }
  // 最后再检查一次，避免边界条件遗漏
  if (fn()) return
  throw new Error(`waitFor 超时 (${timeout}ms)：条件未在规定时间内满足`)
}

/**
 * 安全调用异步函数，捕获异常并返回结果元组
 * @param fn - 待调用的异步函数
 * @returns 元组 [data, error]，成功时 error 为 undefined，失败时 data 为 undefined
 */
export async function safeCall<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn()
    return { data }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return { error }
  }
}

/** 测试上下文接口，存储全局测试状态和关键 ID */
export interface TestContext {
  /** 后端基础 URL */
  baseURL: string
  /** 主账号 Token */
  token: string
  /** 主账号用户 ID */
  userId: string
  /** 主账号用户名 */
  username: string
  /** 主角色 ID */
  characterId: string
  /** 主角色名称 */
  characterName: string
  /** 第二个账号 Token（用于交互测试） */
  secondToken: string
  /** 第二个账号用户 ID */
  secondUserId: string
  /** 第二个账号用户名 */
  secondUsername: string
  /** 第二个角色 ID */
  secondCharacterId: string
  /** 第二个角色名称 */
  secondCharacterName: string
  /** 战斗 ID */
  battleId: string
  /** 玩家战斗单位 UID */
  playerUid: string
  /** 敌方战斗单位 UID */
  enemyUid: string
  /** 背包物品 ID */
  inventoryItemId: string
  /** 装备槽位信息 */
  equipmentSlotInfo: Record<string, unknown>
}

/** 测试上下文单例 */
export const testContext: TestContext = {
  baseURL: '',
  token: '',
  userId: '',
  username: '',
  characterId: '',
  characterName: '',
  secondToken: '',
  secondUserId: '',
  secondUsername: '',
  secondCharacterId: '',
  secondCharacterName: '',
  battleId: '',
  playerUid: '',
  enemyUid: '',
  inventoryItemId: '',
  equipmentSlotInfo: {}
}

/**
 * 重置测试上下文为初始空值状态
 */
export function resetTestContext(): void {
  testContext.baseURL = ''
  testContext.token = ''
  testContext.userId = ''
  testContext.username = ''
  testContext.characterId = ''
  testContext.characterName = ''
  testContext.secondToken = ''
  testContext.secondUserId = ''
  testContext.secondUsername = ''
  testContext.secondCharacterId = ''
  testContext.secondCharacterName = ''
  testContext.battleId = ''
  testContext.playerUid = ''
  testContext.enemyUid = ''
  testContext.inventoryItemId = ''
  testContext.equipmentSlotInfo = {}
}

/**
 * 设置认证状态到 localStorage
 * @param token - JWT Token
 * @param userId - 用户 ID
 */
export function setAuthState(token: string, userId: string): void {
  localStorage.setItem('access_token', token)
  localStorage.setItem('auth_user', JSON.stringify({ id: userId }))
}

/**
 * 清除认证状态
 * 移除 localStorage 中的 access_token 和 auth_user，
 * 以及 sessionStorage 中的 selected_character_id
 */
export function clearAuthState(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth_user')
  sessionStorage.removeItem('selected_character_id')
}

/**
 * 设置当前选中的角色 ID 到 sessionStorage
 * @param characterId - 角色 ID
 */
export function setSelectedCharacter(characterId: string): void {
  sessionStorage.setItem('selected_character_id', characterId)
}

/**
 * 动态更新 Axios 实例的 baseURL
 * 将 baseURL 设置为传入 URL + '/jeecg-boot/webgame'
 * @param url - 后端服务的基础 URL（不含路径部分）
 */
export function updateBaseURL(url: string): void {
  request.defaults.baseURL = url + '/jeecg-boot/webgame'
  testContext.baseURL = url + '/jeecg-boot/webgame'
}

/** 日志回调函数类型 */
type LogCallback = (entry: LogEntry) => void

/** 当前注册的日志回调 */
let logCallback: LogCallback | null = null

/** axios 请求拦截器 ID */
let reqInterceptorId: number | null = null
/** axios 响应拦截器 ID */
let resInterceptorId: number | null = null

/**
 * 安装日志拦截器
 * 拦截 axios 请求/响应/错误，通过回调推送日志条目
 * @param cb - 日志回调函数
 */
export function installLogInterceptor(cb: LogCallback): void {
  // 先移除旧拦截器（会清空 logCallback），再设置新的回调
  removeLogInterceptor()
  logCallback = cb

  // 请求拦截器（用 unshift 插入到链头，确保在 auth 拦截器之后执行）
  reqInterceptorId = request.interceptors.request.use((config) => {
    if (logCallback) {
      const method = (config.method || 'get').toUpperCase()
      const url = config.url || ''

      // 构建完整请求体：合并原始数据和自动注入字段
      let bodyObj: Record<string, unknown> | null = null
      if (config.data && typeof config.data === 'object') {
        bodyObj = { ...config.data as Record<string, unknown> }
      }
      // 补充 auth 拦截器即将注入的字段
      if (config.method !== 'get' && bodyObj) {
        if (!bodyObj.userId) {
          try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}')
            if (authUser.id) bodyObj.userId = authUser.id
          } catch { /* 忽略 */ }
        }
        if (!bodyObj.characterId) {
          const charId = sessionStorage.getItem('selected_character_id')
          if (charId) bodyObj.characterId = charId
        }
      }
      const body = bodyObj ? ` ${JSON.stringify(bodyObj).substring(0, 300)}` : ''

      logCallback({
        timestamp: Date.now(),
        direction: 'request',
        content: `${method} ${url}${body}`
      })
    }
    return config
  })

  // 响应拦截器（在业务拦截器之后）
  resInterceptorId = request.interceptors.response.use(
    (response) => {
      if (logCallback) {
        const url = response.config?.url || ''
        const status = response.status
        const data = response.data
          ? ` ${JSON.stringify(response.data).substring(0, 300)}`
          : ''
        logCallback({
          timestamp: Date.now(),
          direction: 'response',
          content: `← ${status} ${url}${data}`
        })
      }
      return response
    },
    (error) => {
      if (logCallback) {
        const url = error.config?.url || ''
        const status = error.response?.status || '网络错误'
        const msg = error.response?.data?.message || error.message || ''
        logCallback({
          timestamp: Date.now(),
          direction: 'error',
          content: `✗ ${status} ${url} ${msg}`
        })
      }
      return Promise.reject(error)
    }
  )
}

/**
 * 移除日志拦截器
 */
export function removeLogInterceptor(): void {
  if (reqInterceptorId !== null) {
    request.interceptors.request.eject(reqInterceptorId)
    reqInterceptorId = null
  }
  if (resInterceptorId !== null) {
    request.interceptors.response.eject(resInterceptorId)
    resInterceptorId = null
  }
  logCallback = null
}
