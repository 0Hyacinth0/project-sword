/**
 * 完整伤害计算模块
 * 包含：攻击/防御计算、暴击、闪避、元素克制、防御穿透、伤害减免
 * 前后端公式需保持完全一致
 */

import type { CombatantStats, BuffEffect } from '../types/battle'

// ──────────────────────────────────────────
// 常量配置
// ──────────────────────────────────────────

/** 暴击伤害倍率 */
export const CRIT_MULTIPLIER = 1.5

/** 伤害随机波动范围 (±10%) */
export const DAMAGE_VARIANCE = 0.1

/** 最低伤害（保底） */
export const MIN_DAMAGE = 1

/** 防御有效系数（防御只抵消 50% 的等效值） */
export const DEFENSE_EFFICIENCY = 0.5

/** 暴击率上限 */
export const MAX_CRIT_RATE = 0.8

/** 闪避率上限 */
export const MAX_DODGE_RATE = 0.8

/** 克制伤害加成 (30%) */
export const ADVANTAGE_MULTIPLIER = 1.3

/** 被克制伤害减免 (-30%) */
export const DISADVANTAGE_MULTIPLIER = 0.7

// ──────────────────────────────────────────
// 元素克制系统
// ──────────────────────────────────────────

/** 元素枚举：0-无, 1-火, 2-水, 3-风, 4-地, 5-光, 6-暗 */
export type Element = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 元素克制关系：火→风→地→水→火, 光↔暗 */
const ELEMENT_ADVANTAGE: Record<number, number> = {
  1: 3,  // 火 克制 风
  2: 1,  // 水 克制 火
  3: 4,  // 风 克制 地
  4: 2,  // 地 克制 水
  5: 6,  // 光 克制 暗
  6: 5   // 暗 克制 光
}

/**
 * 判断元素克制关系
 * @param attackerElement - 攻击者元素
 * @param defenderElement - 防御者元素
 * @returns 1=克制, -1=被克制, 0=无关系
 */
export function getElementAdvantage(attackerElement: Element, defenderElement: Element): 1 | -1 | 0 {
  if (attackerElement === 0 || defenderElement === 0) return 0
  if (ELEMENT_ADVANTAGE[attackerElement] === defenderElement) return 1
  if (ELEMENT_ADVANTAGE[defenderElement] === attackerElement) return -1
  return 0
}

/**
 * 获取元素克制倍率
 * @param advantage - 克制关系 (1/-1/0)
 * @returns 伤害倍率
 */
export function getElementMultiplier(advantage: 1 | -1 | 0): number {
  if (advantage === 1) return ADVANTAGE_MULTIPLIER
  if (advantage === -1) return DISADVANTAGE_MULTIPLIER
  return 1.0
}

// ──────────────────────────────────────────
// Buff 属性修正
// ──────────────────────────────────────────

/**
 * 计算含 Buff 加成后的实际属性
 * @param stats - 基础属性
 * @param buffs - 当前身上的 Buff 列表
 * @returns 加成后的属性
 */
export function applyBuffModifiers(stats: CombatantStats, buffs: BuffEffect[]): CombatantStats {
  const modified = { ...stats }
  for (const buff of buffs) {
    const key = buff.stat as keyof CombatantStats
    const current = modified[key] ?? 0
    const adjusted = current + buff.value
    modified[key] = buff.isDebuff ? Math.max(0, adjusted) : adjusted
  }
  return modified
}

// ──────────────────────────────────────────
// 判定函数
// ──────────────────────────────────────────

/**
 * 闪避判定
 * @param dodgeRate - 闪避率 (0~1)
 * @returns 是否闪避成功
 */
export function rollDodge(dodgeRate: number): boolean {
  const rate = Math.max(0, Math.min(MAX_DODGE_RATE, dodgeRate))
  return Math.random() < rate
}

/**
 * 暴击判定
 * @param criticalRate - 暴击率 (0~1)
 * @returns 是否暴击
 */
export function rollCritical(criticalRate: number): boolean {
  const rate = Math.max(0, Math.min(MAX_CRIT_RATE, criticalRate))
  return Math.random() < rate
}

// ──────────────────────────────────────────
// 核心伤害公式
// ──────────────────────────────────────────

/** 伤害计算明细（用于 UI 展示和调试） */
export interface DamageBreakdown {
  /** 攻击者原始攻击力 */
  attackerRawAttack: number
  /** 技能倍率 */
  skillMultiplier: number
  /** Buff 加成后攻击力 */
  attackerBuffedAttack: number
  /** 防御者原始防御力 */
  defenderRawDefense: number
  /** Buff 加成后防御力 */
  defenderBuffedDefense: number
  /** 有效防御（defense × 0.5） */
  effectiveDefense: number
  /** 基础伤害（攻击 - 有效防御） */
  baseDamage: number
  /** 随机波动系数 */
  varianceFactor: number
  /** 波动后伤害 */
  damageAfterVariance: number
  /** 元素克制关系 (1/-1/0) */
  elementAdvantage: 1 | -1 | 0
  /** 元素倍率 */
  elementMultiplier: number
  /** 元素调整后伤害 */
  damageAfterElement: number
  /** 是否暴击 */
  isCritical: boolean
  /** 暴击倍率（暴击时 1.5，否则 1.0） */
  critMultiplier: number
  /** 暴击后伤害 */
  damageAfterCrit: number
  /** 是否闪避 */
  isDodged: boolean
  /** 最终伤害（闪避时为 0） */
  finalDamage: number
}

