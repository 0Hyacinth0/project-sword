/**
 * Boss 战机制类型定义
 * 包含阶段、狂暴、复活等 Boss 专属机制
 */

/** Boss 阶段配置 */
export interface BossPhase {
  /** 阶段编号（1-indexed） */
  phase: number
  /** 触发血量阈值（百分比，如 0.7 表示 HP≤70% 时进入） */
  hpThreshold: number
  /** 该阶段攻击力倍率 */
  attackMultiplier: number
  /** 该阶段可用技能 ID 列表 */
  skillIds: number[]
}

/** Boss 狂暴配置 */
export interface BossEnrage {
  /** 狂暴触发回合数（从战斗开始计） */
  enrageRound: number
  /** 狂暴后攻击力倍率 */
  attackMultiplier: number
  /** 狂暴后速度倍率 */
  speedMultiplier: number
}

/** 复活机制配置 */
export interface ReviveConfig {
  /** 复活后恢复 HP 百分比（如 30 表示恢复 30% maxHp） */
  reviveHpPercent: number
  /** 复活消耗 MP */
  mpCost: number
  /** 每场战斗最大复活次数 */
  maxRevives: number
}

/** Boss 战完整配置 */
export interface BossBattleConfig {
  /** Boss ID（对应 dungeon_config 中 Boss enemy 的 id） */
  bossId: string
  /** Boss 名称 */
  bossName: string
  /** 阶段列表（按 hpThreshold 降序排列） */
  phases: BossPhase[]
  /** 狂暴配置 */
  enrage: BossEnrage
  /** 复活配置 */
  revive: ReviveConfig
  /** 全屏 AOE 技能 ID 列表 */
  aoeSkillIds: number[]
}

/** Boss 战运行状态 */
export interface BossBattleState {
  /** 当前阶段（初始为 1） */
  currentPhase: number
  /** 是否已狂暴 */
  isEnraged: boolean
  /** 当前回合数（用于狂暴计时） */
  currentRound: number
  /** 已使用复活次数 */
  reviveCount: number
  /** 阶段切换标记（用于 UI 动画触发） */
  phaseChanged: boolean
}