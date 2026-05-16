/**
 * PVP 匹配相关 API
 * 开始匹配、结算战斗结果
 */
import request from './request'
import type { ApiResponse } from './request'
import { isMockEnabled } from '../utils/mockConfig'
import type { PvpOpponent, PvpScoreResult } from '../types/pvp'
import { selectMockOpponent, calculateEloScore } from '../config/pvp_config'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 开始 PVP 匹配
 * @param myScore - 当前积分
 * @returns 匹配到的对手信息
 */
export async function startMatchmakingApi(myScore: number): Promise<ApiResponse<PvpOpponent>> {
  if (isMockEnabled()) {
    // 模拟 3-8 秒的随机延迟
    const mockDelay = 3000 + Math.random() * 5000
    await delay(mockDelay)

    // 从 Mock 对手池中选择对手
    const opponent = selectMockOpponent(myScore)
    return {
      code: 200,
      message: '匹配成功',
      data: opponent
    }
  }

  // 真实后端调用
  const res = await request.post<ApiResponse<PvpOpponent>>('/arena/match', { myScore })
  return res.data
}

/**
 * 结算 PVP 战斗结果
 * @param opponentId - 对手 ID
 * @param won - 是否获胜
 * @param myScore - 我的积分
 * @param opponentScore - 对手积分
 * @returns 积分结算结果
 */
export async function settlePvpBattleApi(
  opponentId: string,
  won: boolean,
  myScore: number,
  opponentScore: number
): Promise<ApiResponse<PvpScoreResult>> {
  if (isMockEnabled()) {
    // 计算积分变化
    const elo = calculateEloScore(myScore, opponentScore)
    const scoreChange = won ? elo.win : -elo.lose
    const newScore = myScore + scoreChange

    // TODO: 实现段位逻辑，目前返回固定值
    const mockResult: PvpScoreResult = {
      scoreChange,
      oldScore: myScore,
      newScore,
      tierChanged: false,
      oldTier: { tier: 'gold', subTier: 'I', score: myScore },
      newTier: { tier: 'gold', subTier: 'I', score: newScore }
    }

    return {
      code: 200,
      message: '结算成功',
      data: mockResult
    }
  }

  // 真实后端调用
  const res = await request.post<ApiResponse<PvpScoreResult>>('/arena/settle', {
    opponentId,
    won,
    myScore,
    opponentScore
  })
  return res.data
}