/**
 * 排行榜系统类型定义
 */

/** 排行榜分类 */
export type LeaderboardCategory = 'level' | 'power' | 'arena'

/** 排行榜范围 */
export type LeaderboardScope = 'all' | 'friends'

/** 排行条目 */
export interface LeaderboardEntry {
  /** 排名 */
  rank: number
  /** 角色 ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 职业 */
  profession: string
  /** 等级 */
  level: number
  /** 排序值（等级=等级，战力=战力，竞技=积分） */
  value: number
  /** 是否在线 */
  isOnline: boolean
}

/** 排行榜 API 响应 */
export interface LeaderboardResponse {
  /** 排行条目列表 */
  entries: LeaderboardEntry[]
  /** 当前角色排名（不在列表中时使用） */
  myRank: number
  /** 当前角色排序值 */
  myValue: number
}