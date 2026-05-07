/**
 * 回合制战斗引擎
 * 实现完整的战斗状态机流程：
 * 回合开始 → Buff/Debuff结算 → 行动选择 → 伤害计算 → 闪避/暴击判定 → 结算 → 回合结束
 */

import {
  BattlePhase,
  type BattleState,
  type Combatant,
  type BattleAction,
  type BattleSkill,
  type DamageResult,
  type BuffSettlementResult,
  type BuffTemplate,
  type BuffEffect,
  type BattleLogEntry,
  type BattleRewards,
  type ActionOrderEntry
} from '../types/battle'
import type { SkillConfig, PassiveTrigger } from '../config/skill_config'
import {
  calculateDamage,
  calculateHeal,
  capHealAmount,
  applyBuffModifiers
} from './damageCalculator'

// ──────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────

/** 生成唯一 ID */
function uid(): string {
  return Math.random().toString(36).substring(2, 10)
}

/** 限定数值范围 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ──────────────────────────────────────────
// 行动值 (ATB) 系统
// ──────────────────────────────────────────

/** 行动值阈值：当行动值累积到此值时可行动 */
const ACTION_VALUE_THRESHOLD = 1000

/**
 * 推进所有单位的行动值
 * 每个单位每 tick 累积 actionValue += speed
 * 直到有单位达到阈值
 * @param combatants - 所有单位
 * @returns 行动值满的单位 uid 列表（按行动值降序）
 */
export function tickActionValues(combatants: Combatant[]): string[] {
  const alive = combatants.filter(c => c.isAlive)
  const ready: string[] = []

  // 循环 tick 直到至少一个单位行动值满
  let maxIterations = 200
  while (ready.length === 0 && maxIterations-- > 0) {
    for (const c of alive) {
      const speed = getEffectiveSpeed(c)
      c.actionValue += speed
      if (c.actionValue >= ACTION_VALUE_THRESHOLD && !ready.includes(c.uid)) {
        ready.push(c.uid)
      }
    }
  }

  // 按行动值降序（行动值更高的先行动）
  return ready.sort((a, b) => {
    const ca = alive.find(c => c.uid === a)!
    const cb = alive.find(c => c.uid === b)!
    return cb.actionValue - ca.actionValue
  })
}

/**
 * 获取考虑 Buff 后的实际速度
 * @param combatant - 参战单位
 * @returns 实际速度值
 */
function getEffectiveSpeed(combatant: Combatant): number {
  let speed = combatant.stats.speed
  for (const buff of combatant.buffs) {
    if (buff.stat === 'speed') {
      speed += buff.value
    }
  }
  return Math.max(1, speed)
}

/**
 * 生成行动顺序预览（用于 UI 行动顺序条）
 * 模拟后续多次 tick，预测未来 N 个行动者
 * @param combatants - 所有单位
 * @param count - 预测未来行动次数
 * @returns 行动顺序条目列表
 */
export function generateActionOrderPreview(combatants: Combatant[], count: number = 8): ActionOrderEntry[] {
  const alive = combatants.filter(c => c.isAlive)
  if (alive.length === 0) return []

  // 克隆单位用于模拟
  const clones = alive.map(c => ({
    uid: c.uid,
    name: c.name,
    side: c.side,
    type: c.type,
    actionValue: c.actionValue,
    speed: getEffectiveSpeed(c),
    isAlive: true
  }))

  const preview: ActionOrderEntry[] = []

  for (let i = 0; i < count; i++) {
    // 推进 tick 直到有人满
    let readyUid: string | null = null
    let maxIter = 200
    while (!readyUid && maxIter-- > 0) {
      for (const clone of clones) {
        clone.actionValue += clone.speed
        if (clone.actionValue >= ACTION_VALUE_THRESHOLD && !readyUid) {
          readyUid = clone.uid
        }
      }
    }

    if (!readyUid) break

    // 找到行动值满的克隆
    const actor = clones.find(c => c.uid === readyUid)
    if (!actor) break

    preview.push({
      uid: actor.uid,
      name: actor.name,
      side: actor.side,
      type: actor.type,
      actionValue: actor.actionValue,
      actionValuePercent: Math.min(1, actor.actionValue / ACTION_VALUE_THRESHOLD),
      isAlive: true
    })

    // 重置该单位的行动值
    actor.actionValue -= ACTION_VALUE_THRESHOLD
  }

  return preview
}

// ──────────────────────────────────────────
// 状态机：创建与查询
// ──────────────────────────────────────────

/**
 * 创建初始战斗状态
 * 所有单位初始行动值 = 随机 0~threshold * 0.5（避免所有人同时满）
 * @param allies - 友方单位（玩家 + 战宠）
 * @param enemies - 敌方单位
 * @returns 初始战斗状态
 */
