/**
 * 组队系统类型定义
 * 包含队伍信息、成员、申请等数据结构
 */

/** 队伍成员角色 */
export type TeamRole = 'leader' | 'member'

/** 队伍状态 */
export type TeamStatus = 'open' | 'closed' | 'in_dungeon'

/** 入队申请状态 */
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

/** 队伍成员信息 */
export interface TeamMember {
  characterId: string
  characterName: string
  profession: string
  level: number
  role: TeamRole
  status: 'online' | 'offline' | 'ready'
  joinedAt: string
}

/** 队伍信息 */
export interface TeamInfo {
  id: string
  leaderId: string
  leaderName: string
  members: TeamMember[]
  maxMembers: number
  status: TeamStatus
  targetDungeon?: string
  createdAt: string
}

/** 入队申请 */
export interface TeamApplication {
  id: string
  teamId: string
  applicantId: string
  applicantName: string
  applicantProfession: string
  applicantLevel: number
  status: ApplicationStatus
  createdAt: string
}

// ── 多人副本大厅 ──

/** 房间成员准备状态 */
export type ReadyStatus = 'not_ready' | 'ready'

/** 副本房间状态 */
export type RoomStatus = 'waiting' | 'ready' | 'starting' | 'in_progress'

/** 房间成员 */
export interface RoomMember {
  characterId: string
  characterName: string
  profession: string
  level: number
  readyStatus: ReadyStatus
}

/** 副本房间信息 */
export interface DungeonRoom {
  roomId: string
  teamId: string
  dungeonId: string
  dungeonName: string
  difficulty: 'normal' | 'elite'
  leaderId: string
  members: RoomMember[]
  status: RoomStatus
  createdAt: string
}
