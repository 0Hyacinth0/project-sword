/**
 * 技能静态配置表
 * 定义各职业、怪物可用的所有技能及其效果
 * 前端展示 + 战斗引擎使用，与后端 skill 表对应
 */

import type { BattleSkill, BuffTemplate } from '../types/battle'

// ──────────────────────────────────────────
// 被动技能触发时机
// ──────────────────────────────────────────

/** 被动技能触发条件 */
export type PassiveTrigger =
  | 'on_battle_start'     // 战斗开始
  | 'on_turn_start'       // 回合开始
  | 'on_attack'           // 攻击时
  | 'on_attacked'         // 被攻击时
  | 'on_kill'             // 击杀时
  | 'on_hp_below_30'      // HP 低于 30%
  | 'on_ally_death'       // 友方死亡时
  | 'on_crit'             // 暴击时

/** 扩展技能类型（包含被动触发条件） */
export interface SkillConfig extends BattleSkill {
  /** 技能所属（职业/怪物类型） */
  owner: string
  /** 被动技能触发时机（仅 passive 类型） */
  passiveTrigger?: PassiveTrigger
  /** 触发概率 (0~1)，1 为必定触发 */
  triggerChance?: number
  /** 是否为初始技能（角色自带） */
  isDefault?: boolean
  /** 解锁等级 */
  unlockLevel: number
  /** 技能图标（Lucide 图标名） */
  icon?: string
  /** 元素属性 (1-火, 2-水, 3-风, 4-地, 5-光, 6-暗, 0-无) */
  element?: number
}

// ──────────────────────────────────────────
// Buff 模板预定义
// ──────────────────────────────────────────

const BUFF_ATTACK_UP: BuffTemplate = {
  name: '外功加持', isDebuff: false, stat: 'physicalAttack', value: 15, duration: 3
}

const BUFF_MAGIC_UP: BuffTemplate = {
  name: '内功涌动', isDebuff: false, stat: 'magicAttack', value: 20, duration: 3
}

const BUFF_DEFENSE_UP: BuffTemplate = {
  name: '护体罡气', isDebuff: false, stat: 'defense', value: 15, duration: 2
}

const BUFF_SPEED_UP: BuffTemplate = {
  name: '身法灵动', isDebuff: false, stat: 'speed', value: 8, duration: 3
}

const BUFF_CRIT_UP: BuffTemplate = {
  name: '杀意凝聚', isDebuff: false, stat: 'criticalRate', value: 0.15, duration: 3
}

const BUFF_DODGE_UP: BuffTemplate = {
  name: '遁影无形', isDebuff: false, stat: 'dodgeRate', value: 0.2, duration: 2
}

const DEBUFF_DEF_DOWN: BuffTemplate = {
  name: '护甲破碎', isDebuff: true, stat: 'defense', value: -10, duration: 3
}

const DEBUFF_SPEED_DOWN: BuffTemplate = {
  name: '经脉阻滞', isDebuff: true, stat: 'speed', value: -5, duration: 2
}

const DEBUFF_DOT: BuffTemplate = {
  name: '灼烧', isDebuff: true, stat: 'maxHp', value: -10, duration: 3
}

// ──────────────────────────────────────────
// 剑客技能
// ──────────────────────────────────────────

const WARRIOR_SKILLS: SkillConfig[] = [
  {
    id: 1001,
    name: '狂风剑诀',
    type: 'active_attack',
    power: 130,
    cooldown: 2,
    mpCost: 8,
    targetType: 'all_enemies',
    owner: 'WARRIOR',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Swords',
    element: 0,
    description: '剑气纵横成风，对所有敌人造成 130% 外功伤害'
  },
  {
    id: 1002,
    name: '崩山击',
    type: 'active_attack',
    power: 180,
    cooldown: 3,
    mpCost: 12,
    targetType: 'single_enemy',
    owner: 'WARRIOR',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Sword',
    element: 0,
    description: '蓄力一击崩山，对单体造成 180% 外功伤害'
  },
  {
    id: 1003,
    name: '金钟罩',
    type: 'active_buff',
    cooldown: 4,
    mpCost: 8,
    targetType: 'self',
    attachedBuff: BUFF_DEFENSE_UP,
    owner: 'WARRIOR',
    unlockLevel: 5,
    icon: 'Shield',
    element: 0,
    description: '护体罡气，提升自身防御力，持续 2 回合'
  },
  {
    id: 1004,
    name: '战意勃发',
    type: 'active_buff',
    cooldown: 5,
    mpCost: 10,
    targetType: 'self',
    attachedBuff: BUFF_ATTACK_UP,
    owner: 'WARRIOR',
    unlockLevel: 8,
    icon: 'Volume2',
    element: 0,
    description: '激发战意，提升自身攻击力，持续 3 回合'
  },
  {
    id: 1005,
    name: '浴血狂战',
    type: 'passive',
    owner: 'WARRIOR',
    unlockLevel: 3,
    passiveTrigger: 'on_hp_below_30',
    triggerChance: 1,
    icon: 'Heart',
    element: 0,
    attachedBuff: BUFF_ATTACK_UP,
    description: '气血低于 30% 时自动激发，攻击力大幅提升'
  },
  {
    id: 1006,
    name: '破甲一击',
    type: 'active_attack',
    power: 120,
    cooldown: 3,
    mpCost: 10,
    targetType: 'single_enemy',
    attachedBuff: DEBUFF_DEF_DOWN,
    owner: 'WARRIOR',
    unlockLevel: 12,
    icon: 'Axe',
    element: 0,
    description: '击破护甲，攻击单体并降低其防御力，持续 3 回合'
  }
]

