/**
 * 职业静态配置数据
 * 前端展示用，与后端职业配置表对应
 */

/** 职业类型枚举 */
export type JobType = 'WARRIOR' | 'MAGE' | 'HUNTER'

/** 技能信息 */
export interface SkillInfo {
  name: string
  description: string
  icon: string      // Lucide 图标名
  level: number     // 解锁等级
}

/** 雷达图维度 */
export interface RadarStats {
  survival: number   // 生存 (0-5)
  attack: number     // 攻击 (0-5)
  speed: number      // 速度 (0-5)
}

/** 职业配置 */
export interface JobConfig {
  type: JobType
  name: string
  nameEn: string
  description: string
  color: string             // 职业主题色
  colorLight: string        // 职业浅色
  icon: string              // Lucide 图标名
  baseStr: number
  baseInt: number
  baseAgi: number
  radar: RadarStats
  skills: SkillInfo[]
}

/** 三职业完整配置 */
export const JOB_CONFIGS: Record<JobType, JobConfig> = {
  WARRIOR: {
    type: 'WARRIOR',
    name: '战士',
    nameEn: 'Warrior',
    description: '身经百战的钢铁斗士，以强大的力量和坚韧的体魄著称。在战场上冲锋陷阵，是队伍中最可靠的前排壁垒。',
    color: '#ff6b35',
    colorLight: 'rgba(255, 107, 53, 0.15)',
    icon: 'Sword',
    baseStr: 10,
    baseInt: 3,
    baseAgi: 5,
    radar: { survival: 5, attack: 3, speed: 2 },
    skills: [
      {
        name: '旋风斩',
        description: '挥舞武器形成风暴，对周围所有敌人造成 150% 物理伤害。',
        icon: 'Swords',
        level: 1
      },
      {
        name: '钢铁壁垒',
        description: '进入防御姿态，减少 50% 受到的伤害并嘲讽所有敌人，持续 2 回合。',
        icon: 'Shield',
        level: 10
      }
    ]
  },
  MAGE: {
    type: 'MAGE',
    name: '法师',
    nameEn: 'Mage',
    description: '掌握奥术奥义的智慧贤者，以强大的魔法力量毁灭一切。虽然身躯脆弱，但拥有无与伦比的AOE爆发伤害。',
    color: '#7c5cfc',
    colorLight: 'rgba(124, 92, 252, 0.15)',
    icon: 'Sparkles',
    baseStr: 2,
    baseInt: 12,
    baseAgi: 4,
    radar: { survival: 1, attack: 5, speed: 3 },
    skills: [
      {
        name: '陨石术',
        description: '召唤灼热陨石从天而降，对目标区域造成 200% 魔法伤害并附带灼烧效果。',
        icon: 'Flame',
        level: 1
      },
      {
        name: '时间静止',
        description: '冻结时间 1 回合，期间所有敌人无法行动，自身可进行一次额外施法。',
        icon: 'Clock',
        level: 10
      }
    ]
  },
  HUNTER: {
    type: 'HUNTER',
    name: '猎人',
    nameEn: 'Hunter',
    description: '来自荒野的敏捷射手，以惊人的速度和致命的暴击闻名。擅长在战斗中闪转腾挪，逐一击破敌人。',
    color: '#22c55e',
    colorLight: 'rgba(34, 197, 94, 0.15)',
    icon: 'Target',
    baseStr: 5,
    baseInt: 4,
    baseAgi: 11,
    radar: { survival: 2, attack: 4, speed: 5 },
    skills: [
      {
        name: '穿心箭',
        description: '蓄力射出一箭，造成 180% 物理伤害，30% 概率触发暴击翻倍。',
        icon: 'Crosshair',
        level: 1
      },
      {
        name: '影遁',
        description: '隐入暗影，闪避下一次攻击并获得 2 回合 50% 暴击率提升。',
        icon: 'Eye',
        level: 10
      }
    ]
  }
}

/** 职业列表（有序） */
export const JOB_LIST: JobType[] = ['WARRIOR', 'MAGE', 'HUNTER']

/** 随机取名词库 */
const NAME_PREFIXES = [
  '暗影', '烈焰', '冰霜', '雷鸣', '苍穹',
  '幽冥', '圣光', '破晓', '星辰', '龙魂',
  '风暴', '血色', '寒冰', '紫电', '赤焰',
  '银月', '鬼魅', '天罡', '玄武', '朱雀'
]

const NAME_SUFFIXES = [
  '剑客', '行者', '猎手', '骑士', '贤者',
  '游侠', '刺客', '守望者', '战神', '使者',
  '领主', '先知', '浪人', '隐者', '执事',
  '裁决者', '拓荒者', '漫游者', '掌控者', '吟游诗人'
]

/** 生成随机角色名 */
export function generateRandomName(): string {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]
  return `${prefix}${suffix}`
}

// ──────────────────────────────────────────
// 职业编号映射（与后端 profession 字段对应）
// 1-战士, 2-法师, 3-猎人
// ──────────────────────────────────────────

/** 后端职业编号 → 前端 JobType */
const PROFESSION_TO_JOB: Record<number, JobType> = {
  1: 'WARRIOR',
  2: 'MAGE',
  3: 'HUNTER'
}

/** 前端 JobType → 后端职业编号 */
const JOB_TO_PROFESSION: Record<JobType, number> = {
  WARRIOR: 1,
  MAGE: 2,
  HUNTER: 3
}

/** 后端编号转前端 JobType */
export function professionToJobType(profession: number): JobType {
  return PROFESSION_TO_JOB[profession] || 'WARRIOR'
}

/** 前端 JobType 转后端编号 */
export function jobTypeToProfession(jobType: JobType): number {
  return JOB_TO_PROFESSION[jobType]
}

/** 根据后端编号获取职业配置 */
export function getJobConfigByProfession(profession: number): JobConfig {
  return JOB_CONFIGS[professionToJobType(profession)]
}
