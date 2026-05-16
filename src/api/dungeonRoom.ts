/**
 * 多人副本大厅 API
 * 创建副本房间、准备/取消准备、开始挑战、离开房间
 * 当前为 Mock 实现，后期替换为 WebSocket 实时通信
 */
import request from './request'
import type { ApiResponse } from './request'
import type { DungeonRoom, RoomMember } from '../types/team'
import { DUNGEON_CONFIGS } from '../config/dungeon_config'
import { isMockEnabled } from '../utils/mockConfig'
import { getMockCurrentCharacterId } from './mockSession'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// Mock 数据
// ──────────────────────────────────────────

/** Mock 当前房间 */
let mockRoom: DungeonRoom | null = null

/**
 * 将队伍成员转换为房间成员
 * @param teamMembers - 队伍成员列表
 * @param leaderId - 队长 ID
 */
function toRoomMembers(teamMembers: { characterId: string; characterName: string; profession: string; level: number; role: string }[], leaderId: string): RoomMember[] {
  return teamMembers.map(m => ({
    characterId: m.characterId,
    characterName: m.characterName,
    profession: m.profession,
    level: m.level,
    readyStatus: m.characterId === leaderId ? 'ready' : 'not_ready'
  }))
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

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
 * @param teamMembers - 队伍成员列表
 * @param leaderId - 队长 ID
 */
export async function createDungeonRoomApi(
  teamId: string,
  dungeonId: string,
  teamMembers: { characterId: string; characterName: string; profession: string; level: number; role: string }[],
  leaderId: string
): Promise<ApiResponse<DungeonRoom>> {
  if (isMockEnabled()) {
    await delay(300)
    const config = DUNGEON_CONFIGS.find(d => d.id === dungeonId)
    if (!config) {
      return { code: 404, message: '副本不存在', data: null as unknown as DungeonRoom }
    }
    const room: DungeonRoom = {
      roomId: `room-${Date.now()}`,
      teamId,
      dungeonId,
      dungeonName: config.name,
      difficulty: config.difficulty,
      leaderId,
      members: toRoomMembers(teamMembers, leaderId),
      status: 'waiting',
      createdAt: new Date().toISOString()
    }
    mockRoom = room
    // 模拟：非队长成员 2-3 秒后自动准备
    simulateAutoReady(room)
    return { code: 200, message: '房间创建成功', data: room }
  }
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/create', { teamId, dungeonId })
  return res.data
}

/**
 * 获取当前房间信息
 * @param roomId - 房间 ID
 */
export async function getDungeonRoomApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  if (isMockEnabled()) {
    await delay(100)
    if (!mockRoom || mockRoom.roomId !== roomId) {
      return { code: 404, message: '房间不存在', data: null as unknown as DungeonRoom }
    }
    return { code: 200, message: '获取成功', data: mockRoom }
  }
  const res = await request.get<ApiResponse<DungeonRoom>>(`/dungeon-room/${roomId}`)
  return res.data
}

/**
 * 切换准备状态
 * @param roomId - 房间 ID
 */
export async function toggleReadyApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  if (isMockEnabled()) {
    await delay(200)
    if (!mockRoom || mockRoom.roomId !== roomId) {
      return { code: 404, message: '房间不存在', data: null as unknown as DungeonRoom }
    }
    const member = mockRoom.members.find(m => m.characterId === getMockCurrentCharacterId())
    if (member) {
      member.readyStatus = member.readyStatus === 'ready' ? 'not_ready' : 'ready'
    }
    // 更新房间状态
    updateRoomStatus(mockRoom)
    return { code: 200, message: '状态已更新', data: mockRoom }
  }
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/ready', { roomId })
  return res.data
}

/**
 * 队长开始挑战（全员准备后才可调用）
 * @param roomId - 房间 ID
 */
export async function startDungeonRoomApi(roomId: string): Promise<ApiResponse<DungeonRoom>> {
  if (isMockEnabled()) {
    await delay(300)
    if (!mockRoom || mockRoom.roomId !== roomId) {
      return { code: 404, message: '房间不存在', data: null as unknown as DungeonRoom }
    }
    if (mockRoom.leaderId !== getMockCurrentCharacterId()) {
      return { code: 403, message: '只有队长可以开始', data: null as unknown as DungeonRoom }
    }
    const allReady = mockRoom.members.every(m => m.readyStatus === 'ready')
    if (!allReady) {
      return { code: 400, message: '还有成员未准备', data: null as unknown as DungeonRoom }
    }
    mockRoom.status = 'in_progress'
    return { code: 200, message: '挑战开始', data: mockRoom }
  }
  const res = await request.post<ApiResponse<DungeonRoom>>('/dungeon-room/start', { roomId })
  return res.data
}

/**
 * 离开副本房间
 * @param roomId - 房间 ID
 */
export async function leaveDungeonRoomApi(roomId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    mockRoom = null
    return { code: 200, message: '已离开房间', data: null }
  }
  const res = await request.post<ApiResponse<null>>('/dungeon-room/leave', { roomId })
  return res.data
}

/**
 * 取消副本房间（队长专用）
 * @param roomId - 房间 ID
 */
export async function cancelDungeonRoomApi(roomId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    await delay(200)
    mockRoom = null
    return { code: 200, message: '房间已取消', data: null }
  }
  const res = await request.delete<ApiResponse<null>>(`/dungeon-room/cancel/${roomId}`)
  return res.data
}

// ──────────────────────────────────────────
// Mock 辅助：模拟队员自动准备
// ──────────────────────────────────────────

/**
 * 模拟非队长成员自动准备
 * @param room - 房间信息
 */
function simulateAutoReady(room: DungeonRoom): void {
  const otherMembers = room.members.filter(m => m.characterId !== room.leaderId)
  otherMembers.forEach((member, index) => {
    setTimeout(() => {
      if (mockRoom && mockRoom.roomId === room.roomId) {
        member.readyStatus = 'ready'
        updateRoomStatus(mockRoom)
      }
    }, 2000 + index * 1000)
  })
}

/**
 * 更新房间状态
 * @param room - 房间信息
 */
function updateRoomStatus(room: DungeonRoom): void {
  const allReady = room.members.every(m => m.readyStatus === 'ready')
  room.status = allReady ? 'ready' : 'waiting'
}