export function createBattleState(allies: Combatant[], enemies: Combatant[]): BattleState {
  // 为所有单位初始化行动值（基于速度加随机偏移，速度高的初始值略高）
  const all = [...allies, ...enemies]
  for (const c of all) {
    if (c.actionValue === undefined) {
      c.actionValue = Math.floor(Math.random() * ACTION_VALUE_THRESHOLD * 0.5 + c.stats.speed * 2)
    }
  }

  return {
    phase: BattlePhase.ROUND_START,
    round: 1,
    combatants: all,
    actionOrder: [],
    currentActorIndex: 0,
    waitingForPlayerAction: false,
    log: [{
      round: 1,
      type: 'system',
      message: '战斗开始！',
      timestamp: Date.now()
    }],
    outcome: null,
    rewards: null,
    lastDamageResults: [],
    lastBuffResults: [],
    actionOrderPreview: []
  }
}

/**
 * 根据行动值计算出手顺序
 * 推进行动值直到有单位达到阈值，返回行动顺序
 * @param combatants - 所有存活单位
 * @returns 按行动值排列的 uid 列表
 */
export function calculateActionOrder(combatants: Combatant[]): string[] {
  return tickActionValues(combatants)
}

/**
 * 获取当前行动者
 * @param state - 战斗状态
 * @returns 当前行动的参战单位，若无可返回 null
 */
export function getCurrentActor(state: BattleState): Combatant | null {
  if (state.actionOrder.length === 0) return null
  const uid = state.actionOrder[state.currentActorIndex]
  return state.combatants.find(c => c.uid === uid) ?? null
}

/**
 * 根据 uid 查找参战单位
 * @param state - 战斗状态
 * @param uid - 单位 uid
 * @returns 对应参战单位或 undefined
 */
export function getCombatantByUid(state: BattleState, uid: string): Combatant | undefined {
  return state.combatants.find(c => c.uid === uid)
}

/**
 * 获取指定阵营的存活单位
 * @param state - 战斗状态
 * @param side - 阵营
 * @returns 存活单位列表
 */
export function getAliveCombatants(state: BattleState, side?: 'ally' | 'enemy'): Combatant[] {
  return state.combatants.filter(c =>
    c.isAlive && (side === undefined || c.side === side)
  )
}

/**
 * 获取可攻击目标列表（敌方存活单位）
 * @param state - 战斗状态
 * @param actorSide - 行动者阵营
 * @returns 可攻击目标列表
 */
export function getAvailableTargets(state: BattleState, actorSide: 'ally' | 'enemy'): Combatant[] {
  const targetSide = actorSide === 'ally' ? 'enemy' : 'ally'
  return state.combatants.filter(c => c.isAlive && c.side === targetSide)
}

// ──────────────────────────────────────────
// 状态机：阶段处理
// ──────────────────────────────────────────

/**
 * 回合开始阶段
 * - 推进行动值，确定出手顺序
 * - 生成行动顺序预览
 * - 重置行动者的行动值
 * @param state - 当前战斗状态
 * @returns 更新后的状态
 */
export function processRoundStart(state: BattleState): BattleState {
  // 推进行动值并获取行动顺序
  const actionOrder = calculateActionOrder(state.combatants)

  // 重置行动者的行动值
  for (const uid of actionOrder) {
    const c = state.combatants.find(c => c.uid === uid)
    if (c) {
      c.actionValue -= ACTION_VALUE_THRESHOLD
    }
  }

  // 生成行动顺序预览
  const preview = generateActionOrderPreview(state.combatants)

  const logEntry: BattleLogEntry = {
    round: state.round,
    type: 'system',
    message: `—— 第 ${state.round} 回合 ——`,
    timestamp: Date.now()
  }

  return {
    ...state,
    phase: BattlePhase.BUFF_SETTLEMENT,
    actionOrder,
    currentActorIndex: 0,
    lastDamageResults: [],
    lastBuffResults: [],
    actionOrderPreview: preview,
    log: [...state.log, logEntry]
  }
}

/**
 * Buff/Debuff 结算阶段
 * - 对当前行动者身上的所有 Buff tick
 * - 减少持续回合，移除过期的 Buff
 * - DoT/HoT 类 Buff 造成伤害/治疗
 * @param state - 当前战斗状态
 * @returns 更新后的状态
 */
