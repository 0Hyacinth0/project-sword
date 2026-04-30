/**
 * 战宠相关类型定义
 * 与后端战宠数据结构对应
 */

/** 战宠稀有度（品质）：N/R/SR/SSR */
export type PetRarity = 1 | 2 | 3 | 4

/** 战宠属性 */
export interface PetStats {
  hp: number                 // 生命值
  maxHp: number              // 最大生命值
  attack: number             // 攻击力
  defense: number            // 防御力
  speed: number              // 速度
}

/** 战宠给主人的属性加成 */
export interface PetOwnerBonus {
  hp?: number                // 生命值加成
  attack?: number            // 攻击力加成
  defense?: number           // 防御力加成
  criticalRate?: number      // 暴击率加成
  dodgeRate?: number         // 闪避率加成
}

/** 战宠技能 */
export interface PetSkill {
  id: number                 // 技能 ID
  name: string               // 技能名称
  type: string               // 技能类型（主动攻击/被动）
  power?: number             // 技能威力
  cooldown?: number          // 冷却回合数
  description?: string       // 技能描述
}

/** 战宠装备 */
export interface PetEquipment {
  armor: string | null       // 护甲装备 ID
  accessory: string | null   // 饰品装备 ID
}

/** 战宠基本信息（概览用） */
export interface PetInfo {
  id: string                 // 战宠实例 UUID
  petTypeId: number          // 战宠类型 ID
  nickname: string           // 战宠昵称
  level: number              // 战宠等级
  exp: number                // 当前经验
  maxExp: number             // 升级所需经验
  rarity: PetRarity          // 稀有度
  isActive: boolean          // 是否出战
  stats: PetStats            // 战宠属性
  bonusToOwner: PetOwnerBonus // 给主人的加成
  skills?: PetSkill[]        // 技能列表（可选）
  equipment?: PetEquipment   // 装备（可选）
}

/** 战宠详细信息 */
export interface PetDetailInfo extends PetInfo {
  element: number            // 元素类型（1-6）
  evolveTo?: number          // 进化目标类型 ID
  evolveLevel?: number       // 进化所需等级
  iconUrl?: string           // 图标 URL
  description?: string       // 战宠描述
}

/** 战宠容量信息 */
export interface PetCapacity {
  max: number                // 最大容量
  current: number            // 当前数量
}

/** 战宠列表响应 */
export interface PetListResult {
  pets: PetInfo[]
  capacity: PetCapacity
}

/** 战宠稀有度标签 */
export const PET_RARITY_LABEL: Record<PetRarity, string> = {
  1: 'N',
  2: 'R',
  3: 'SR',
  4: 'SSR'
}

/** 战宠稀有度颜色（参考 DESIGN.md） */
export const PET_RARITY_COLORS: Record<PetRarity, { light: string; dark: string }> = {
  1: { light: '#8e8e93', dark: '#8f93a3' },      // N - 灰色
  2: { light: '#0071e3', dark: '#59a6ff' },      // R - 蓝色
  3: { light: '#af52de', dark: '#c282ff' },      // SR - 紫色
  4: { light: '#ff9500', dark: '#ff9b52' }       // SSR - 金色
}