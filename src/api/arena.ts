/**
 * 竞技场相关 API
 * 获取赛季信息、玩家竞技场数据
 */
import request from './request'
import type { ApiResponse } from './request'
import type { ArenaSeason, ArenaPlayerData } from '../types/arena'
import { isMockEnabled } from '../utils/mockConfig'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Mock 赛季数据 */
const mockSeasonData: ArenaSeason = {
  seasonId: 'season-4',
  seasonName: '星辉远征',
  seasonNumber: 4,
  startDate: '2026-05-01',
  endDate: '2026-08-01',
  isActive: true
}

/** Mock 玩家竞技场数据 */
const mockPlayerData: ArenaPlayerData = {
  tier: 'platinum',
  subTier: 'II',
  score: 2050,
  wins: 42,
  losses: 28,
  winRate: 60,
  seasonId: 'season-4'
}

/**
 * 获取竞技场赛季信息
 * @returns 赛季信息数据
 */
export async function getArenaSeasonApi(): Promise<ApiResponse<ArenaSeason>> {
  if (isMockEnabled()) {
    await delay(300)
    return { code: 200, message: '操作成功', data: mockSeasonData }
  }
  const res = await request.get<ApiResponse<ArenaSeason>>('/arena/season')
  return res.data
}

/**
 * 获取玩家竞技场数据
 * @returns 玩家竞技场数据
 */
export async function getArenaPlayerDataApi(): Promise<ApiResponse<ArenaPlayerData>> {
  if (isMockEnabled()) {
    await delay(300)
    return { code: 200, message: '操作成功', data: mockPlayerData }
  }
  const res = await request.get<ApiResponse<ArenaPlayerData>>('/arena/me')
  return res.data
}
