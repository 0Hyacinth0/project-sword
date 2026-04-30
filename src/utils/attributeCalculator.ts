/**
 * 角色属性计算模块
 * 实现力量/智力/敏捷 → 衍生属性的完整计算公式
 * 前后端计算逻辑需保持一致
 */

import type { EquipmentSlots, EquipmentStats } from '../types/equipment'
import type { PetOwnerBonus } from '../types/pet'

// ──────────────────────────────────────────
// 公式参数配置
// ──────────────────────────────────────────

/** 力量对 HP 的换算系数：1 点力量 = 5 HP */
const STR_TO_HP = 5

/** 智力对 MP 的换算系数：1 点智力 = 5 MP */
const INT_TO_MP = 5

/** 力量对物理攻击的换算系数：1 点力量 = 2 物攻 */
const STR_TO_PHYSICAL_ATTACK = 2

/** 智力对魔法攻击的换算系数：1 点智力 = 2 魔攻 */
const INT_TO_MAGIC_ATTACK = 2

/** 敏捷对物理攻击的换算系数：1 点敏捷 = 0.5 物攻 */
const AGI_TO_PHYSICAL_ATTACK = 0.5

/** 敏捷对闪避率的换算系数：1 点敏捷 = 0.5% 闪避 */
const AGI_TO_DODGE = 0.005

/** 敏捷对暴击率的换算系数：1 点敏捷 = 0.4% 暴击 */
const AGI_TO_CRITICAL = 0.004

/** HP 基础值 */
const BASE_HP = 80

/** MP 基础值 */
const BASE_MP = 20

/** 防御基础值（与属性无关，仅靠装备） */
const BASE_DEFENSE = 5

// ──────────────────────────────────────────
// 职业加成系数
// ──────────────────────────────────────────

/**
 * 职业属性加成配置
 * 不同职业对主属性有额外的百分比加成
 */
const PROFESSION_BONUS: Record<number, {
  hpMultiplier: number
  mpMultiplier: number
  physicalAttackMultiplier: number
  magicAttackMultiplier: number
  defenseBonus: number
}> = {
  1: { // 战士：高生存、稳定物理输出
    hpMultiplier: 1.2,
    mpMultiplier: 0.8,
    physicalAttackMultiplier: 1.15,
    magicAttackMultiplier: 0.8,
    defenseBonus: 3
  },
  2: { // 法师：脆皮、高爆发魔攻
    hpMultiplier: 0.8,
    mpMultiplier: 1.3,
    physicalAttackMultiplier: 0.7,
    magicAttackMultiplier: 1.2,
    defenseBonus: 0
  },
  3: { // 猎人：高暴击、高闪避
    hpMultiplier: 0.9,
    mpMultiplier: 0.9,
    physicalAttackMultiplier: 1.0,
    magicAttackMultiplier: 0.9,
    defenseBonus: 1
  }
}

// ──────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────

/** 基础属性输入 */
export interface BaseAttributes {
  strength: number
  intelligence: number
  agility: number
}

/** 计算后的完整衍生属性 */
export interface DerivedStats {
  maxHp: number
  maxMp: number
  physicalAttack: number
  magicAttack: number
  defense: number
  dodgeRate: number
  criticalRate: number
}

/** 各来源的属性加成分项（用于 UI 展示加成明细） */
export interface StatsBreakdown {
  base: DerivedStats
  equipment: DerivedStats
  pet: PetOwnerBonus
  total: DerivedStats
}

// ──────────────────────────────────────────
// 核心计算函数
// ──────────────────────────────────────────

/**
 * 根据基础属性和职业计算裸装衍生属性
 * @param attrs - 基础属性（力量、智力、敏捷）
 * @param profession - 职业编号：1-战士, 2-法师, 3-猎人
 * @returns 衍生属性
 */
export function calculateBaseStats(attrs: BaseAttributes, profession: number): DerivedStats {
  const bonus = PROFESSION_BONUS[profession] ?? PROFESSION_BONUS[1]

  const maxHp = Math.floor(
    (BASE_HP + attrs.strength * STR_TO_HP) * bonus.hpMultiplier
  )
  const maxMp = Math.floor(
    (BASE_MP + attrs.intelligence * INT_TO_MP) * bonus.mpMultiplier
  )
  const physicalAttack = Math.floor(
    (attrs.strength * STR_TO_PHYSICAL_ATTACK + attrs.agility * AGI_TO_PHYSICAL_ATTACK) * bonus.physicalAttackMultiplier
  )
  const magicAttack = Math.floor(
    (attrs.intelligence * INT_TO_MAGIC_ATTACK) * bonus.magicAttackMultiplier
  )
  const defense = BASE_DEFENSE + bonus.defenseBonus
  const dodgeRate = parseFloat((attrs.agility * AGI_TO_DODGE).toFixed(4))
  const criticalRate = parseFloat((attrs.agility * AGI_TO_CRITICAL).toFixed(4))

  return { maxHp, maxMp, physicalAttack, magicAttack, defense, dodgeRate, criticalRate }
}

