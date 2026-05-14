/**
 * 回合制战斗系统类型定义
 * 涵盖战斗状态机、参战单位、行动、Buff/Debuff、伤害结果等核心类型
 */

import type { BossBattleState } from './boss'

// ──────────────────────────────────────────
// 战斗阶段（状态机状态）
// ──────────────────────────────────────────

/** 战斗阶段：定义回合制战斗的完整流程 */
export const BattlePhase = {
  /** 空闲（未进入战斗） */
  IDLE: 'IDLE',
  /** 回合开始（计算出手顺序） */
  ROUND_START: 'ROUND_START',
  /** Buff/Debuff 结算（当前行动者身上的持续效果 tick） */
  BUFF_SETTLEMENT: 'BUFF_SETTLEMENT',
  /** 行动选择（玩家手动 / AI 自动） */
  ACTION_SELECT: 'ACTION_SELECT',
  /** 伤害计算 */
  DAMAGE_CALCULATION: 'DAMAGE_CALCULATION',
  /** 闪避/暴击判定 */
  DODGE_CRIT_CHECK: 'DODGE_CRIT_CHECK',
  /** 结算（应用伤害、检查死亡） */
  SETTLEMENT: 'SETTLEMENT',
  /** 回合结束（清理冷却、检查胜负） */
  ROUND_END: 'ROUND_END',
  /** 战斗结束 */
  BATTLE_END: 'BATTLE_END'
} as const

export type BattlePhase = (typeof BattlePhase)[keyof typeof BattlePhase]

// ──────────────────────────────────────────
// 参战单位
// ──────────────────────────────────────────

/** 参战单位阵营 */
export type CombatantSide = 'ally' | 'enemy'

/** 参战单位类型 */
export type CombatantType = 'player' | 'pet' | 'enemy'

/** 参战单位战斗属性 */
export interface CombatantStats {
  maxHp: number
  hp: number
  maxMp: number
  mp: number
  physicalAttack: number
  magicAttack: number
  defense: number
  speed: number
  dodgeRate: number
  criticalRate: number
}

/** 战宠给予主人的属性加成（用于战宠死亡时扣减） */
export interface PetBonusToMaster {
  /** HP 加成值 */
  maxHp: number
  /** 物理攻击加成值 */
  physicalAttack: number
  /** 魔法攻击加成值 */
  magicAttack: number
  /** 防御加成值 */
  defense: number
  /** 闪避率加成值 */
  dodgeRate: number
  /** 暴击率加成值 */
  criticalRate: number
}

/** 参战单位 */
export interface Combatant {
  /** 唯一 ID */
  uid: string
  /** 原始 ID（角色/战宠/怪物 ID） */
  sourceId: string
  /** 显示名称 */
  name: string
  /** 阵营 */
  side: CombatantSide
  /** 类型 */
  type: CombatantType
  /** 战斗属性 */
  stats: CombatantStats
  /** 已学会的技能列表 */
  skills: BattleSkill[]
  /** 当前 Buff/Debuff 列表 */
  buffs: BuffEffect[]
  /** 技能冷却剩余回合 { skillId: remainingTurns } */
  cooldowns: Record<string, number>
  /** 是否存活 */
  isAlive: boolean
  /** 行动值（累积量，达到阈值时可行动） */
  actionValue: number
  /** 图标（可选） */
  iconUrl?: string
  /** 主人 uid（仅 type=pet 时有值，链接到所属玩家） */
  masterUid?: string
  /** 战宠给予主人的属性加成（仅 type=pet 时有值，战宠死亡时用于扣减主人属性） */
  petBonusToMaster?: PetBonusToMaster
}

// ──────────────────────────────────────────
// 技能（战斗中的技能实例）
// ──────────────────────────────────────────

/** 技能作用目标类型 */
export type SkillTargetType = 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies'

