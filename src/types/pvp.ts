/**
 * PVP 竞技匹配类型定义
 * 匹配状态、对手信息、积分结算
 */
import type { ArenaTier, ArenaSubTier, TierInfo } from './arena'

/** 匹配状态 */
export type PvpMatchState = 'idle' | 'searching' | 'found' | 'ready' | 'in_battle' | 'settling'

/** 匹配到的对手信息 */
export interface PvpOpponent {
  /** 对手角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 段位 */
  tier: ArenaTier
  /** 小级 */
  subTier: ArenaSubTier
  /** 竞技积分 */
  score: number
}

/** 积分结算结果 */
export interface PvpScoreResult {
  /** 积分变化（正=胜，负=败） */
  scoreChange: number
  /** 原积分 */
  oldScore: number
  /** 新积分 */
  newScore: number
  /** 是否升/降段 */
  tierChanged: boolean
  /** 原段位信息 */
  oldTier: TierInfo
  /** 新段位信息 */
  newTier: TierInfo
}

/** 预计积分变化 */
export interface EstimatedScore {
  /** 胜利可获积分 */
  win: number
  /** 失败扣除积分 */
  lose: number
}