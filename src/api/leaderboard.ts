/**
 * 排行榜相关 API
 * 获取全服/好友排行榜数据
 */
import request from './request'
import type { ApiResponse } from './request'
import type { LeaderboardCategory, LeaderboardScope, LeaderboardResponse } from '../types/leaderboard'

/**
 * 获取排行榜数据
 * @param category - 排行分类
 * @param scope - 排行范围
 */
export async function getLeaderboardApi(
  category: LeaderboardCategory,
  scope: LeaderboardScope
): Promise<ApiResponse<LeaderboardResponse>> {
  const res = await request.get<ApiResponse<LeaderboardResponse>>(`/leaderboard/${category}`, { params: { scope } })
  return res.data
}
