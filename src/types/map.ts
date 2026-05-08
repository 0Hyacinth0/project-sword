/**
 * 地图区域相关类型定义
 */

/** 区域怪物信息 */
export interface AreaMonster {
  /** 怪物 ID */
  id: string
  /** 怪物名称 */
  name: string
  /** 怪物等级 */
  level: number
  /** 怪物类型：普通/精英/Boss */
  type: 'normal' | 'elite' | 'boss'
}

/** 区域掉落预览 */
export interface AreaDrop {
  /** 物品 ID */
  itemId: number
  /** 物品名称 */
  name: string
  /** 稀有度（仅展示稀有以上） */
  rarity: 'Rare' | 'Epic' | 'Legendary'
}

/** 地图区域 */
export interface MapArea {
  /** 区域 ID */
  id: string
  /** 区域名称 */
  name: string
  /** 区域 emoji 图标 */
  icon: string
  /** 等级范围 [最低, 最高] */
  levelRange: [number, number]
  /** 区域描述 */
  description: string
  /** 怪物列表 */
  monsters: AreaMonster[]
  /** 掉落预览 */
  drops: AreaDrop[]
  /** 解锁所需等级 */
  unlockLevel: number
}

/** 区域解锁状态 */
export type AreaStatus = 'current' | 'unlocked' | 'locked' | 'undiscovered'