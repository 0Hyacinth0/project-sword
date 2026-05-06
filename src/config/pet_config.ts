/**
 * 战宠静态配置
 * 定义元素类型、技能、进化条件等
 */
import type { PetSkill } from '../types/pet'

/** 元素类型 */
export const ELEMENT_LABELS: Record<number, { name: string; color: string }> = {
  1: { name: '火', color: '#ff5722' },
  2: { name: '水', color: '#2196f3' },
  3: { name: '风', color: '#4caf50' },
  4: { name: '地', color: '#795548' },
  5: { name: '光', color: '#ffc107' },
  6: { name: '暗', color: '#9c27b0' }
}

/** 技能类型标签 */
export const SKILL_TYPE_LABELS: Record<string, string> = {
  'active_attack': '主动攻击',
  'active_support': '主动辅助',
  'passive': '被动'
}

/** 战宠类型配置（模拟 pet_types 静态表） */
export interface PetTypeConfig {
  petTypeId: number
  name: string
  element: number
  evolveTo?: number
  evolveLevel?: number
  skills: PetSkill[]
}

/** 战宠类型配置表 */
export const PET_TYPE_CONFIGS: Record<number, PetTypeConfig> = {
  1001: {
    petTypeId: 1001,
    name: '火焰精灵',
    element: 1,
    evolveTo: 1004,
    evolveLevel: 15,
    skills: [
      { id: 1, name: '火球术', type: 'active_attack', power: 120, cooldown: 2, learnLevel: 1, description: '发射火球造成120%攻击力的伤害' },
      { id: 2, name: '灼烧', type: 'passive', learnLevel: 5, description: '攻击时有15%概率附加灼烧效果' },
      { id: 3, name: '火焰护盾', type: 'active_support', cooldown: 3, learnLevel: 8, description: '3回合内减少20%受到的伤害' }
    ]
  },
  1002: {
    petTypeId: 1002,
    name: '风狼',
    element: 3,
    skills: [
      { id: 4, name: '疾风爪', type: 'active_attack', power: 100, cooldown: 1, learnLevel: 1, description: '快速爪击造成100%攻击力的伤害' },
      { id: 5, name: '风之迅捷', type: 'passive', learnLevel: 3, description: '速度提升10%' },
      { id: 12, name: '狂风斩', type: 'active_attack', power: 140, cooldown: 3, learnLevel: 10, description: '释放狂风造成140%攻击力的伤害' }
    ]
  },
  1003: {
    petTypeId: 1003,
    name: '冰晶凤凰',
    element: 2,
    skills: [
      { id: 6, name: '冰晶风暴', type: 'active_attack', power: 150, cooldown: 3, learnLevel: 1, description: '召唤冰晶风暴造成150%攻击力的伤害' },
      { id: 7, name: '寒冰护体', type: 'active_support', cooldown: 4, learnLevel: 5, description: '4回合内提升30%防御力' },
      { id: 8, name: '冰霜之心', type: 'passive', learnLevel: 8, description: '受到攻击时有20%概率冻结攻击者1回合' }
    ]
  },
  1004: {
    petTypeId: 1004,
    name: '烈焰凤凰',
    element: 1,
    skills: [
      { id: 9, name: '涅槃之焰', type: 'active_attack', power: 200, cooldown: 4, learnLevel: 0, description: '释放涅槃之焰造成200%攻击力的伤害' },
      { id: 10, name: '火焰之心', type: 'passive', learnLevel: 0, description: '所有火属性技能伤害提升20%' },
      { id: 11, name: '浴火重生', type: 'active_support', cooldown: 5, learnLevel: 0, description: '复活并恢复30%生命值（每场战斗限1次）' }
    ]
  }
}

/** 进化材料配置 */
export const EVOLVE_MATERIALS: Record<number, Array<{ itemId: number; quantity: number }>> = {
  1001: [{ itemId: 2005, quantity: 2 }, { itemId: 2003, quantity: 1 }],
  1002: [{ itemId: 2005, quantity: 1 }],
  1003: [{ itemId: 2005, quantity: 3 }, { itemId: 2004, quantity: 1 }]
}

/** 进化材料名称 */
export const MATERIAL_NAMES: Record<number, string> = {
  2001: '铁矿石',
  2002: '精钢矿石',
  2003: '秘法水晶',
  2004: '龙鳞碎片',
  2005: '战宠进化石'
}

/**
 * 获取战宠类型配置
 */
export function getPetTypeConfig(petTypeId: number): PetTypeConfig | undefined {
  return PET_TYPE_CONFIGS[petTypeId]
}

/**
 * 获取战宠已学会的技能列表
 * 根据战宠类型和等级，返回所有满足学习条件的技能
 * @param petTypeId - 战宠类型 ID
 * @param level - 战宠当前等级
 * @returns 已学会的技能列表
 */
export function getLearnedSkills(petTypeId: number, level: number): PetSkill[] {
  const config = PET_TYPE_CONFIGS[petTypeId]
  if (!config) return []
  return config.skills.filter(s => {
    // learnLevel === 0 是进化专属，由进化逻辑处理
    if (s.learnLevel === 0) return false
    return (s.learnLevel ?? 1) <= level
  })
}

/**
 * 获取进化材料列表
 */
export function getEvolveMaterials(petTypeId: number): Array<{ itemId: number; quantity: number; name: string }> {
  const materials = EVOLVE_MATERIALS[petTypeId] || []
  return materials.map(m => ({ ...m, name: MATERIAL_NAMES[m.itemId] || '未知材料' }))
}