export function processBuffSettlement(state: BattleState): BattleState {
  const actor = getCurrentActor(state)
  if (!actor) return advanceToNextActorOrRoundEnd(state)

  const newCombatants = state.combatants.map(c => ({ ...c, buffs: [...c.buffs], cooldowns: { ...c.cooldowns } }))
  const targetIndex = newCombatants.findIndex(c => c.uid === actor.uid)
  const target = newCombatants[targetIndex]

  const buffResults: BuffSettlementResult[] = []
  const logEntries: BattleLogEntry[] = []
  const remainingBuffs: BuffEffect[] = []

  for (const buff of target.buffs) {
    const newTurns = buff.remainingTurns - 1
    const expired = newTurns <= 0

    // DoT（毒）每回合造成攻击力10%伤害
    let damageValue = 0
    if (buff.isDebuff && buff.stat === 'maxHp') {
      damageValue = Math.max(1, Math.floor(target.stats.maxHp * 0.1))
      target.stats = { ...target.stats, hp: Math.max(0, target.stats.hp - damageValue) }

      logEntries.push({
        round: state.round,
        type: 'damage',
        message: `${target.name} 受到 ${buff.name} 的效果，损失 ${damageValue} HP`,
        actorUid: target.uid,
        timestamp: Date.now()
      })

      // 检查是否死亡
      if (target.stats.hp <= 0) {
        target.isAlive = false
        logEntries.push({
          round: state.round,
          type: 'death',
          message: `${target.name} 被 ${buff.name} 击败了！`,
          targetUid: target.uid,
          timestamp: Date.now()
        })
      }
    }

    buffResults.push({
      targetUid: target.uid,
      buffName: buff.name,
      isDebuff: buff.isDebuff,
      value: damageValue,
      remainingTurns: Math.max(0, newTurns),
      expired
    })

    if (!expired) {
      remainingBuffs.push({ ...buff, remainingTurns: newTurns })
    } else {
      logEntries.push({
        round: state.round,
        type: 'buff',
        message: `${target.name} 的 ${buff.name} 效果消失了`,
        actorUid: target.uid,
        timestamp: Date.now()
      })
    }
  }

  target.buffs = remainingBuffs
  newCombatants[targetIndex] = target

  // 检查是否有人因 DoT 死亡导致战斗结束
  const allyAlive = newCombatants.some(c => c.side === 'ally' && c.isAlive)
  const enemyAlive = newCombatants.some(c => c.side === 'enemy' && c.isAlive)

  if (!allyAlive || !enemyAlive) {
    return {
      ...state,
      combatants: newCombatants,
      phase: BattlePhase.BATTLE_END,
      outcome: !allyAlive ? 'defeat' : 'victory',
      lastBuffResults: buffResults,
      log: [...state.log, ...logEntries]
    }
  }

  // 如果当前行动者因 DoT 死亡，跳过其行动
  if (!target.isAlive) {
    return advanceToNextActorOrRoundEnd({
      ...state,
      combatants: newCombatants,
      lastBuffResults: buffResults,
      log: [...state.log, ...logEntries]
    })
  }

  return {
    ...state,
    combatants: newCombatants,
    phase: BattlePhase.ACTION_SELECT,
    lastBuffResults: buffResults,
    waitingForPlayerAction: actor.side === 'ally' && actor.type !== 'pet',
    log: [...state.log, ...logEntries]
  }
}

/**
 * 执行玩家/AI 选择的行动
 * 完整流程：行动选择 → 伤害计算 → 闪避/暴击判定 → 结算
 * @param state - 当前战斗状态
 * @param action - 要执行的行动
 * @returns 更新后的状态（已走到 SETTLEMENT 阶段）
 */
export function processAction(state: BattleState, action: BattleAction): BattleState {
  const actor = getCombatantByUid(state, action.actorUid)
  if (!actor || !actor.isAlive) return state

  const newState = { ...state, combatants: state.combatants.map(c => ({ ...c, buffs: [...c.buffs], cooldowns: { ...c.cooldowns } })) }
  const logEntries: BattleLogEntry[] = [...state.log]

  switch (action.type) {
    case 'attack':
      return processAttackAction(newState, action, logEntries)
    case 'skill':
      return processSkillAction(newState, action, logEntries)
    case 'defend':
      return processDefendAction(newState, action, logEntries)
    case 'flee':
      return processFleeAction(newState, action, logEntries)
    default:
      return newState
  }
}

/**
 * 处理普通攻击行动
 */