/** 战斗技能 */
export interface BattleSkill {
  /** 技能 ID */
  id: number
  /** 技能名称 */
  name: string
  /** 技能类型 */
  type: 'active_attack' | 'active_heal' | 'active_buff' | 'passive'
  /** 伤害/治疗基础倍率 */
  power?: number
  /** 冷却回合数 */
  cooldown?: number
  /** MP 消耗 */
  mpCost?: number
  /** 作用目标类型 */
  targetType?: SkillTargetType
  /** 附带的 Buff/Debuff（可选） */
  attachedBuff?: BuffTemplate
  /** 技能描述 */
  description?: string
  /** 元素属性（0-无, 1-火, 2-水, 3-风, 4-地, 5-光, 6-暗） */
  element?: number
  /** 是否使用魔法攻击力计算伤害 */
  isMagicAttack?: boolean
}

// ──────────────────────────────────────────
// Buff / Debuff
// ──────────────────────────────────────────

/** Buff 影响的属性 */
export type BuffStat = 'physicalAttack' | 'magicAttack' | 'defense' | 'speed' | 'dodgeRate' | 'criticalRate' | 'maxHp'

/** Buff 模板（技能附带的 Buff 定义） */
export interface BuffTemplate {
  /** Buff 名称 */
  name: string
  /** Buff/Debuff 标记 */
  isDebuff: boolean
  /** 影响的属性 */
  stat: BuffStat
  /** 效果值（正数=增加，负数=减少） */
  value: number
  /** 持续回合数 */
  duration: number
}

/** Buff 实例（运行时状态） */
export interface BuffEffect extends BuffTemplate {
  /** Buff 实例唯一 ID */
  uid: string
  /** 剩余回合数 */
  remainingTurns: number
  /** 来源技能 ID */
  sourceSkillId?: number
}

// ──────────────────────────────────────────
// 行动
// ──────────────────────────────────────────

/** 行动类型 */
export type ActionType = 'attack' | 'skill' | 'item' | 'defend' | 'flee' | 'revive'

/** 战斗行动 */
export interface BattleAction {
  /** 行动类型 */
  type: ActionType
  /** 行动者 UID */
  actorUid: string
  /** 目标 UID（单体技能/攻击） */
  targetUid?: string
  /** 技能 ID（type=skill 时） */
  skillId?: number
  /** 物品实例 ID（type=item 时） */
  itemId?: string
}

// ──────────────────────────────────────────
// 伤害结果
// ──────────────────────────────────────────

/** 单次伤害/治疗结果 */
export interface DamageResult {
  /** 目标 UID */
  targetUid: string
  /** 最终伤害/治疗量 */
  value: number
  /** 是否暴击 */
  isCritical: boolean
  /** 是否闪避 */
  isDodged: boolean
  /** 是否治疗 */
  isHeal: boolean
  /** 伤害来源类型 */
  sourceType: 'attack' | 'skill' | 'item' | 'buff'
}

/** Buff 结算结果 */
export interface BuffSettlementResult {
  /** 目标 UID */
  targetUid: string
  /** Buff 名称 */
  buffName: string
  /** 是否为 Debuff */
  isDebuff: boolean
  /** 造成的伤害或治疗量 */
  value: number
  /** 剩余回合数 */
  remainingTurns: number
  /** 是否已消失 */
  expired: boolean
}

// ──────────────────────────────────────────
// 战斗日志
// ──────────────────────────────────────────

/** 日志条目类型 */
export type LogEntryType = 'system' | 'action' | 'damage' | 'heal' | 'buff' | 'death' | 'dodge' | 'critical' | 'miss' | 'flee' | 'reward'

/** 战斗日志条目 */
export interface BattleLogEntry {
  /** 回合数 */
  round: number
  /** 日志类型 */
  type: LogEntryType
  /** 日志内容 */
  message: string
  /** 相关行动者 UID */
  actorUid?: string
  /** 相关目标 UID */
  targetUid?: string
  /** 时间戳 */
  timestamp: number
}

// ──────────────────────────────────────────
// 战斗状态（整个战斗的运行时状态）
// ──────────────────────────────────────────

