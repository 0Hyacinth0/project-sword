/**
 * 首页 API
 * 提供玩家统计、推荐副本、活动公告、更新公告能力
 */
import type { ApiResponse } from './request'
import type { HomeOverview, PlayerDailyStats, RecommendedArea, ActivityAnnouncement, UpdateAnnouncement } from '../types/home'

// ── Mock 数据 ──

const mockStats: PlayerDailyStats = {
  onlineMinutes: 135,
  battleCount: 12,
  winCount: 9,
  goldEarned: 1280
}

const mockRecommendations: RecommendedArea[] = [
  {
    id: 'rec-1',
    name: '迷雾森林',
    levelRange: 'Lv.1-10',
    reason: '适合当前等级，可获取经验与基础装备',
    type: 'wild',
    areaId: 'mist_forest'
  },
  {
    id: 'rec-2',
    name: '哥布林洞穴',
    levelRange: 'Lv.5-15',
    reason: '推荐秘境：掉落刺客初级套装材料',
    type: 'dungeon',
    areaId: 'goblin_cave'
  }
]

const mockActivities: ActivityAnnouncement[] = [
  {
    id: 'act-1',
    title: '五一限时活动「勇者试炼」',
    description: '通关任意精英副本可获传说装备碎片，集齐10片可兑换随机传说装备',
    startTime: '2026-05-01T00:00:00Z',
    endTime: '2026-05-07T23:59:59Z',
    status: 'ongoing'
  },
  {
    id: 'act-2',
    title: '新区「冰霜雪原」即将开放',
    description: '全新区域 Lv.31-40 即将开放，冰巨人、雪狼等你挑战',
    startTime: '2026-05-10T00:00:00Z',
    endTime: '2026-06-10T23:59:59Z',
    status: 'upcoming'
  },
  {
    id: 'act-3',
    title: '战宠进化材料掉率翻倍',
    description: '活动期间所有副本的战宠进化材料掉率提升至 2 倍',
    startTime: '2026-04-25T00:00:00Z',
    endTime: '2026-04-30T23:59:59Z',
    status: 'ended'
  }
]

const mockUpdates: UpdateAnnouncement[] = [
  {
    id: 'upd-1',
    version: 'v1.3.0',
    title: '战宠系统全面上线',
    date: '2026-05-20',
    changes: [
      '新增战宠获取、出战、喂食、进化功能',
      '战宠作为独立单位参与回合制战斗',
      '新增 10 种战宠类型，含 N/R/SR/SSR 品质',
      '新增战宠图鉴页面，记录收集进度',
      '修复部分装备套装效果未正确触发的问题'
    ]
  },
  {
    id: 'upd-2',
    version: 'v1.2.0',
    title: '竞技场与 PVP 对战',
    date: '2026-05-15',
    changes: [
      '新增实时 PVP 竞技场，支持 Elo 积分匹配',
      '新增 6 级段位系统（青铜至王者）',
      '新增 30 秒出招倒计时',
      '新增非实时好友挑战功能'
    ]
  }
]

// ── API 函数 ──

/**
 * 获取首页概览数据（统计+推荐+活动+更新）。
 * 当前使用 Mock 数据，后续对接真实 API。
 * @returns 首页概览响应
 */
export async function getHomeOverviewApi(): Promise<ApiResponse<HomeOverview>> {
  // TODO: 对接真实 API 后替换为：
  // const res = await request.get<ApiResponse<HomeOverview>>('/home/overview')
  // return res.data

  return {
    code: 200,
    message: '操作成功',
    data: {
      stats: mockStats,
      recommendations: mockRecommendations,
      activities: mockActivities,
      updates: mockUpdates
    }
  }
}

/**
 * 获取玩家今日统计数据。
 * @returns 统计数据响应
 */
export async function getHomeStatsApi(): Promise<ApiResponse<PlayerDailyStats>> {
  // TODO: const res = await request.get<ApiResponse<PlayerDailyStats>>('/home/stats')
  // return res.data
  return { code: 200, message: '操作成功', data: mockStats }
}

/**
 * 获取推荐副本/地图。
 * @returns 推荐列表响应
 */
export async function getHomeRecommendationsApi(): Promise<ApiResponse<RecommendedArea[]>> {
  // TODO: const res = await request.get<ApiResponse<RecommendedArea[]>>('/home/recommendations')
  // return res.data
  return { code: 200, message: '操作成功', data: mockRecommendations }
}

/**
 * 获取活动公告列表。
 * @returns 活动公告响应
 */
export async function getHomeActivitiesApi(): Promise<ApiResponse<ActivityAnnouncement[]>> {
  // TODO: const res = await request.get<ApiResponse<ActivityAnnouncement[]>>('/home/activities')
  // return res.data
  return { code: 200, message: '操作成功', data: mockActivities }
}

/**
 * 获取更新公告列表。
 * @returns 更新公告响应
 */
export async function getHomeUpdatesApi(): Promise<ApiResponse<UpdateAnnouncement[]>> {
  // TODO: const res = await request.get<ApiResponse<UpdateAnnouncement[]>>('/home/updates')
  // return res.data
  return { code: 200, message: '操作成功', data: mockUpdates }
}