/**
 * 完整伤害计算流程
 * 公式链：基础伤害 → 随机波动 → 元素克制 → 暴击 → 闪避 → 最终伤害
 *
 * @param attackerStats - 攻击者属性（含 Buff）
 * @param defenderStats - 防御者属性（含 Buff）
 * @param skillMultiplier - 技能倍率（普通攻击 = 1.0）
 * @param attackerElement - 攻击者元素
 * @param defenderElement - 防御者元素
 * @param isSkillAttack - 是否为技能攻击（影响防御计算）
 * @returns 伤害计算结果（含明细）
 */
export function calculateDamage(
  attackerStats: CombatantStats,
  defenderStats: CombatantStats,
  skillMultiplier: number = 1.0,
  attackerElement: Element = 0,
  defenderElement: Element = 0
): DamageBreakdown {
  const result: DamageBreakdown = {
    attackerRawAttack: attackerStats.physicalAttack,
    skillMultiplier,
    attackerBuffedAttack: attackerStats.physicalAttack,
    defenderRawDefense: defenderStats.defense,
    defenderBuffedDefense: defenderStats.defense,
    effectiveDefense: 0,
    baseDamage: 0,
    varianceFactor: 1,
    damageAfterVariance: 0,
    elementAdvantage: 0,
    elementMultiplier: 1,
    damageAfterElement: 0,
    isCritical: false,
    critMultiplier: 1,
    damageAfterCrit: 0,
    isDodged: false,
    finalDamage: 0
  }

  // 1. 基础伤害 = 攻击力 × 技能倍率 - 防御力 × 0.5
  result.effectiveDefense = Math.floor(defenderStats.defense * DEFENSE_EFFICIENCY)
  result.baseDamage = Math.max(0, Math.floor(attackerStats.physicalAttack * skillMultiplier) - result.effectiveDefense)

  // 2. 随机波动 (±10%)
  result.varianceFactor = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE
  result.damageAfterVariance = Math.max(MIN_DAMAGE, Math.floor(result.baseDamage * result.varianceFactor))

  // 3. 元素克制
  result.elementAdvantage = getElementAdvantage(attackerElement, defenderElement)
  result.elementMultiplier = getElementMultiplier(result.elementAdvantage)
  result.damageAfterElement = Math.max(MIN_DAMAGE, Math.floor(result.damageAfterVariance * result.elementMultiplier))

  // 4. 暴击判定
  result.isCritical = rollCritical(attackerStats.criticalRate)
  result.critMultiplier = result.isCritical ? CRIT_MULTIPLIER : 1.0
  result.damageAfterCrit = result.isCritical
    ? Math.max(MIN_DAMAGE, Math.floor(result.damageAfterElement * CRIT_MULTIPLIER))
    : result.damageAfterElement

  // 5. 闪避判定
  result.isDodged = rollDodge(defenderStats.dodgeRate)
  result.finalDamage = result.isDodged ? 0 : result.damageAfterCrit

  return result
}

/**
 * 治疗量计算
 * @param casterStats - 施法者属性
 * @param skillMultiplier - 技能治疗倍率
 * @returns 治疗量
 */
export function calculateHeal(casterStats: CombatantStats, skillMultiplier: number = 1.0): number {
  const baseHeal = Math.floor(casterStats.magicAttack * skillMultiplier)
  const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE
  return Math.max(1, Math.floor(baseHeal * variance))
}

/**
 * 计算实际治疗量（不超过最大 HP - 当前 HP）
 * @param healAmount - 治疗量
 * @param currentHp - 当前 HP
 * @param maxHp - 最大 HP
 * @returns 实际治疗量
 */
export function capHealAmount(healAmount: number, currentHp: number, maxHp: number): number {
  return Math.min(healAmount, maxHp - currentHp)
}

// ──────────────────────────────────────────
// 伤害公式汇总（供 UI 展示）
// ──────────────────────────────────────────

/** 伤害公式说明文本 */
export const DAMAGE_FORMULA_TEXT = {
  base: '基础伤害 = floor(攻击力 × 技能倍率) - floor(防御力 × 0.5)',
  variance: '波动伤害 = max(1, floor(基础伤害 × (1 ± 10%)))',
  element: '克制伤害 = floor(波动伤害 × 1.3) ｜ 被克制 = × 0.7',
  crit: '暴击伤害 = floor(克制伤害 × 1.5) ｜ 暴击率上限 80%',
  dodge: '闪避时伤害 = 0 ｜ 闪避率上限 80%',
  heal: '治疗量 = floor(魔法攻击 × 技能倍率 × (1 ± 10%))',
  elementChart: '火→风→地→水→火 ｜ 光↔暗'
}
