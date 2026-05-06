/**
 * 装备强化配置
 * 定义强化等级上限、材料消耗、属性加成倍率
 */
import type { EquipmentRarity } from '../types/equipment'

/** 最大强化等级 */
export const MAX_ENHANCE_LEVEL = 10

/** 各稀有度的强化属性加成倍率（每级提升基础属性的百分比） */
export const ENHANCE_BONUS_RATE: Record<EquipmentRarity, number> = {
  Normal: 0.05,      // 每级 +5% 基础属性
  Rare: 0.06,        // 每级 +6%
  Epic: 0.08,        // 每级 +8%
  Legendary: 0.10    // 每级 +10%
}

/** 强化材料消耗配置（按强化等级区间） */
export const ENHANCE_COST: Array<{
  /** 起始等级（含） */
  fromLevel: number
  /** 结束等级（不含） */
  toLevel: number
  /** 消耗材料（材料 itemId → 数量） */
  materials: Record<number, number>
  /** 金币消耗 */
  gold: number
  /** 成功率 */
  successRate: number
}> = [
  { fromLevel: 0, toLevel: 3, materials: { 2001: 3 }, gold: 100, successRate: 1.0 },
  { fromLevel: 3, toLevel: 6, materials: { 2002: 2 }, gold: 300, successRate: 0.9 },
  { fromLevel: 6, toLevel: 8, materials: { 2003: 1 }, gold: 800, successRate: 0.7 },
  { fromLevel: 8, toLevel: 10, materials: { 2003: 2, 2004: 1 }, gold: 2000, successRate: 0.5 }
]

/** 强化材料名称映射 */
export const ENHANCE_MATERIAL_NAMES: Record<number, string> = {
  2001: '铁矿石',
  2002: '精钢矿石',
  2003: '秘法水晶',
  2004: '龙鳞碎片'
}

/**
 * 获取指定强化等级区间的消耗配置
 * @param currentLevel - 当前强化等级
 */
export function getEnhanceCost(currentLevel: number) {
  return ENHANCE_COST.find(c => currentLevel >= c.fromLevel && currentLevel < c.toLevel)
}

/**
 * 计算强化后的属性值
 * @param baseValue - 基础属性值
 * @param enhanceLevel - 强化等级
 * @param rarity - 装备稀有度
 */
export function getEnhancedValue(baseValue: number | undefined, enhanceLevel: number, rarity: EquipmentRarity): number {
  if (!baseValue) return 0
  const rate = ENHANCE_BONUS_RATE[rarity] || 0.05
  const bonus = Math.round(baseValue * rate * enhanceLevel)
  return baseValue + bonus
}

/**
 * 格式化强化等级显示
 */
export function formatEnhanceLevel(level: number | undefined): string {
  if (!level || level <= 0) return ''
  return `+${level}`
}
