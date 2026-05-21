/**
 * 首页模块类型定义
 * 覆盖玩家统计、推荐副本、活动公告、更新公告
 */

/** 玩家今日统计数据 */
export interface PlayerDailyStats {
  /** 在线时长（分钟） */
  onlineMinutes: number
  /** 今日战斗次数 */
  battleCount: number
  /** 今日胜场数 */
  winCount: number
  /** 今日获得金币 */
  goldEarned: number
}

/** 推荐副本/地图项 */
export interface RecommendedArea {
  id: string
  /** 区域或副本名称 */
  name: string
  /** 等级范围 */
  levelRange: string
  /** 推荐理由 */
  reason: string
  /** 类型：野外区域 or 副本 */
  type: 'wild' | 'dungeon'
  /** 关联的区域 ID，用于跳转 */
  areaId: string
}

/** 活动公告 */
export interface ActivityAnnouncement {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'ongoing' | 'upcoming' | 'ended'
}

/** 更新公告 */
export interface UpdateAnnouncement {
  id: string
  version: string
  title: string
  date: string
  changes: string[]
}

/** 首页概览响应（汇总所有模块数据） */
export interface HomeOverview {
  stats: PlayerDailyStats
  recommendations: RecommendedArea[]
  activities: ActivityAnnouncement[]
  updates: UpdateAnnouncement[]
}