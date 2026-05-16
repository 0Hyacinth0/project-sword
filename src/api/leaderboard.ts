/**
 * 排行榜相关 API
 * 获取全服/好友排行榜数据
 */
import request from './request'
import type { ApiResponse } from './request'
import type { LeaderboardCategory, LeaderboardScope, LeaderboardResponse } from '../types/leaderboard'
import { isMockEnabled } from '../utils/mockConfig'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Mock 角色名池 */
const MOCK_NAMES = ['勇者', '星辰', '月影', '小红', '小明', '风云', '天命', '破晓', '烈焰', '寒霜', '紫电', '青锋', '银翼', '金鳞', '碧落', '苍穹', '玄冰', '赤焰', '白虹', '墨渊']

/** Mock 职业池 */
const PROFESSIONS = ['Warrior', 'Mage', 'Hunter']

/** 生成 Mock 排行数据 */
function generateMockEntries(category: LeaderboardCategory, count: number): LeaderboardResponse {
  const entries = MOCK_NAMES.slice(0, count).map((name, i) => {
    const level = Math.max(1, 30 - i + Math.floor(Math.random() * 3))
    let value: number
    switch (category) {
      case 'level':
        value = level
        break
      case 'power':
        value = Math.floor((500 + level * 150) * (1 - i * 0.04) + Math.random() * 200)
        break
      case 'arena':
        value = Math.floor((2000 - i * 60) + Math.random() * 100)
        break
    }
    return {
      rank: i + 1,
      characterId: `char-mock-${i + 1}`,
      characterName: name,
      profession: PROFESSIONS[i % 3],
      level,
      value,
      isOnline: Math.random() > 0.4
    }
  })

  return {
    entries,
    myRank: Math.floor(Math.random() * 10) + 11,
    myValue: category === 'level' ? 18 : category === 'power' ? 2800 : 1200
  }
}

/**
 * 获取排行榜数据
 * @param category - 排行分类
 * @param scope - 排行范围
 */
export async function getLeaderboardApi(
  category: LeaderboardCategory,
  scope: LeaderboardScope
): Promise<ApiResponse<LeaderboardResponse>> {
  if (isMockEnabled()) {
    await delay(400)
    const count = scope === 'friends' ? 6 : 20
    const data = generateMockEntries(category, count)
    return { code: 200, message: '操作成功', data }
  }
  const res = await request.get<ApiResponse<LeaderboardResponse>>(`/leaderboard/${category}`, { params: { scope } })
  return res.data
}