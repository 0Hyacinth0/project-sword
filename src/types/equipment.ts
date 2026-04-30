/**
 * 装备相关类型定义
 * 与后端装备数据结构对应
 */

/** 装备槽位类型 */
export type EquipmentSlotType = 'weapon' | 'helmet' | 'chest' | 'legs' | 'accessory1' | 'accessory2'

/** 装备稀有度（品质） */
export type EquipmentRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

/** 装备属性 */
export interface EquipmentStats {
  physicalAttack?: number    // 物理攻击
  magicAttack?: number       // 魔法攻击
  defense?: number           // 防御力
  hp?: number                // 生命值加成
  mp?: number                // 魔法值加成
  criticalRate?: number      // 暴击率加成（百分比）
  dodgeRate?: number         // 闪避率加成（百分比）
  strength?: number          // 力量加成
  intelligence?: number      // 智力加成
  agility?: number           // 敏捷加成
}

/** 装备信息 */
export interface Equipment {
  id: string                 // 装备 UUID
  name: string               // 装备名称
  rarity: EquipmentRarity    // 稀有度
  slotType: EquipmentSlotType // 槽位类型
  stats: EquipmentStats      // 装备属性
  setId?: string             // 套装 ID（可选）
  setName?: string           // 套装名称（可选）
  iconUrl?: string           // 图标 URL（可选）
  description?: string       // 装备描述（可选）
  levelRequirement?: number  // 等级需求（可选）
}

/** 六槽位装备数据结构 */
export interface EquipmentSlots {
  weapon: Equipment | null
  helmet: Equipment | null
  chest: Equipment | null
  legs: Equipment | null
  accessory1: Equipment | null
  accessory2: Equipment | null
}

/** 套装效果 */
export interface SetBonus {
  setId: string              // 套装 ID
  setName: string            // 套装名称
  equippedCount: number      // 已装备数量
  totalCount: number         // 套装总件数
  bonuses: Array<{
    requiredCount: number    // 需要装备件数
    description: string      // 效果描述
    stats: EquipmentStats    // 属性加成
  }>
}

/** 装备稀有度映射编号（与后端对应） */
export const RARITY_CODE: Record<EquipmentRarity, number> = {
  Normal: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3
}

/** 编号映射稀有度 */
export const CODE_TO_RARITY: Record<number, EquipmentRarity> = {
  0: 'Normal',
  1: 'Rare',
  2: 'Epic',
  3: 'Legendary'
}