function processAttackAction(state: BattleState, action: BattleAction, logEntries: BattleLogEntry[]): BattleState {
  const actor = getCombatantByUid(state, action.actorUid)!
  const targetUid = action.targetUid ?? selectAutoTarget(state, actor.side)?.uid
  if (!targetUid) return advanceToNextActorOrRoundEnd(state)

  const target = getCombatantByUid(state, targetUid)!
  const actorStats = applyBuffModifiers(actor.stats, actor.buffs)
  const targetStats = applyBuffModifiers(target.stats, target.buffs)

  const dmg = calculateDamage(actorStats, targetStats, 1.0)

  const damageResult: DamageResult = {
    targetUid,
    value: dmg.finalDamage,
    isCritical: dmg.isCritical,
    isDodged: dmg.isDodged,
    isHeal: false,
    sourceType: 'attack'
  }

  // 应用伤害
  const newCombatants = state.combatants.map(c => {
    if (c.uid === targetUid) {
      const hp = dmg.isDodged ? c.stats.hp : Math.max(0, c.stats.hp - dmg.finalDamage)
      return { ...c, stats: { ...c.stats, hp }, isAlive: hp > 0 }
    }
    return c
  })

  // 日志
  const elementText = dmg.elementAdvantage === 1 ? '（克制！）' : dmg.elementAdvantage === -1 ? '（被克制）' : ''
  if (dmg.isDodged) {
    logEntries.push({
      round: state.round, type: 'dodge',
      message: `${target.name} 闪避了 ${actor.name} 的攻击！`,
      actorUid: actor.uid, targetUid, timestamp: Date.now()
    })
  } else if (dmg.isCritical) {
    logEntries.push({
      round: state.round, type: 'critical',
      message: `${actor.name} 攻击 ${target.name}，暴击！造成 ${dmg.finalDamage} 点伤害${elementText}`,
      actorUid: actor.uid, targetUid, timestamp: Date.now()
    })
  } else {
    logEntries.push({
      round: state.round, type: 'damage',
      message: `${actor.name} 攻击 ${target.name}，造成 ${dmg.finalDamage} 点伤害${elementText}`,
      actorUid: actor.uid, targetUid, timestamp: Date.now()
    })
  }

  // 检查死亡
  const killed = newCombatants.find(c => c.uid === targetUid && !c.isAlive)
  if (killed) {
    logEntries.push({
      round: state.round, type: 'death',
      message: `${killed.name} 被击败了！`,
      targetUid, timestamp: Date.now()
    })
  }

  return checkBattleEnd({
    ...state,
    combatants: newCombatants,
    phase: BattlePhase.SETTLEMENT,
    lastDamageResults: [damageResult],
    log: logEntries
  })
}

/**
 * 处理技能行动
 */
