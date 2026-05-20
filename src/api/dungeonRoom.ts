/**
 * 多人副本大厅 API
 * 创建副本房间、准备/取消准备、开始挑战、离开房间
 * 当前为 Mock 实现，后期替换为 WebSocket 实时通信
 */
import request from './request'
import type { ApiResponse } from './request'
import type { DungeonRoom } from '../types/team'
import { DUNGEON_CONFIGS } from '../config/dungeon_config'

/**
 * 获取所有可挑战的副本配置
 * @returns 副本配置列表
 */
export function getDungeonConfigsForRoomApi() {
  return DUNGEON_CONFIGS
}

/**
 * 创建副本房间
 * @param teamId - 队伍 ID
 * @param dungeonId - 副本 ID
 */
export async function createDungeonRoomApi(
  teamId: string,
  dungeonId: string
): Promise<ApiResponse<DungeonRoom>> {
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/create', { teamId, dungeonId })
  return res.data
}

/**
 * 获取当前房间信息
 * @param roomId - 房间 ID
 */
export async function getDungeonRoomApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  const res = await request.get<ApiResponse<DungeonRoom>>(`/dungeon-room/${roomId}`)
  return res.data
}

/**
 * 切换准备状态
 * @param roomId - 房间 ID
 */
export async function toggleReadyApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/ready', { roomId })
  return res.data
}

/**
 * 队长开始挑战（全员准备后才可调用）
 * @param roomId - 房间 ID
 */
export async function startDungeonRoomApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/start', { roomId })
  return res.data
}

/**
 * 离开副本房间
 * @param roomId - 房间 ID
 */
export async function leaveDungeonRoomApi(roomId: string): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<null>>('/dungeon-room/leave', { roomId })
  return res.data
}

/**
 * 取消副本房间（队长专用）
 * @param roomId - 房间 ID
 */
export async function cancelDungeonRoomApi(roomId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<null>>(`/dungeon-room/cancel/${roomId}`)
  return res.data
}
