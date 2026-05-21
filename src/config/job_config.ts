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
  portrait: string          // 立绘图片路径
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
    name: '剑客',
    nameEn: 'Warrior',
    description: '江湖侠士，以剑为魂，刚柔并济。冲锋陷阵，是队伍中最可靠的前排壁垒。',
    color: '#ff6b35',
    colorLight: 'rgba(255, 107, 53, 0.15)',
    icon: 'Sword',
    portrait: '/assets/portraits/warrior.png',
    baseStr: 10,
    baseInt: 3,
    baseAgi: 5,
    radar: { survival: 5, attack: 3, speed: 2 },
    skills: [
      {
        name: '狂风剑诀',
        description: '剑气纵横成风，对周围所有敌人造成 150% 外功伤害。',
        icon: 'Swords',
        level: 1
      },
      {
        name: '金钟罩',
        description: '护体罡气，减免 50% 伤害并震慑所有敌人，持续 2 回合。',
        icon: 'Shield',
        level: 10
      }
    ]
  },
  MAGE: {
    type: 'MAGE',
    name: '术士',
    nameEn: 'Mage',
    description: '修习玄术之辈，以阴阳五行之力驱使天地异象。虽身躯薄弱，但内功爆发无人能敌。',
    color: '#7c5cfc',
    colorLight: 'rgba(124, 92, 252, 0.15)',
    icon: 'Sparkles',
    portrait: '/assets/portraits/mage.png',
    baseStr: 2,
    baseInt: 12,
    baseAgi: 4,
    radar: { survival: 1, attack: 5, speed: 3 },
    skills: [
      {
        name: '天火焚城',
        description: '召唤九天玄火，对目标区域造成 200% 内功伤害并附带灼烧效果。',
        icon: 'Flame',
        level: 1
      },
      {
        name: '定身咒',
        description: '封印时空 1 回合，期间所有敌人无法行动，自身可进行一次额外施法。',
        icon: 'Clock',
        level: 10
      }
    ]
  },
  HUNTER: {
    type: 'HUNTER',
    name: '刺客',
    nameEn: 'Hunter',
    description: '潜行暗影之徒，来去无踪，致命一击瞬杀千机。擅长在战斗中闪转腾挪，逐一击破敌人。',
    color: '#22c55e',
    colorLight: 'rgba(34, 197, 94, 0.15)',
    icon: 'Target',
    portrait: '/assets/portraits/hunter.png',
    baseStr: 5,
    baseInt: 4,
    baseAgi: 11,
    radar: { survival: 2, attack: 4, speed: 5 },
    skills: [
      {
        name: '惊雷一击',
        description: '蓄势雷霆一击，造成 180% 外功伤害，三成几率暴击倍增。',
        icon: 'Crosshair',
        level: 1
      },
      {
        name: '潜影术',
        description: '化入暗影，规避下一次攻击并获得 2 回合 50% 暴击率加持。',
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
  '断魂', '碎星', '寒江', '孤雁', '苍穹',
  '幽冥', '灵霄', '破晓', '星辰', '龙魂',
  '飞雪', '血影', '凝霜', '紫电', '赤焰',
  '银月', '鬼魅', '天罡', '玄武', '朱雀'
]

const NAME_SUFFIXES = [
  '侠', '客', '隐士', '行者', '散人',
  '游侠', '刺客', '居士', '真人', '散人',
  '掌门', '道人', '浪子', '书生', '剑手',
  '义士', '武者', '隐者', '剑灵', '云客'
]

/** 生成随机角色名 */
export function generateRandomName(): string {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]
  return `${prefix}${suffix}`
}

// ──────────────────────────────────────────
// 职业编号映射（与后端 profession 字段对应）
// 1-剑客, 2-术士, 3-刺客
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