function processSkillAction(state: BattleState, action: BattleAction, logEntries: BattleLogEntry[]): BattleState {
  const actor = getCombatantByUid(state, action.actorUid)!
  const skill = actor.skills.find(s => s.id === action.skillId)
  if (!skill) return advanceToNextActorOrRoundEnd(state)

  // 检查 MP
  if (skill.mpCost && actor.stats.mp < skill.mpCost) {
    logEntries.push({
      round: state.round, type: 'system',
      message: `${actor.name} 的 MP 不足，无法使用 ${skill.name}`,
      actorUid: actor.uid, timestamp: Date.now()
    })
    return { ...state, log: logEntries, waitingForPlayerAction: true }
  }

  // 检查冷却
  const cd = actor.cooldowns[String(skill.id)] ?? 0
  if (cd > 0) {
    logEntries.push({
      round: state.round, type: 'system',
      message: `${skill.name} 冷却中，还需 ${cd} 回合`,
      actorUid: actor.uid, timestamp: Date.now()
    })
    return { ...state, log: logEntries, waitingForPlayerAction: true }
  }

  // 消耗 MP
  const mpCost = skill.mpCost ?? 0
  const newCombatants = state.combatants.map(c => {
    if (c.uid === actor.uid) {
      return {
        ...c,
        stats: { ...c.stats, mp: Math.max(0, c.stats.mp - mpCost) },
        cooldowns: { ...c.cooldowns, [String(skill.id)]: skill.cooldown ?? 0 }
      }
    }
    return c
  })
  state = { ...state, combatants: newCombatants }

  const actorStats = applyBuffModifiers(actor.stats, actor.buffs)
  const damageResults: DamageResult[] = []

  if (skill.type === 'active_attack') {
    const targets = getSkillTargets(state, action, skill)
    for (const target of targets) {
      const targetStats = applyBuffModifiers(target.stats, target.buffs)
      const multiplier = (skill.power ?? 100) / 100
      const dmg = calculateDamage(actorStats, targetStats, multiplier)

      damageResults.push({
        targetUid: target.uid, value: dmg.finalDamage,
        isCritical: dmg.isCritical, isDodged: dmg.isDodged, isHeal: false, sourceType: 'skill'
      })

      // 应用伤害
      const targetCombatant = state.combatants.find(c => c.uid === target.uid)!
      targetCombatant.stats = {
        ...targetCombatant.stats,
        hp: dmg.isDodged ? targetCombatant.stats.hp : Math.max(0, targetCombatant.stats.hp - dmg.finalDamage)
      }
      targetCombatant.isAlive = targetCombatant.stats.hp > 0

      const elementText = dmg.elementAdvantage === 1 ? '（克制！）' : dmg.elementAdvantage === -1 ? '（被克制）' : ''
      if (dmg.isDodged) {
        logEntries.push({
          round: state.round, type: 'dodge',
          message: `${target.name} 闪避了 ${actor.name} 的 ${skill.name}！`,
          actorUid: actor.uid, targetUid: target.uid, timestamp: Date.now()
        })
      } else {
        logEntries.push({
          round: state.round, type: dmg.isCritical ? 'critical' : 'damage',
          message: `${actor.name} 使用 ${skill.name} 对 ${target.name} 造成 ${dmg.finalDamage} 点伤害${dmg.isCritical ? '（暴击！）' : ''}${elementText}`,
          actorUid: actor.uid, targetUid: target.uid, timestamp: Date.now()
        })
      }

      if (!targetCombatant.isAlive) {
        logEntries.push({
          round: state.round, type: 'death',
          message: `${target.name} 被击败了！`,
          targetUid: target.uid, timestamp: Date.now()
        })
      }

      // 附带 Buff
      if (skill.attachedBuff) {
        applyBuffToTarget(state, target.uid, skill.attachedBuff, logEntries, state.round)
      }
    }
  } else if (skill.type === 'active_heal') {
    const targets = getSkillTargets(state, action, skill)
    for (const target of targets) {
      const healMultiplier = (skill.power ?? 100) / 100
      const healAmount = calculateHeal(actorStats, healMultiplier)
      const targetCombatant = state.combatants.find(c => c.uid === target.uid)!
      const actualHeal = capHealAmount(healAmount, targetCombatant.stats.hp, targetCombatant.stats.maxHp)
      targetCombatant.stats = { ...targetCombatant.stats, hp: targetCombatant.stats.hp + actualHeal }

      damageResults.push({
        targetUid: target.uid, value: actualHeal,
        isCritical: false, isDodged: false, isHeal: true, sourceType: 'skill'
      })

      logEntries.push({
        round: state.round, type: 'heal',
        message: `${actor.name} 使用 ${skill.name}，恢复 ${target.name} ${actualHeal} HP`,
        actorUid: actor.uid, targetUid: target.uid, timestamp: Date.now()
      })
    }
  } else if (skill.type === 'active_buff') {
    const targets = getSkillTargets(state, action, skill)
    for (const target of targets) {
      if (skill.attachedBuff) {
        applyBuffToTarget(state, target.uid, skill.attachedBuff, logEntries, state.round)
      }
    }
    logEntries.push({
      round: state.round, type: 'buff',
      message: `${actor.name} 使用了 ${skill.name}`,
      actorUid: actor.uid, timestamp: Date.now()
    })
  }

  return checkBattleEnd({
    ...state,
    phase: BattlePhase.SETTLEMENT,
    lastDamageResults: damageResults,
    log: logEntries
  })
}

/**
 * 处理防御行动（本回合防御力翻倍）
 */
function processDefendAction(state: BattleState, action: BattleAction, logEntries: BattleLogEntry[]): BattleState {
  const actor = getCombatantByUid(state, action.actorUid)!
  applyBuffToTarget(state, actor.uid, {
    name: '防御姿态',
    isDebuff: false,
    stat: 'defense',
    value: actor.stats.defense,
    duration: 1
  }, logEntries, state.round)

  logEntries.push({
    round: state.round, type: 'action',
    message: `${actor.name} 进入防御姿态`,
    actorUid: actor.uid, timestamp: Date.now()
  })

  return advanceToNextActorOrRoundEnd({
    ...state,
    phase: BattlePhase.SETTLEMENT,
    log: logEntries
  })
}

/**
 * 处理逃跑行动
 */
function processFleeAction(state: BattleState, action: BattleAction, logEntries: BattleLogEntry[]): BattleState {
  const actor = getCombatantByUid(state, action.actorUid)!
  const fleeChance = 0.3 + actor.stats.speed * 0.01
  const success = Math.random() < clamp(fleeChance, 0.1, 0.8)

  logEntries.push({
    round: state.round, type: 'flee',
    message: success ? `${actor.name} 成功逃离了战斗！` : `${actor.name} 逃跑失败！`,
    actorUid: actor.uid, timestamp: Date.now()
  })

  if (success) {
    return {
      ...state,
      phase: BattlePhase.BATTLE_END,
      outcome: 'fled',
      log: logEntries
    }
  }

  return advanceToNextActorOrRoundEnd({
    ...state,
    phase: BattlePhase.SETTLEMENT,
    log: logEntries
  })
}

// ──────────────────────────────────────────
// 结算与回合推进
// ──────────────────────────────────────────

/**
 * 检查战斗是否结束（一方全灭）
 */