// ──────────────────────────────────────────
// 术士技能
// ──────────────────────────────────────────

const MAGE_SKILLS: SkillConfig[] = [
  {
    id: 2001,
    name: '炎灵诀',
    type: 'active_attack',
    power: 160,
    cooldown: 2,
    mpCost: 12,
    targetType: 'single_enemy',
    owner: 'MAGE',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Flame',
    element: 1,
    isMagicAttack: true,
    description: '凝聚炎灵之力，对单体造成 160% 内功伤害'
  },
  {
    id: 2002,
    name: '天火焚城',
    type: 'active_attack',
    power: 140,
    cooldown: 4,
    mpCost: 20,
    targetType: 'all_enemies',
    attachedBuff: DEBUFF_DOT,
    owner: 'MAGE',
    unlockLevel: 1,
    isDefault: true,
    icon: 'CloudLightning',
    element: 1,
    isMagicAttack: true,
    description: '召唤九天玄火，对所有敌人造成伤害并附带灼烧'
  },
  {
    id: 2003,
    name: '回春术',
    type: 'active_heal',
    power: 120,
    cooldown: 2,
    mpCost: 10,
    targetType: 'self',
    owner: 'MAGE',
    unlockLevel: 3,
    icon: 'HeartPulse',
    element: 5,
    description: '运气回春，恢复自身气血，治疗量为内功攻击的 120%'
  },
  {
    id: 2004,
    name: '灵力涌动',
    type: 'active_buff',
    cooldown: 5,
    mpCost: 8,
    targetType: 'self',
    attachedBuff: BUFF_MAGIC_UP,
    owner: 'MAGE',
    unlockLevel: 6,
    icon: 'Sparkles',
    element: 0,
    description: '凝聚灵力，提升自身内功攻击力，持续 3 回合'
  },
  {
    id: 2005,
    name: '玄术护盾',
    type: 'passive',
    owner: 'MAGE',
    unlockLevel: 4,
    passiveTrigger: 'on_attacked',
    triggerChance: 0.2,
    icon: 'Shield',
    element: 0,
    attachedBuff: BUFF_DEFENSE_UP,
    description: '被攻击时 20% 概率自动获得防御提升'
  },
  {
    id: 2006,
    name: '寒冰诀',
    type: 'active_attack',
    power: 110,
    cooldown: 3,
    mpCost: 15,
    targetType: 'single_enemy',
    attachedBuff: DEBUFF_SPEED_DOWN,
    owner: 'MAGE',
    unlockLevel: 10,
    icon: 'Snowflake',
    element: 2,
    isMagicAttack: true,
    description: '释放寒冰攻击单体，并降低其速度，持续 2 回合'
  }
]

// ──────────────────────────────────────────
// 刺客技能
// ──────────────────────────────────────────

const HUNTER_SKILLS: SkillConfig[] = [
  {
    id: 3001,
    name: '惊雷一击',
    type: 'active_attack',
    power: 180,
    cooldown: 2,
    mpCost: 10,
    targetType: 'single_enemy',
    owner: 'HUNTER',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Crosshair',
    element: 0,
    description: '蓄势雷霆一击，对单体造成 180% 外功伤害'
  },
  {
    id: 3002,
    name: '暴雨连打',
    type: 'active_attack',
    power: 90,
    cooldown: 2,
    mpCost: 8,
    targetType: 'all_enemies',
    owner: 'HUNTER',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Target',
    element: 0,
    description: '疾速连打所有敌人，每个目标受到 90% 外功伤害'
  },
  {
    id: 3003,
    name: '潜影术',
    type: 'active_buff',
    cooldown: 4,
    mpCost: 8,
    targetType: 'self',
    attachedBuff: BUFF_DODGE_UP,
    owner: 'HUNTER',
    unlockLevel: 4,
    icon: 'Eye',
    element: 6,
    description: '化入暗影，大幅提升闪避率，持续 2 回合'
  },
  {
    id: 3004,
    name: '鹰眼',
    type: 'active_buff',
    cooldown: 5,
    mpCost: 6,
    targetType: 'self',
    attachedBuff: BUFF_CRIT_UP,
    owner: 'HUNTER',
    unlockLevel: 7,
    icon: 'Scan',
    element: 0,
    description: '凝神聚力，大幅提升暴击率，持续 3 回合'
  },
  {
    id: 3005,
    name: '嗜血杀意',
    type: 'passive',
    owner: 'HUNTER',
    unlockLevel: 5,
    passiveTrigger: 'on_crit',
    triggerChance: 0.5,
    icon: 'Droplet',
    element: 0,
    attachedBuff: BUFF_SPEED_UP,
    description: '暴击时 50% 概率获得加速效果'
  },
  {
    id: 3006,
    name: '淬毒暗器',
    type: 'active_attack',
    power: 100,
    cooldown: 3,
    mpCost: 10,
    targetType: 'single_enemy',
    attachedBuff: DEBUFF_DOT,
    owner: 'HUNTER',
    unlockLevel: 11,
    icon: 'FlaskConical',
    element: 0,
    description: '掷出淬毒暗器，造成伤害并附带持续中毒效果'
  }
]

