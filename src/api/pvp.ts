/**
 * PVP 匹配相关 API
 * 开始匹配、结算战斗结果
 */
import request from './request'
import type { ApiResponse } from './request'
import type { PvpOpponent, PvpScoreResult } from '../types/pvp'

/**
 * 开始 PVP 匹配
 * @param myScore - 当前积分
 * @param characterId - 角色 ID（后端通过 @RequestParam 读取）
 * @returns 匹配到的对手信息
 */
export async function startMatchmakingApi(myScore: number, characterId?: string): Promise<ApiResponse<PvpOpponent>> {
  const res = await request.post<ApiResponse<PvpOpponent>>('/arena/match', { score: myScore }, {
    params: characterId ? { characterId } : undefined
  })
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
  const res = await request.post<ApiResponse<PvpScoreResult>>('/arena/settle', {
    opponentId,
    won,
    myScore,
    opponentScore
  })
  return res.data
}
