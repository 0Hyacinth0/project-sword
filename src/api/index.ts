/**
 * API 模块统一导出
 *
 * 使用方式：
 *   import { loginApi, registerApi } from '@/api'
 *
 * 后续新增模块时在此追加导出：
 *   export * from './character'
 *   export * from './equipment'
 *   export * from './battle'
 *   export * from './dungeon'
 *   export * from './social'
 *   export * from './pvp'
 */

export * from './auth'

// 导出请求实例和通用类型，供需要直接使用的场景
export { default as request } from './request'
export type { ApiResponse, ApiError } from './request'
