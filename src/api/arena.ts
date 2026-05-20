/**
 * 竞技场相关 API
 * 获取赛季信息、玩家竞技场数据
 */
import request from './request'
import type { ApiResponse } from './request'
import type { ArenaSeason, ArenaPlayerData } from '../types/arena'

/**
 * 获取竞技场赛季信息
 * @returns 赛季信息数据
 */
export async function getArenaSeasonApi(): Promise<ApiResponse<ArenaSeason>> {
  const res = await request.get<ApiResponse<ArenaSeason>>('/arena/season')
  return res.data
}

/**
 * 获取玩家竞技场数据
 * @param characterId - 角色 ID（后端通过 query 参数读取）
 * @returns 玩家竞技场数据
 */
export async function getArenaPlayerDataApi(characterId?: string): Promise<ApiResponse<ArenaPlayerData>> {
  const res = await request.get<ApiResponse<ArenaPlayerData>>('/arena/me', {
    params: characterId ? { characterId } : undefined
  })
  return res.data
}