function checkBattleEnd(state: BattleState): BattleState {
  const allyAlive = state.combatants.some(c => c.side === 'ally' && c.isAlive)
  const enemyAlive = state.combatants.some(c => c.side === 'enemy' && c.isAlive)

  if (!allyAlive) {
    return { ...state, phase: BattlePhase.BATTLE_END, outcome: 'defeat' }
  }
  if (!enemyAlive) {
    return { ...state, phase: BattlePhase.BATTLE_END, outcome: 'victory' }
  }

  return advanceToNextActorOrRoundEnd(state)
}

/**
 * 推进到下一个行动者，或进入回合结束
 */
function advanceToNextActorOrRoundEnd(state: BattleState): BattleState {
  let nextIndex = state.currentActorIndex + 1

  // 跳过已死亡的行动者
  while (nextIndex < state.actionOrder.length) {
    const uid = state.actionOrder[nextIndex]
    const combatant = state.combatants.find(c => c.uid === uid)
    if (combatant?.isAlive) break
    nextIndex++
  }

  // 所有行动者都行动完毕，进入回合结束
  if (nextIndex >= state.actionOrder.length) {
    return processRoundEnd(state)
  }

  // 推进到下一个行动者的 Buff 结算阶段
  const nextActor = state.combatants.find(c => c.uid === state.actionOrder[nextIndex])
  return {
    ...state,
    phase: BattlePhase.BUFF_SETTLEMENT,
    currentActorIndex: nextIndex,
    waitingForPlayerAction: nextActor?.side === 'ally' && nextActor?.type !== 'pet',
    lastDamageResults: [],
    lastBuffResults: []
  }
}

/**
 * 回合结束阶段
 * - 减少所有技能冷却
 * - 增加回合数
 */
function processRoundEnd(state: BattleState): BattleState {
  const newCombatants = state.combatants.map(c => {
    const newCooldowns: Record<string, number> = {}
    for (const [skillId, turns] of Object.entries(c.cooldowns)) {
      if (turns > 0) {
        newCooldowns[skillId] = turns - 1
      }
    }
    return { ...c, cooldowns: newCooldowns }
  })

  return {
    ...state,
    phase: BattlePhase.ROUND_START,
    round: state.round + 1,
    combatants: newCombatants,
    currentActorIndex: 0
  }
}

// ──────────────────────────────────────────
// AI 自动行动
// ──────────────────────────────────────────

/**
 * 为 AI（敌人/战宠）生成自动行动
 * @param state - 当前战斗状态
 * @param actorUid - 行动者 UID
 * @returns 生成的行动
 */
export function generateAutoAction(state: BattleState, actorUid: string): BattleAction {
  const actor = getCombatantByUid(state, actorUid)
  if (!actor) return { type: 'attack', actorUid }

  // 30% 概率使用技能（如果 MP 足够且不在冷却中）
  if (Math.random() < 0.3) {
    const availableSkill = actor.skills.find(s => {
      if (s.type === 'passive') return false
      const mpCost = s.mpCost ?? 0
      if (actor.stats.mp < mpCost) return false
      const cd = actor.cooldowns[String(s.id)] ?? 0
      return cd <= 0
    })

    if (availableSkill) {
      const target = selectAutoTarget(state, actor.side)
      return {
        type: 'skill',
        actorUid,
        skillId: availableSkill.id,
        targetUid: target?.uid
      }
    }
  }

  // 默认普通攻击
  const target = selectAutoTarget(state, actor.side)
  return {
    type: 'attack',
    actorUid,
    targetUid: target?.uid
  }
}

/**
 * 自动选择目标（优先攻击 HP 最低的敌方单位）
 */
function selectAutoTarget(state: BattleState, actorSide: 'ally' | 'enemy'): Combatant | undefined {
  const targets = getAvailableTargets(state, actorSide)
  if (targets.length === 0) return undefined
  return targets.reduce((min, c) => c.stats.hp < min.stats.hp ? c : min)
}

/**
 * 获取技能目标
 */
function getSkillTargets(state: BattleState, action: BattleAction, skill: BattleSkill): Combatant[] {
  const targetType = skill.targetType ?? 'single_enemy'
  const actor = getCombatantByUid(state, action.actorUid)!

  switch (targetType) {
    case 'single_enemy': {
      const targetUid = action.targetUid ?? selectAutoTarget(state, actor.side)?.uid
      const target = targetUid ? getCombatantByUid(state, targetUid) : undefined
      return target ? [target] : []
    }
    case 'all_enemies':
      return getAvailableTargets(state, actor.side)
    case 'self':
      return [actor]
    case 'single_ally': {
      const targetUid = action.targetUid ?? actor.uid
      const target = getCombatantByUid(state, targetUid)
      return target ? [target] : [actor]
    }
    case 'all_allies':
      return getAliveCombatants(state, actor.side)
    default:
      return []
  }
}

