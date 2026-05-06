/**
 * 随机词条配置
 * 定义词条池、各稀有度的词条数量和值范围、词条生成函数
 */
import type { ExtraStat } from '../types/equipment'
import type { ItemRarity } from '../types/item'

/** 词条属性 key 池 */
export const AFFIX_STAT_KEYS = [
  'physicalAttack',
  'magicAttack',
  'defense',
  'hp',
  'mp',
  'criticalRate',
  'dodgeRate',
  'strength',
  'intelligence',
  'agility'
] as const

/** 词条中文名映射 */
export const AFFIX_LABELS: Record<string, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  hp: '生命',
  mp: '魔力',
  criticalRate: '暴击',
  dodgeRate: '闪避',
  strength: '力量',
  intelligence: '智力',
  agility: '敏捷'
}

/** 各稀有度的随机词条数量范围 */
export const AFFIX_COUNT_RANGE: Record<string, { min: number; max: number }> = {
  Normal: { min: 0, max: 0 },
  Rare: { min: 1, max: 2 },
  Epic: { min: 3, max: 4 },
  Legendary: { min: 4, max: 6 }
}

/** 各属性在不同稀有度下的值范围 */
export const AFFIX_VALUE_RANGE: Record<string, Record<string, { min: number; max: number }>> = {
  Rare: {
    physicalAttack: { min: 2, max: 5 },
    magicAttack: { min: 2, max: 5 },
    defense: { min: 1, max: 4 },
    hp: { min: 10, max: 30 },
    mp: { min: 5, max: 20 },
    criticalRate: { min: 0.01, max: 0.03 },
    dodgeRate: { min: 0.01, max: 0.02 },
    strength: { min: 1, max: 3 },
    intelligence: { min: 1, max: 3 },
    agility: { min: 1, max: 3 }
  },
  Epic: {
    physicalAttack: { min: 4, max: 10 },
    magicAttack: { min: 4, max: 10 },
    defense: { min: 3, max: 8 },
    hp: { min: 20, max: 60 },
    mp: { min: 15, max: 40 },
    criticalRate: { min: 0.02, max: 0.05 },
    dodgeRate: { min: 0.02, max: 0.04 },
    strength: { min: 2, max: 5 },
    intelligence: { min: 2, max: 5 },
    agility: { min: 2, max: 5 }
  },
  Legendary: {
    physicalAttack: { min: 8, max: 18 },
    magicAttack: { min: 8, max: 18 },
    defense: { min: 5, max: 14 },
    hp: { min: 40, max: 100 },
    mp: { min: 30, max: 70 },
    criticalRate: { min: 0.03, max: 0.08 },
    dodgeRate: { min: 0.03, max: 0.06 },
    strength: { min: 3, max: 8 },
    intelligence: { min: 3, max: 8 },
    agility: { min: 3, max: 8 }
  }
}

/**
 * 区间内随机整数
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 区间内随机浮点数（保留两位小数）
 */
function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

/**
 * 从数组中随机取 n 个不重复元素
 */
function pickRandom<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/**
 * 根据稀有度生成随机词条（前端 Mock 用）
 * @param rarity - 装备稀有度
 * @param existingKeys - 需要排除的已有基础属性 key（避免与基础属性重复）
 */
export function generateExtraStats(rarity: ItemRarity, existingKeys: string[] = []): ExtraStat[] {
  const range = AFFIX_COUNT_RANGE[rarity]
  if (!range || range.max === 0) return []

  const count = randInt(range.min, range.max)
  const valueRange = AFFIX_VALUE_RANGE[rarity]
  if (!valueRange) return []

  // 排除已有基础属性的 key（随机词条不与基础属性重复）
  const availableKeys = AFFIX_STAT_KEYS.filter(k => !existingKeys.includes(k))
  const selectedKeys = pickRandom(availableKeys, Math.min(count, availableKeys.length))

  return selectedKeys.map(key => {
    const vr = valueRange[key]
    if (!vr) return { key, value: 0 }

    // 百分比类属性用浮点数，其他用整数
    const isPercent = key === 'criticalRate' || key === 'dodgeRate'
    const value = isPercent ? randFloat(vr.min, vr.max) : randInt(vr.min, vr.max)

    return { key, value }
  })
}

/**
 * 格式化词条值（百分比类显示为百分比，其他直接显示数字）
 */
export function formatAffixValue(key: string, value: number): string {
  const isPercent = key === 'criticalRate' || key === 'dodgeRate'
  return isPercent ? `+${(value * 100).toFixed(1)}%` : `+${value}`
}
