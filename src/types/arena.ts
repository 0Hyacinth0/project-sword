/**
 * 竞技场系统类型定义
 * 赛季、段位、战绩等核心类型
 */

/** 段位等级 */
export type ArenaTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'king'

/** 段位小级 */
export type ArenaSubTier = 'I' | 'II' | 'III'

/** 赛季信息 */
export interface ArenaSeason {
  /** 赛季 ID */
  seasonId: string
  /** 赛季名称 */
  seasonName: string
  /** 赛季编号 */
  seasonNumber: number
  /** 开始日期 */
  startDate: string
  /** 结束日期 */
  endDate: string
  /** 是否进行中 */
  isActive: boolean
}

/** 竞技场玩家数据 */
export interface ArenaPlayerData {
  /** 当前段位 */
  tier: ArenaTier
  /** 当前小级 */
  subTier: ArenaSubTier
  /** 积分 */
  score: number
  /** 胜场 */
  wins: number
  /** 败场 */
  losses: number
  /** 胜率 */
  winRate: number
  /** 赛季 ID */
  seasonId: string
}

/** 段位配置 */
export interface ArenaTierConfig {
  /** 段位标识 */
  tier: ArenaTier
  /** 段位中文名 */
  name: string
  /** 最低积分 */
  minScore: number
  /** 最高积分（-1 表示无上限） */
  maxScore: number
  /** 颜色 */
  color: string
  /** 图标 */
  icon: string
}

/** 段位解析结果 */
export interface TierInfo {
  tier: ArenaTier
  subTier: ArenaSubTier
  tierName: string
  progress: number
  remainingScore: number
}