/**
 * 汇总所有装备的属性加成
 * @param equipment - 六槽位装备数据
 * @returns 装备属性汇总
 */
export function sumEquipmentStats(equipment: EquipmentSlots | null): DerivedStats {
  if (!equipment) {
    return { maxHp: 0, maxMp: 0, physicalAttack: 0, magicAttack: 0, defense: 0, dodgeRate: 0, criticalRate: 0 }
  }

  const slots: Array<(typeof equipment)[keyof EquipmentSlots]> = [
    equipment.weapon,
    equipment.helmet,
    equipment.chest,
    equipment.legs,
    equipment.accessory1,
    equipment.accessory2
  ]

  return slots.reduce<DerivedStats>((sum, eq) => {
    if (!eq) return sum
    const s: EquipmentStats = eq.stats
    return {
      maxHp: sum.maxHp + (s.hp ?? 0),
      maxMp: sum.maxMp + (s.mp ?? 0),
      physicalAttack: sum.physicalAttack + (s.physicalAttack ?? 0),
      magicAttack: sum.magicAttack + (s.magicAttack ?? 0),
      defense: sum.defense + (s.defense ?? 0),
      dodgeRate: sum.dodgeRate + (s.dodgeRate ?? 0),
      criticalRate: sum.criticalRate + (s.criticalRate ?? 0)
    }
  }, { maxHp: 0, maxMp: 0, physicalAttack: 0, magicAttack: 0, defense: 0, dodgeRate: 0, criticalRate: 0 })
}

/**
 * 战宠给主人的属性加成
 * @param petBonus - 战宠加成数据
 * @returns 标准化的加成数据
 */
export function getPetBonus(petBonus: PetOwnerBonus | null): DerivedStats {
  if (!petBonus) {
    return { maxHp: 0, maxMp: 0, physicalAttack: 0, magicAttack: 0, defense: 0, dodgeRate: 0, criticalRate: 0 }
  }
  return {
    maxHp: petBonus.hp ?? 0,
    maxMp: 0,
    physicalAttack: petBonus.attack ?? 0,
    magicAttack: 0,
    defense: petBonus.defense ?? 0,
    dodgeRate: petBonus.dodgeRate ?? 0,
    criticalRate: petBonus.criticalRate ?? 0
  }
}

/**
 * 叠加两个属性对象
 */
function addStats(a: DerivedStats, b: DerivedStats): DerivedStats {
  return {
    maxHp: a.maxHp + b.maxHp,
    maxMp: a.maxMp + b.maxMp,
    physicalAttack: a.physicalAttack + b.physicalAttack,
    magicAttack: a.magicAttack + b.magicAttack,
    defense: a.defense + b.defense,
    dodgeRate: parseFloat((a.dodgeRate + b.dodgeRate).toFixed(4)),
    criticalRate: parseFloat((a.criticalRate + b.criticalRate).toFixed(4))
  }
}

/**
 * 计算角色完整属性（基础 + 装备 + 战宠）
 * @param attrs - 基础属性
 * @param profession - 职业编号
 * @param equipment - 装备数据
 * @param petBonus - 出战战宠加成
 * @returns 完整属性明细
 */
export function calculateFullStats(
  attrs: BaseAttributes,
  profession: number,
  equipment: EquipmentSlots | null,
  petBonus: PetOwnerBonus | null
): StatsBreakdown {
  const base = calculateBaseStats(attrs, profession)
  const equip = sumEquipmentStats(equipment)
  const pet = getPetBonus(petBonus)
  const total = addStats(addStats(base, equip), pet)

  return { base, equipment: equip, pet, total }
}

/**
 * 加点预览：计算分配指定点数后的属性变化
 * @param current - 当前基础属性
 * @param profession - 职业编号
 * @param allocation - 要分配的点数 { str, int, agi }
 * @returns 加点后的衍生属性
 */
export function previewAllocateStats(
  current: BaseAttributes,
  profession: number,
  allocation: { str: number; int: number; agi: number }
): DerivedStats {
  return calculateBaseStats({
    strength: current.strength + allocation.str,
    intelligence: current.intelligence + allocation.int,
    agility: current.agility + allocation.agi
  }, profession)
}