/** 战斗结果 */
export type BattleOutcome = 'victory' | 'defeat' | 'fled'

/** 战斗奖励 */
export interface BattleRewards {
  /** 获得经验 */
  exp: number
  /** 获得金币 */
  gold: number
  /** 获得物品 */
  items: BattleRewardItem[]
  /** 战宠获得经验（可选） */
  petExp?: number
  /** 是否升级（后端计算） */
  levelUp?: boolean
  /** 升级后等级 */
  newLevel?: number
}

/** 掉落物品 */
export interface BattleRewardItem {
  /** 物品 ID */
  itemId: number
  /** 物品名称 */
  name: string
  /** 物品数量 */
  quantity: number
  /** 物品品质（用于着色） */
  quality?: 'common' | 'rare' | 'epic' | 'legendary'
  /** 物品类型（用于图标） */
  itemType?: 'equipment' | 'material' | 'consumable' | 'pet_egg'
}

/** 战斗统计数据（用于结算页面展示） */
export interface BattleStatistics {
  /** 战斗总回合数 */
  totalRounds: number
  /** 玩家造成的总伤害 */
  totalDamageDealt: number
  /** 玩家承受的总伤害 */
  totalDamageTaken: number
  /** 玩家治疗总量 */
  totalHealed: number
  /** 暴击次数 */
  criticalHits: number
  /** 闪避次数 */
  dodgeCount: number
  /** 击杀敌人数 */
  enemiesKilled: number
}

/** 行动顺序条目（用于 UI 行动顺序条展示） */
export interface ActionOrderEntry {
  /** 参战单位 uid */
  uid: string
  /** 显示名称 */
  name: string
  /** 阵营 */
  side: CombatantSide
  /** 类型 */
  type: CombatantType
  /** 当前行动值 */
  actionValue: number
  /** 行动值百分比（0~1，达到 1 时可行动） */
  actionValuePercent: number
  /** 是否存活 */
  isAlive: boolean
}

/** 战斗状态（完整快照） */
export interface BattleState {
  /** 当前阶段 */
  phase: BattlePhase
  /** 当前回合 */
  round: number
  /** 所有参战单位 */
  combatants: Combatant[]
  /** 当前回合的出手顺序（按行动值排列的 uid 列表） */
  actionOrder: string[]
  /** 当前行动者在 actionOrder 中的索引 */
  currentActorIndex: number
  /** 等待玩家行动（当前行动者是玩家控制的单位） */
  waitingForPlayerAction: boolean
  /** 战斗日志 */
  log: BattleLogEntry[]
  /** 战斗结果 */
  outcome: BattleOutcome | null
  /** 战斗奖励 */
  rewards: BattleRewards | null
  /** 最后一次伤害结果（用于 UI 动画） */
  lastDamageResults: DamageResult[]
  /** 最后一次 Buff 结算结果 */
  lastBuffResults: BuffSettlementResult[]
  /** 行动顺序预览（用于行动顺序条 UI 展示） */
  actionOrderPreview: ActionOrderEntry[]
  /** 战斗统计数据 */
  statistics: BattleStatistics
  /** Boss 战运行状态（仅 Boss 战斗时有值） */
  bossState?: BossBattleState
}

// ──────────────────────────────────────────
// API 请求/响应类型
// ──────────────────────────────────────────

/** 发起战斗请求 */
export interface StartBattleRequest {
  characterId: string
  dungeonId?: string
  stageId?: string
  enemyGroupId?: string
}

/** 发起战斗响应 */
export interface StartBattleResponse {
  battleId: string
  enemies: Combatant[]
}

/** 玩家行动请求 */
export interface PlayerActionRequest {
  battleId: string
  action: BattleAction
}

/** 行动响应（包含所有伤害结果和状态变化） */
export interface PlayerActionResponse {
  battleState: BattleState
}

/** 战斗结束响应 */
export interface BattleEndResponse {
  outcome: BattleOutcome
  rewards: BattleRewards
  statistics?: BattleStatistics
}