/**
 * 给目标施加 Buff
 */
function applyBuffToTarget(
  state: BattleState,
  targetUid: string,
  template: BuffTemplate,
  logEntries: BattleLogEntry[],
  round: number
): void {
  const target = state.combatants.find(c => c.uid === targetUid)
  if (!target) return

  const buff: BuffEffect = {
    ...template,
    uid: uid(),
    remainingTurns: template.duration
  }

  target.buffs = [...target.buffs, buff]

  logEntries.push({
    round,
    type: 'buff',
    message: `${target.name} 获得了 ${buff.name} 效果（${buff.isDebuff ? '减益' : '增益'}，${buff.remainingTurns} 回合）`,
    targetUid,
    timestamp: Date.now()
  })
}

// ──────────────────────────────────────────
// 完整步骤推进（供 Store 调用）
// ──────────────────────────────────────────

/**
 * 推进战斗到下一个需要玩家输入的状态
 * 自动处理所有中间阶段（回合开始、Buff结算、AI行动等）
 * @param state - 当前战斗状态
 * @returns 推进后的状态
 */
export function advanceBattle(state: BattleState): BattleState {
  let current = { ...state }

  while (true) {
    switch (current.phase) {
      case BattlePhase.ROUND_START:
        current = processRoundStart(current)
        break

      case BattlePhase.BUFF_SETTLEMENT:
        current = processBuffSettlement(current)
        // 如果 Buff 结算后需要玩家行动，停下
        if (current.waitingForPlayerAction) return current
        // 如果战斗结束，停下
        if (current.phase === BattlePhase.BATTLE_END) return current
        // 否则继续（非玩家控制的行动者）
        break

      case BattlePhase.ACTION_SELECT:
        if (current.waitingForPlayerAction) {
          return current // 等待玩家输入
        }
        // AI 自动行动
        current = processAIAction(current)
        if (current.phase === BattlePhase.BATTLE_END) return current
        break

      case BattlePhase.SETTLEMENT:
        // 结算阶段已在 processAction 中处理，推进到下一行动者
        return advanceToNextActorOrRoundEndAndContinue(current)

      case BattlePhase.BATTLE_END:
        return current

      default:
        return current
    }
  }
}

/**
 * 处理 AI 行动并继续推进
 */
function processAIAction(state: BattleState): BattleState {
  const actor = getCurrentActor(state)
  if (!actor || !actor.isAlive) {
    return advanceToNextActorOrRoundEnd(state)
  }

  const action = generateAutoAction(state, actor.uid)
  return processAction(state, action)
}

/**
 * 推进到下一行动者并继续自动处理
 */
function advanceToNextActorOrRoundEndAndContinue(state: BattleState): BattleState {
  let nextIndex = state.currentActorIndex + 1
  while (nextIndex < state.actionOrder.length) {
    const uid = state.actionOrder[nextIndex]
    const combatant = state.combatants.find(c => c.uid === uid)
    if (combatant?.isAlive) break
    nextIndex++
  }

  if (nextIndex >= state.actionOrder.length) {
    // 回合结束，进入下一回合
    return advanceBattle(processRoundEnd(state))
  }

  const nextActor = state.combatants.find(c => c.uid === state.actionOrder[nextIndex])
  const newState: BattleState = {
    ...state,
    currentActorIndex: nextIndex,
    waitingForPlayerAction: nextActor?.side === 'ally' && nextActor?.type !== 'pet',
    lastDamageResults: [],
    lastBuffResults: []
  }

  // 如果需要玩家行动，停下
  if (newState.waitingForPlayerAction) {
    return advanceBattle({
      ...newState,
      phase: BattlePhase.BUFF_SETTLEMENT
    })
  }

  // AI 行动，继续推进
  return advanceBattle({
    ...newState,
    phase: BattlePhase.BUFF_SETTLEMENT
  })
}

/**
 * 玩家提交行动后推进战斗
 * @param state - 当前战斗状态
 * @param action - 玩家选择的行动
 * @returns 推进后的状态
 */
export function submitPlayerAction(state: BattleState, action: BattleAction): BattleState {
  // 执行行动
  const afterAction = processAction(state, action)
  if (afterAction.phase === BattlePhase.BATTLE_END) return afterAction

  // 继续自动推进
  return advanceBattle(afterAction)
}

// ──────────────────────────────────────────
// 被动技能触发系统
// ──────────────────────────────────────────

/**
 * 检查并触发指定时机下的被动技能
 * @param state - 战斗状态
 * @param trigger - 触发时机
 * @param context - 触发上下文（行动者 uid、目标 uid 等）
 * @returns 更新后的战斗状态
 */
