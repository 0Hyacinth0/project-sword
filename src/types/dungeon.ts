/**
 * 副本系统类型定义
 * 涵盖副本配置、楼层、运行状态等核心类型
 */
import type { AreaMonster } from './map'
import type { BattleRewards, BattleRewardItem } from './battle'
import type { RoomMember } from './team'

/** 副本难度 */
export type DungeonDifficulty = 'normal' | 'elite'

/** 副本楼层配置 */
export interface DungeonFloor {
  /** 楼层编号（1-indexed） */
  floorNumber: number
  /** 楼层敌人列表（1-3 个） */
  enemies: AreaMonster[]
  /** 是否为 Boss 层 */
  isBossFloor: boolean
}

/** 副本奖励配置 */
export interface DungeonRewardConfig {
  /** 通关保底掉落 */
  guaranteedItems: { itemId: number; name: string; quantity: number; rarity: string }[]
  /** 通关额外经验 */
  bonusExp: number
  /** 通关额外金币 */
  bonusGold: number
}

/** 掉落物品条目（掉落表） */
export interface DungeonDropEntry {
  /** 物品 ID */
  itemId: number
  /** 物品名称 */
  name: string
  /** 物品类型 */
  itemType: 'equipment' | 'material' | 'pet_egg'
  /** 品质 */
  quality: 'common' | 'rare' | 'epic' | 'legendary'
  /** 基础掉落率 (0.0-1.0) */
  dropRate: number
  /** 最小数量 */
  minQuantity: number
  /** 最大数量 */
  maxQuantity: number
  /** 是否为精英副本专属掉落 */
  eliteOnly?: boolean
}

/** 副本掉落表（按楼层类型分组） */
export interface DungeonDropTable {
  /** 普通/精英楼层掉落池 */
  floorDrops: DungeonDropEntry[]
  /** Boss 楼层掉落池 */
  bossDrops: DungeonDropEntry[]
  /** 掉落率倍率（普通=1.0, 精英=1.5） */
  dropRateMultiplier: number
}

/** 副本静态配置 */
export interface DungeonConfig {
  /** 副本 ID */
  id: string
  /** 副本名称 */
  name: string
  /** 所属区域 ID */
  areaId: string
  /** 难度 */
  difficulty: DungeonDifficulty
  /** 体力消耗 */
  staminaCost: number
  /** 等级要求 */
  levelRequirement: number
  /** 总层数 */
  totalFloors: number
  /** 楼层配置 */
  floors: DungeonFloor[]
  /** 通关奖励 */
  rewards: DungeonRewardConfig
}

/** 副本运行状态 */
export type DungeonRunStatus = 'active' | 'floor_complete' | 'floor_defeat' | 'complete' | 'retreated'

/** 楼层战斗结果 */
export interface DungeonFloorResult {
  /** 楼层编号 */
  floorNumber: number
  /** 战斗结果 */
  outcome: 'victory' | 'defeat'
  /** 该层奖励 */
  rewards: BattleRewards | null
  /** 多人副本成员掉落分配 */
  memberDrops?: MemberDropDistribution[]
}

/** 副本运行状态（运行时） */
export interface DungeonRunState {
  /** 副本 ID */
  dungeonId: string
  /** 当前楼层 */
  currentFloor: number
  /** 总层数 */
  totalFloors: number
  /** 运行状态 */
  status: DungeonRunStatus
  /** 累积奖励 */
  accumulatedRewards: BattleRewards
  /** 楼层历史 */
  floorHistory: DungeonFloorResult[]
  /** 楼层间 HP 延续百分比 */
  playerHpPercent: number
  /** 楼层间 MP 延续百分比 */
  playerMpPercent: number
  /** 房间成员列表（多人副本时） */
  roomMembers?: RoomMember[]
  /** 是否为多人副本 */
  isMultiPlayer?: boolean
}

/** 成员掉落分配 */
export interface MemberDropDistribution {
  /** 角色ID */
  characterId: string
  /** 角色名 */
  characterName: string
  /** 该成员获得的掉落物品 */
  drops: BattleRewardItem[]
}