// ──────────────────────────────────────────
// 通用技能
// ──────────────────────────────────────────

const COMMON_SKILLS: SkillConfig[] = [
  {
    id: 4001,
    name: '防御',
    type: 'active_buff',
    cooldown: 0,
    mpCost: 0,
    targetType: 'self',
    owner: 'ALL',
    unlockLevel: 1,
    isDefault: true,
    icon: 'Shield',
    element: 0,
    description: '进入防御姿态，本回合防御力翻倍'
  }
]

// ──────────────────────────────────────────
// 汇总导出
// ──────────────────────────────────────────

/** 所有技能配置表（按 ID 索引） */
export const SKILL_CONFIGS: Record<number, SkillConfig> = {}

/** 按职业分组 */
const JOB_SKILL_MAP: Record<string, SkillConfig[]> = {
  WARRIOR: WARRIOR_SKILLS,
  MAGE: MAGE_SKILLS,
  HUNTER: HUNTER_SKILLS
}

// 注册所有技能
const allSkillLists = [WARRIOR_SKILLS, MAGE_SKILLS, HUNTER_SKILLS, COMMON_SKILLS]
for (const list of allSkillLists) {
  for (const skill of list) {
    SKILL_CONFIGS[skill.id] = skill
  }
}

/**
 * 获取指定职业的可用技能
 * @param jobType - 职业类型
 * @param level - 当前等级（用于过滤未解锁技能）
 * @returns 可用技能列表
 */
export function getJobSkills(jobType: string, level: number): SkillConfig[] {
  const jobSkills = JOB_SKILL_MAP[jobType] ?? []
  const common = COMMON_SKILLS
  return [...jobSkills, ...common].filter(s => s.unlockLevel <= level)
}

/**
 * 获取指定职业的已解锁主动技能（用于战斗行动选择）
 * @param jobType - 职业类型
 * @param level - 当前等级
 * @returns 主动技能列表
 */
export function getActiveBattleSkills(jobType: string, level: number): BattleSkill[] {
  return getJobSkills(jobType, level)
    .filter(s => s.type !== 'passive')
    .map(({ passiveTrigger, triggerChance, owner, isDefault, unlockLevel, icon, ...battleSkill }) => battleSkill)
}

/**
 * 获取指定职业的被动技能（用于战斗引擎触发）
 * @param jobType - 职业类型
 * @param level - 当前等级
 * @returns 被动技能配置列表
 */
export function getPassiveSkills(jobType: string, level: number): SkillConfig[] {
  return getJobSkills(jobType, level).filter(s => s.type === 'passive')
}

/**
 * 根据 ID 获取技能配置
 * @param skillId - 技能 ID
 * @returns 技能配置或 undefined
 */
export function getSkillConfig(skillId: number): SkillConfig | undefined {
  return SKILL_CONFIGS[skillId]
}

/**
 * 获取元素名称
 * @param element - 元素编号
 * @returns 元素中文名称
 */
export function getElementName(element?: number): string {
  const names: Record<number, string> = {
    0: '无', 1: '火', 2: '水', 3: '风', 4: '地', 5: '光', 6: '暗'
  }
  return names[element ?? 0] ?? '无'
}

/**
 * 获取元素对应颜色
 * @param element - 元素编号
 * @returns CSS 颜色值
 */
export function getElementColor(element?: number): string {
  const colors: Record<number, string> = {
    0: 'var(--text-muted)',
    1: '#ff6b35',
    2: '#3b82f6',
    3: '#22c55e',
    4: '#a16207',
    5: '#eab308',
    6: '#7c3aed'
  }
  return colors[element ?? 0] ?? 'var(--text-muted)'
}