export function triggerPassiveSkills(
  state: BattleState,
  trigger: PassiveTrigger,
  context?: { actorUid?: string; targetUid?: string }
): BattleState {
  const logEntries: BattleLogEntry[] = []
  const newCombatants = state.combatants.map(c => ({ ...c, buffs: [...c.buffs], cooldowns: { ...c.cooldowns } }))

  for (const combatant of newCombatants) {
    if (!combatant.isAlive) continue

    // 找到该单位的被动技能（存储在 skills 中 type='passive' 的技能）
    const passiveSkills = combatant.skills.filter(s => s.type === 'passive')
    for (const skill of passiveSkills) {
      // 检查触发条件
      if (!shouldTrigger(trigger, context, combatant)) continue

      // 检查触发概率
      const triggerChance = getTriggerChance(skill)
      if (Math.random() >= triggerChance) continue

      // 执行被动技能效果
      executePassiveEffect(newCombatants, combatant, skill, trigger, logEntries, state.round)
    }
  }

  if (logEntries.length === 0) return state

  return {
    ...state,
    combatants: newCombatants,
    log: [...state.log, ...logEntries]
  }
}

/**
 * 判断被动技能是否应该触发
 */
function shouldTrigger(trigger: PassiveTrigger, context: { actorUid?: string; targetUid?: string } | undefined, combatant: Combatant): boolean {
  switch (trigger) {
    case 'on_battle_start':
    case 'on_turn_start':
      return true
    case 'on_attack':
      return context?.actorUid === combatant.uid
    case 'on_attacked':
      return context?.targetUid === combatant.uid
    case 'on_kill':
      return context?.actorUid === combatant.uid
    case 'on_hp_below_30':
      return combatant.stats.hp > 0 && combatant.stats.hp / combatant.stats.maxHp < 0.3
    case 'on_crit':
      return context?.actorUid === combatant.uid
    case 'on_ally_death':
      return context?.targetUid !== undefined && combatant.side === newCombatants_findSide(context.targetUid, [])
    default:
      return false
  }
}

/** 获取触发概率（从 skill 的 description 中无法解析，需要额外字段） */
function getTriggerChance(skill: BattleSkill): number {
  // 通过 attachedBuff 的存在判断是否是 config 中的技能
  // 默认触发概率为 1.0（必定触发）
  // 注意：具体概率在 SkillConfig 中定义，此处用默认值
  const configSkill = skill as SkillConfig
  return configSkill.triggerChance ?? 1.0
}

/** 辅助：查找阵营 */
function newCombatants_findSide(_targetUid: string, _combatants: Combatant[]): string {
  // placeholder - 实际逻辑在调用处
  return ''
}

/**
 * 执行被动技能效果
 */
function executePassiveEffect(
  _combatants: Combatant[],
  combatant: Combatant,
  skill: BattleSkill,
  _trigger: PassiveTrigger,
  logEntries: BattleLogEntry[],
  round: number
): void {
  // 被动技能的 attachedBuff 施加给自身
  if (skill.attachedBuff) {
    const buff: BuffEffect = {
      ...skill.attachedBuff,
      uid: uid(),
      remainingTurns: skill.attachedBuff.duration
    }
    combatant.buffs.push(buff)

    logEntries.push({
      round,
      type: 'buff',
      message: `${combatant.name} 的被动技能【${skill.name}】触发！获得 ${buff.name} 效果（${buff.remainingTurns} 回合）`,
      actorUid: combatant.uid,
      timestamp: Date.now()
    })
  }
}

/**
 * 在战斗初始化时触发所有 on_battle_start 被动技能
 * @param state - 战斗状态
 * @returns 触发后的状态
 */
export function triggerBattleStartPassives(state: BattleState): BattleState {
  return triggerPassiveSkills(state, 'on_battle_start')
}

/**
 * 在回合开始时触发所有 on_turn_start 被动技能
 * @param state - 战斗状态
 * @returns 触发后的状态
 */
export function triggerTurnStartPassives(state: BattleState): BattleState {
  return triggerPassiveSkills(state, 'on_turn_start')
}

/**
 * 计算战斗奖励（简单公式）
 * @param enemies - 被击败的敌人列表
 * @returns 奖励数据
 */
export function calculateRewards(enemies: Combatant[]): BattleRewards {
  let totalExp = 0
  let totalGold = 0

  for (const enemy of enemies) {
    totalExp += Math.floor(enemy.stats.maxHp * 0.5 + enemy.stats.physicalAttack * 2)
    totalGold += Math.floor(enemy.stats.maxHp * 0.2 + enemy.stats.speed)
  }

  return {
    exp: totalExp,
    gold: totalGold,
    items: [] // 掉落物品由后端计算
  }
}
