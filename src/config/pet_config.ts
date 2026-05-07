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
  rarity: number           // 品质 1-4
  baseHp: number           // 基础生命
  baseAttack: number       // 基础攻击
  baseDefense: number      // 基础防御
  baseSpeed: number        // 基础速度
  description: string      // 描述
  evolveTo?: number
  evolveLevel?: number
  skills: PetSkill[]
}

/** 战宠类型配置表 */
export const PET_TYPE_CONFIGS: Record<number, PetTypeConfig> = {
  1001: {
    petTypeId: 1001, name: '火焰精灵', element: 1, rarity: 3,
    baseHp: 80, baseAttack: 18, baseDefense: 8, baseSpeed: 14,
    description: '诞生于熔岩的精灵，擅长火属性魔法攻击',
    evolveTo: 1004, evolveLevel: 15,
    skills: [
      { id: 1, name: '火球术', type: 'active_attack', power: 120, cooldown: 2, learnLevel: 1, description: '发射火球造成120%攻击力的伤害' },
      { id: 2, name: '灼烧', type: 'passive', learnLevel: 5, description: '攻击时有15%概率附加灼烧效果' },
      { id: 3, name: '火焰护盾', type: 'active_support', cooldown: 3, learnLevel: 8, description: '3回合内减少20%受到的伤害' }
    ]
  },
  1002: {
    petTypeId: 1002, name: '风狼', element: 3, rarity: 2,
    baseHp: 55, baseAttack: 14, baseDefense: 5, baseSpeed: 20,
    description: '栖息在高原的迅捷猎手，速度极快',
    skills: [
      { id: 4, name: '疾风爪', type: 'active_attack', power: 100, cooldown: 1, learnLevel: 1, description: '快速爪击造成100%攻击力的伤害' },
      { id: 5, name: '风之迅捷', type: 'passive', learnLevel: 3, description: '速度提升10%' },
      { id: 12, name: '狂风斩', type: 'active_attack', power: 140, cooldown: 3, learnLevel: 10, description: '释放狂风造成140%攻击力的伤害' }
    ]
  },
  1003: {
    petTypeId: 1003, name: '冰晶凤凰', element: 2, rarity: 4,
    baseHp: 120, baseAttack: 28, baseDefense: 12, baseSpeed: 16,
    description: '传说中的冰属性神兽，拥有极寒之力',
    skills: [
      { id: 6, name: '冰晶风暴', type: 'active_attack', power: 150, cooldown: 3, learnLevel: 1, description: '召唤冰晶风暴造成150%攻击力的伤害' },
      { id: 7, name: '寒冰护体', type: 'active_support', cooldown: 4, learnLevel: 5, description: '4回合内提升30%防御力' },
      { id: 8, name: '冰霜之心', type: 'passive', learnLevel: 8, description: '受到攻击时有20%概率冻结攻击者1回合' }
    ]
  },
  1004: {
    petTypeId: 1004, name: '烈焰凤凰', element: 1, rarity: 4,
    baseHp: 160, baseAttack: 38, baseDefense: 16, baseSpeed: 18,
    description: '火焰精灵的进化形态，浴火重生的不死鸟',
    skills: [
      { id: 9, name: '涅槃之焰', type: 'active_attack', power: 200, cooldown: 4, learnLevel: 0, description: '释放涅槃之焰造成200%攻击力的伤害' },
      { id: 10, name: '火焰之心', type: 'passive', learnLevel: 0, description: '所有火属性技能伤害提升20%' },
      { id: 11, name: '浴火重生', type: 'active_support', cooldown: 5, learnLevel: 0, description: '复活并恢复30%生命值（每场战斗限1次）' }
    ]
  },
  1005: {
    petTypeId: 1005, name: '土岩兽', element: 4, rarity: 1,
    baseHp: 70, baseAttack: 10, baseDefense: 15, baseSpeed: 6,
    description: '生活在山洞中的小型岩石生物，防御力出众',
    skills: [
      { id: 13, name: '岩石撞击', type: 'active_attack', power: 80, cooldown: 1, learnLevel: 1, description: '用岩石撞击造成80%攻击力的伤害' },
      { id: 14, name: '硬化', type: 'passive', learnLevel: 4, description: '防御力提升15%' }
    ]
  },
  1006: {
    petTypeId: 1006, name: '光辉精灵', element: 5, rarity: 3,
    baseHp: 65, baseAttack: 16, baseDefense: 10, baseSpeed: 15,
    description: '沐浴圣光的精灵，拥有治愈之力',
    skills: [
      { id: 15, name: '光之箭', type: 'active_attack', power: 110, cooldown: 2, learnLevel: 1, description: '射出光箭造成110%攻击力的伤害' },
      { id: 16, name: '圣光治愈', type: 'active_support', cooldown: 3, learnLevel: 6, description: '恢复主人20%最大生命值' },
      { id: 17, name: '光之庇护', type: 'passive', learnLevel: 9, description: '被攻击时10%概率完全闪避' }
    ]
  },
  1007: {
    petTypeId: 1007, name: '暗影猫', element: 6, rarity: 2,
    baseHp: 45, baseAttack: 16, baseDefense: 6, baseSpeed: 22,
    description: '潜伏在黑暗中的敏捷猎手，暴击率极高',
    skills: [
      { id: 18, name: '暗影突袭', type: 'active_attack', power: 130, cooldown: 2, learnLevel: 1, description: '从暗影中突袭造成130%攻击力的伤害' },
      { id: 19, name: '夜行之眼', type: 'passive', learnLevel: 5, description: '暴击率提升15%' }
    ]
  },
  1008: {
    petTypeId: 1008, name: '水灵龟', element: 2, rarity: 1,
    baseHp: 90, baseAttack: 8, baseDefense: 18, baseSpeed: 5,
    description: '温和的水属性生物，擅长防御和保护',
    skills: [
      { id: 20, name: '水之壁垒', type: 'active_support', cooldown: 2, learnLevel: 1, description: '2回合内提升25%防御力' },
      { id: 21, name: '潮汐之力', type: 'passive', learnLevel: 6, description: '受到伤害减少10%' }
    ]
  },
  1009: {
    petTypeId: 1009, name: '雷鹰', element: 1, rarity: 3,
    baseHp: 60, baseAttack: 22, baseDefense: 7, baseSpeed: 25,
    description: '翱翔在雷云之上的猛禽，攻击迅猛',
    evolveTo: 1010, evolveLevel: 12,
    skills: [
      { id: 22, name: '雷霆俯冲', type: 'active_attack', power: 140, cooldown: 2, learnLevel: 1, description: '从高空俯冲造成140%攻击力的伤害' },
      { id: 23, name: '雷电之翼', type: 'passive', learnLevel: 4, description: '攻击速度提升20%' },
      { id: 24, name: '闪电链', type: 'active_attack', power: 100, cooldown: 3, learnLevel: 8, description: '闪电弹射攻击多个目标' }
    ]
  },
  1010: {
    petTypeId: 1010, name: '风暴雷神', element: 1, rarity: 4,
    baseHp: 100, baseAttack: 35, baseDefense: 12, baseSpeed: 28,
    description: '雷鹰的进化形态，掌控雷电之力的天空霸主',
    skills: [
      { id: 25, name: '神罚之雷', type: 'active_attack', power: 180, cooldown: 3, learnLevel: 0, description: '召唤天雷造成180%攻击力的伤害' },
      { id: 26, name: '雷神之体', type: 'passive', learnLevel: 0, description: '受到攻击时有25%概率反弹30%伤害' },
      { id: 27, name: '雷暴领域', type: 'active_support', cooldown: 5, learnLevel: 0, description: '3回合内所有攻击附带雷电效果' }
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

/**
 * 获取所有战宠类型配置列表（图鉴用）
 */
export function getAllPetTypes(): PetTypeConfig[] {
  return Object.values(PET_TYPE_CONFIGS).sort((a, b) => a.petTypeId - b.petTypeId)
}

/**
 * 获取战宠的进化链（从基础形态到最终形态）
 */
export function getEvolveChain(petTypeId: number): PetTypeConfig[] {
  const chain: PetTypeConfig[] = []
  let current = PET_TYPE_CONFIGS[petTypeId]
  // 先找基础形态（没有其他战宠的 evolveTo 指向它的，或从自身往前找）
  // 简化：找到最小的 id（基础形态通常是链条中最小的）
  const allTypes = Object.values(PET_TYPE_CONFIGS)
  let base = current
  for (const t of allTypes) {
    if (t.evolveTo === petTypeId) { base = t; break }
  }
  chain.push(base)
  while (base.evolveTo) {
    const next = PET_TYPE_CONFIGS[base.evolveTo]
    if (!next) break
    chain.push(next)
    base = next
  }
  return chain
}
