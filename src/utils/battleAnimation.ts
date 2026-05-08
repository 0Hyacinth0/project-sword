/**
 * 战斗动画管理器
 * 管理战斗中的视觉反馈动画：浮动文字、单位动画、震屏效果
 */

import { reactive, ref } from 'vue'
import type { DamageResult } from '../types/battle'

// ──────────────────────────────────────────
// 浮动文字
// ──────────────────────────────────────────

/** 浮动文字类型 */
export type FloatingTextType = 'damage' | 'critical' | 'heal' | 'dodge' | 'buff' | 'miss'

/** 浮动文字实例 */
export interface FloatingText {
  /** 唯一 ID */
  id: number
  /** 目标单位 UID（决定显示位置） */
  targetUid: string
  /** 文字内容 */
  text: string
  /** 类型 */
  type: FloatingTextType
}

// ──────────────────────────────────────────
// 单位动画
// ──────────────────────────────────────────

/** 单位动画类型 */
export type UnitAnimType = 'attack' | 'hit' | 'crit-hit' | 'heal' | 'dodge' | 'death' | 'buff-apply'

// ──────────────────────────────────────────
// 动画状态
// ──────────────────────────────────────────

let nextId = 0

/** 浮动文字列表 */
const floatingTexts = ref<FloatingText[]>([])

/** 单位动画状态 { uid: animType } */
const unitAnims = reactive<Record<string, UnitAnimType>>({})

/** 屏幕震动 */
export const screenShake = ref(false)

// ──────────────────────────────────────────
// 公开方法
// ──────────────────────────────────────────

/**
 * 触发伤害结果动画
 * @param results - 伤害/治疗结果列表
 * @param actorUid - 行动者 UID（用于播放攻击动画）
 */
export function triggerDamageAnimations(results: DamageResult[], actorUid?: string): void {
  if (!results || results.length === 0) return

  // 攻击者动画
  if (actorUid) {
    setUnitAnim(actorUid, 'attack')
  }

  for (const result of results) {
    // 浮动文字
    const ftType = result.isDodged
      ? 'dodge'
      : result.isHeal
        ? 'heal'
        : result.isCritical
          ? 'critical'
          : 'damage'

    const ftText = result.isDodged
      ? 'MISS'
      : result.isHeal
        ? `+${result.value}`
        : `-${result.value}`

    addFloatingText(result.targetUid, ftText, ftType)

    // 目标单位动画
    if (result.isDodged) {
      setUnitAnim(result.targetUid, 'dodge')
    } else if (result.isCritical) {
      setUnitAnim(result.targetUid, 'crit-hit')
      triggerScreenShake()
    } else if (result.isHeal) {
      setUnitAnim(result.targetUid, 'heal')
    } else if (result.value > 0) {
      setUnitAnim(result.targetUid, 'hit')
    }
  }
}

/**
 * 触发 Buff 应用动画
 * @param targetUid - 目标 UID
 * @param isDebuff - 是否为 Debuff
 */
export function triggerBuffAnimation(targetUid: string, isDebuff: boolean): void {
  addFloatingText(targetUid, isDebuff ? 'DEBUFF' : 'BUFF', 'buff')
  setUnitAnim(targetUid, 'buff-apply')
}

/**
 * 触发死亡动画
 * @param uid - 死亡单位 UID
 */
export function triggerDeathAnimation(uid: string): void {
  setUnitAnim(uid, 'death')
}

/**
 * 触发屏幕震动
 */
export function triggerScreenShake(): void {
  screenShake.value = true
  setTimeout(() => {
    screenShake.value = false
  }, 300)
}

/**
 * 获取单位当前动画类型
 * @param uid - 单位 UID
 * @returns 动画类型或 null
 */
export function getUnitAnim(uid: string): UnitAnimType | null {
  return unitAnims[uid] ?? null
}

/**
 * 清除单位动画（由组件动画结束后调用）
 * @param uid - 单位 UID
 */
export function clearUnitAnim(uid: string): void {
  delete unitAnims[uid]
}

// ──────────────────────────────────────────
// 内部方法
// ──────────────────────────────────────────

/** 添加浮动文字 */
function addFloatingText(targetUid: string, text: string, type: FloatingTextType): void {
  const id = ++nextId
  floatingTexts.value = [...floatingTexts.value, { id, targetUid, text, type }]
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter(ft => ft.id !== id)
  }, 1200)
}

/** 设置单位动画 */
function setUnitAnim(uid: string, anim: UnitAnimType): void {
  unitAnims[uid] = anim
}

/**
 * 获取浮动文字的快照（组件调用用）
 * @returns 当前浮动文字列表
 */
export function getFloatingTexts(): FloatingText[] {
  return floatingTexts.value
}
