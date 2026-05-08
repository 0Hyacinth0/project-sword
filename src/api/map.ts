/**
 * 地图相关 API
 * 进入区域探索、获取区域详情
 */
import request from './request'
import type { ApiResponse } from './request'
import type { MapArea } from '../types/map'
import { MAP_AREAS } from '../config/map_config'
import { isMockEnabled } from '../utils/mockConfig'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 区域详情响应 */
export interface AreaDetailResponse {
  area: MapArea
  /** 当前探索次数（每日限制等，后续扩展） */
  exploreCount: number
}

/** 进入区域请求 */
export interface EnterAreaRequest {
  characterId: string
  areaId: string
}

/** 进入区域响应 */
export interface EnterAreaResponse {
  areaId: string
  message: string
}

/**
 * 获取区域详情
 * @param areaId - 区域 ID
 * @returns 区域详情
 */
export async function getAreaDetailApi(areaId: string): Promise<ApiResponse<AreaDetailResponse>> {
  if (isMockEnabled()) {
    await delay(300)
    const area = MAP_AREAS.find(a => a.id === areaId)
    if (!area) {
      return { code: 404, message: '区域不存在', data: null as unknown as AreaDetailResponse }
    }
    return { code: 200, message: '操作成功', data: { area, exploreCount: 0 } }
  }
  return request.get(`/map/area/${areaId}`)
}

/**
 * 进入区域探索（触发野外战斗）
 * @param data - 进入区域请求参数
 * @returns 进入结果
 */
export async function enterAreaApi(data: EnterAreaRequest): Promise<ApiResponse<EnterAreaResponse>> {
  if (isMockEnabled()) {
    await delay(500)
    const area = MAP_AREAS.find(a => a.id === data.areaId)
    if (!area) {
      return { code: 404, message: '区域不存在', data: null as unknown as EnterAreaResponse }
    }
    return {
      code: 200,
      message: '操作成功',
      data: { areaId: data.areaId, message: `进入了${area.name}` }
    }
  }
  return request.post('/map/enter', data)
}

/**
 * 获取全部区域列表
 * @returns 区域数组
 */
export async function getAreaListApi(): Promise<ApiResponse<MapArea[]>> {
  if (isMockEnabled()) {
    await delay(200)
    return { code: 200, message: '操作成功', data: MAP_AREAS }
  }
  return request.get('/map/areas')
}