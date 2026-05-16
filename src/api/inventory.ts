/**
 * 背包物品 API
 * 获取角色背包物品列表
 */
import request from './request'
import type { ApiResponse } from './request'
import type { InventoryItem, BaseItem, UseItemResult, ItemCategory, ItemRarity } from '../types/item'
import type { ExtraStat } from '../types/equipment'
import type { BattleRewardItem, BattleRewards } from '../types/battle'
import { isMockEnabled } from '../utils/mockConfig'

/** 后端返回的原始背包物品结构（扁平格式） */
interface RawInventoryItem {
  id: string
  characterId: string
  itemId: string
  quantity: number
  obtainedAt: string
  name: string
  type: number
  slotType?: string
  rarity: string
  baseStats?: string
  setId?: string | null
  setName?: string | null
  icon?: string
  description?: string
  enhanceLevel?: number
  extraStats?: string | ExtraStat[]
}

export interface MockConsumableEffectPayload {
  characterId: string
  healHp: number
  healMp: number
  exp: number
  revivePercent: number
}

let mockConsumableEffectApplier: ((payload: MockConsumableEffectPayload) => void) | null = null

/**
 * 注册 Mock 消耗品效果处理器，用于让背包使用道具后同步角色状态。
 * @param applier - 消耗品效果处理函数
 * @returns 无返回值
 */
export function setMockConsumableEffectApplier(applier: (payload: MockConsumableEffectPayload) => void): void {
  mockConsumableEffectApplier = applier
}

/**
 * 解析后端返回的词条数据
 * 支持后端返回 JSON 字符串或数组格式
 * @param raw - 原始词条数据
 * @returns ExtraStat 数组
 */
export function parseExtraStats(raw: string | ExtraStat[] | undefined): ExtraStat[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 将后端扁平格式的背包物品转换为前端嵌套格式
 * @param raw - 后端返回的原始物品数据
 * @returns 前端 InventoryItem 格式
 */
function transformInventoryItem(raw: RawInventoryItem): InventoryItem {
  const categoryMap: Record<number, ItemCategory> = { 1: 'equipment', 2: 'consumable', 3: 'material' }
  let stats: Record<string, number> = {}
  if (raw.baseStats) {
    try {
      stats = JSON.parse(raw.baseStats)
    } catch {
      stats = {}
    }
  }
  const baseItem: BaseItem = {
    itemId: Number(raw.itemId),
    name: raw.name,
    category: categoryMap[raw.type] || 'material',
    rarity: raw.rarity as ItemRarity,
    description: raw.description || '',
    iconUrl: raw.icon || null,
    maxStack: 1,
    sellPrice: 0,
    slotType: raw.slotType as BaseItem['slotType'],
    stats,
    setId: raw.setId ?? undefined,
    setName: raw.setName ?? undefined
  }
  return {
    id: raw.id,
    characterId: raw.characterId,
    itemId: Number(raw.itemId),
    item: baseItem,
    quantity: raw.quantity,
    obtainedAt: raw.obtainedAt,
    enhanceLevel: raw.enhanceLevel ?? 0,
    extraStats: parseExtraStats(raw.extraStats)
  }
}

// ──────────────────────────────────────────
// Mock 物品静态配置（模拟 items 表）
// ──────────────────────────────────────────

export const mockItemTemplates: BaseItem[] = [
  // 消耗品
  {
    itemId: 1001,
    name: '小型生命药水',
    category: 'consumable',
    rarity: 'Normal',
    description: '恢复 50 点生命值。冒险者必备的基础补给品。',
    iconUrl: null,
    maxStack: 99,
    sellPrice: 10,
    effects: [{ type: 'heal_hp', value: 50, description: '恢复 50 HP' }]
  },
  {
    itemId: 1002,
    name: '中型生命药水',
    category: 'consumable',
    rarity: 'Rare',
    description: '恢复 150 点生命值。适合中等强度的战斗补给。',
    iconUrl: null,
    maxStack: 99,
    sellPrice: 30,
    effects: [{ type: 'heal_hp', value: 150, description: '恢复 150 HP' }]
  },
  {
    itemId: 1003,
    name: '大型生命药水',
    category: 'consumable',
    rarity: 'Epic',
    description: '恢复 400 点生命值。高强度战斗中的救命良药。',
    iconUrl: null,
    maxStack: 50,
    sellPrice: 80,
    effects: [{ type: 'heal_hp', value: 400, description: '恢复 400 HP' }]
  },
  {
    itemId: 1004,
    name: '魔法药水',
    category: 'consumable',
    rarity: 'Normal',
    description: '恢复 30 点魔法值。法师职业的常用补给。',
    iconUrl: null,
    maxStack: 99,
    sellPrice: 15,
    effects: [{ type: 'heal_mp', value: 30, description: '恢复 30 MP' }]
  },
  {
    itemId: 1005,
    name: '高级魔法药水',
    category: 'consumable',
    rarity: 'Rare',
    description: '恢复 80 点魔法值。施法者的进阶补给品。',
    iconUrl: null,
    maxStack: 99,
    sellPrice: 40,
    effects: [{ type: 'heal_mp', value: 80, description: '恢复 80 MP' }]
  },
  {
    itemId: 1006,
    name: '经验卷轴（小）',
    category: 'consumable',
    rarity: 'Rare',
    description: '使用后获得 100 点经验值。适合新手冒险者快速成长。',
    iconUrl: null,
    maxStack: 20,
    sellPrice: 50,
    effects: [{ type: 'add_exp', value: 100, description: '获得 100 EXP' }]
  },
  {
    itemId: 1007,
    name: '经验卷轴（中）',
    category: 'consumable',
    rarity: 'Epic',
    description: '使用后获得 500 点经验值。冒险者的进阶成长道具。',
    iconUrl: null,
    maxStack: 10,
    sellPrice: 200,
    effects: [{ type: 'add_exp', value: 500, description: '获得 500 EXP' }]
  },
  {
    itemId: 1008,
    name: '经验卷轴（大）',
    category: 'consumable',
    rarity: 'Legendary',
    description: '使用后获得 2000 点经验值。极为珍贵的成长秘宝。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 800,
    effects: [{ type: 'add_exp', value: 2000, description: '获得 2000 EXP' }]
  },
  {
    itemId: 1009,
    name: '复活卷轴',
    category: 'consumable',
    rarity: 'Epic',
    description: '使阵亡角色复活，并恢复 30% 最大生命值。稀有且珍贵的道具。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 300,
    effects: [{ type: 'revive', value: 30, description: '复活并恢复 30% HP' }]
  },
  // 材料
  {
    itemId: 2001,
    name: '铁矿石',
    category: 'material',
    rarity: 'Normal',
    description: '基础的锻造材料，用于制作普通品质装备。',
    iconUrl: null,
    maxStack: 99,
    sellPrice: 5,
    source: '迷雾森林矿点、普通副本掉落',
    usage: '装备强化（+1~+3）、普通装备制作'
  },
  {
    itemId: 2002,
    name: '精钢矿石',
    category: 'material',
    rarity: 'Rare',
    description: '优质的锻造材料，用于制作稀有品质装备。',
    iconUrl: null,
    maxStack: 50,
    sellPrice: 20,
    source: '白骨荒野矿点、精英副本掉落',
    usage: '装备强化（+4~+6）、稀有装备制作'
  },
  {
    itemId: 2003,
    name: '秘法水晶',
    category: 'material',
    rarity: 'Epic',
    description: '蕴含魔力的稀有水晶，用于史诗装备的制作与强化。',
    iconUrl: null,
    maxStack: 20,
    sellPrice: 100,
    source: '团队副本 Boss 掉落',
    usage: '装备强化（+7~+10）、史诗装备制作、战宠进化'
  },
  {
    itemId: 2004,
    name: '龙鳞碎片',
    category: 'material',
    rarity: 'Legendary',
    description: '传说中的龙鳞残片，极为珍贵的顶级材料。',
    iconUrl: null,
    maxStack: 10,
    sellPrice: 500,
    source: '团队副本 Boss（低概率掉落）',
    usage: '传说装备制作、战宠最终进化'
  },
  {
    itemId: 2005,
    name: '战宠进化石',
    category: 'material',
    rarity: 'Epic',
    description: '战宠进化的必需材料，可激发战宠的潜在能力。',
    iconUrl: null,
    maxStack: 10,
    sellPrice: 150,
    source: '精英副本、团队副本掉落',
    usage: '战宠进化（所有品质）'
  },
  // 装备
  {
    itemId: 3001,
    name: '烈焰之刃',
    category: 'equipment',
    rarity: 'Epic',
    description: '蕴含火焰之力的长剑，攻击时附带灼热效果。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 500,
    slotType: 'weapon',
    stats: { physicalAttack: 25, strength: 5 }
  },
  {
    itemId: 3002,
    name: '秘银头盔',
    category: 'equipment',
    rarity: 'Rare',
    description: '轻便坚固的秘银头盔，提供良好的头部防护。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 150,
    slotType: 'helmet',
    stats: { defense: 6, hp: 40 }
  },
  {
    itemId: 3003,
    name: '守护胸甲',
    category: 'equipment',
    rarity: 'Rare',
    description: '刻有守护符文的精良胸甲，能有效抵挡攻击。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 200,
    slotType: 'chest',
    stats: { defense: 12, hp: 80 }
  },
  {
    itemId: 3004,
    name: '疾风护腿',
    category: 'equipment',
    rarity: 'Normal',
    description: '轻便灵活的护腿，不影响行动速度。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 80,
    slotType: 'legs',
    stats: { defense: 5, agility: 3 }
  },
  {
    itemId: 3005,
    name: '灵巧之戒',
    category: 'equipment',
    rarity: 'Epic',
    description: '蕴含灵巧之力的戒指，提升闪避与暴击能力。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 300,
    slotType: 'accessory1',
    stats: { criticalRate: 0.05, dodgeRate: 0.03, agility: 4 }
  },
  // 精英副本专属物品
  {
    itemId: 2006,
    name: '秘银碎片',
    category: 'material',
    rarity: 'Rare',
    description: '精英副本中发现的纯净秘银碎片，是打造高级装备的关键材料。',
    iconUrl: null,
    maxStack: 30,
    sellPrice: 80,
    source: '精英副本 Boss 掉落',
    usage: '精英装备制作、高级装备强化'
  },
  {
    itemId: 3006,
    name: '暗影护盾',
    category: 'equipment',
    rarity: 'Epic',
    description: '笼罩着暗影之力的神秘护盾，精英副本中才能获得的珍稀防具。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 600,
    slotType: 'accessory2',
    stats: { defense: 15, dodgeRate: 0.05, hp: 60 }
  },
  {
    itemId: 3007,
    name: '龙牙戒指',
    category: 'equipment',
    rarity: 'Legendary',
    description: '以远古龙牙铸造的传说戒指，只有在最危险的精英副本 Boss 身上才有机会获得。',
    iconUrl: null,
    maxStack: 1,
    sellPrice: 1500,
    slotType: 'accessory1',
    stats: { physicalAttack: 20, criticalRate: 0.08, strength: 8 }
  },
  // 战宠蛋（特殊材料类，使用后获得对应战宠）
  {
    itemId: 6001,
    name: '火焰精灵蛋',
    category: 'material',
    rarity: 'Rare',
    description: '蕴含火焰之力的神秘蛋，孵化后可获得火焰精灵（SR 火元素）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 300,
    source: '火焰山谷副本 Boss 掉落',
    usage: '使用后获得火焰精灵战宠'
  },
  {
    itemId: 6002,
    name: '风狼蛋',
    category: 'material',
    rarity: 'Rare',
    description: '裹挟着风之精华的蛋，孵化后可获得风狼（R 风系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 200,
    source: '迷雾森林副本 Boss 掉落',
    usage: '使用后获得风狼战宠'
  },
  {
    itemId: 6003,
    name: '冰晶凤凰蛋',
    category: 'material',
    rarity: 'Epic',
    description: '极北之地的传说蛋，孵化后可获得冰晶凤凰（SSR 水系传说战宠）。',
    iconUrl: null,
    maxStack: 3,
    sellPrice: 800,
    source: '冰霜雪原副本 Boss 掉落（极低概率）',
    usage: '使用后获得冰晶凤凰战宠'
  },
  {
    itemId: 6004,
    name: '土岩兽蛋',
    category: 'material',
    rarity: 'Normal',
    description: '坚硬如岩石的蛋，孵化后可获得土岩兽（N 地系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 150,
    source: '白骨荒野副本 Boss 掉落',
    usage: '使用后获得土岩兽战宠'
  },
  {
    itemId: 6005,
    name: '光辉精灵蛋',
    category: 'material',
    rarity: 'Rare',
    description: '散发着柔和光芒的蛋，孵化后可获得光辉精灵（SR 光系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 320,
    source: '迷雾森林副本 Boss 掉落',
    usage: '使用后获得光辉精灵战宠'
  },
  {
    itemId: 6006,
    name: '暗影猫蛋',
    category: 'material',
    rarity: 'Rare',
    description: '暗影中流转的蛋，孵化后可获得暗影猫（R 暗系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 220,
    source: '白骨荒野副本 Boss 掉落',
    usage: '使用后获得暗影猫战宠'
  },
  {
    itemId: 6007,
    name: '水灵龟蛋',
    category: 'material',
    rarity: 'Normal',
    description: '清澈如水滴的蛋，孵化后可获得水灵龟（N 水系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 160,
    source: '冰霜雪原副本 Boss 掉落',
    usage: '使用后获得水灵龟战宠'
  },
  {
    itemId: 6008,
    name: '雷鹰蛋',
    category: 'material',
    rarity: 'Rare',
    description: '蕴含雷电之力的蛋，孵化后可获得雷鹰（SR 火系战宠）。',
    iconUrl: null,
    maxStack: 5,
    sellPrice: 350,
    source: '火焰山谷副本 Boss 掉落',
    usage: '使用后获得雷鹰战宠'
  }
]

// ──────────────────────────────────────────
// Mock 角色背包数据
// ──────────────────────────────────────────

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    characterId: 'mock-char-1',
    itemId: 1001,
    item: mockItemTemplates.find(i => i.itemId === 1001)!,
    quantity: 15,
    obtainedAt: '2026-04-20T08:00:00Z'
  },
  {
    id: 'inv-002',
    characterId: 'mock-char-1',
    itemId: 1002,
    item: mockItemTemplates.find(i => i.itemId === 1002)!,
    quantity: 5,
    obtainedAt: '2026-04-25T10:00:00Z'
  },
  {
    id: 'inv-003',
    characterId: 'mock-char-1',
    itemId: 1003,
    item: mockItemTemplates.find(i => i.itemId === 1003)!,
    quantity: 2,
    obtainedAt: '2026-04-30T11:00:00Z'
  },
  {
    id: 'inv-004',
    characterId: 'mock-char-1',
    itemId: 1004,
    item: mockItemTemplates.find(i => i.itemId === 1004)!,
    quantity: 8,
    obtainedAt: '2026-04-22T12:00:00Z'
  },
  {
    id: 'inv-005',
    characterId: 'mock-char-1',
    itemId: 1006,
    item: mockItemTemplates.find(i => i.itemId === 1006)!,
    quantity: 3,
    obtainedAt: '2026-04-28T15:00:00Z'
  },
  {
    id: 'inv-006',
    characterId: 'mock-char-1',
    itemId: 1009,
    item: mockItemTemplates.find(i => i.itemId === 1009)!,
    quantity: 1,
    obtainedAt: '2026-04-29T09:00:00Z'
  },
  {
    id: 'inv-007',
    characterId: 'mock-char-1',
    itemId: 2001,
    item: mockItemTemplates.find(i => i.itemId === 2001)!,
    quantity: 30,
    obtainedAt: '2026-04-21T09:00:00Z'
  },
  {
    id: 'inv-008',
    characterId: 'mock-char-1',
    itemId: 2002,
    item: mockItemTemplates.find(i => i.itemId === 2002)!,
    quantity: 12,
    obtainedAt: '2026-04-26T14:00:00Z'
  },
  {
    id: 'inv-009',
    characterId: 'mock-char-1',
    itemId: 2003,
    item: mockItemTemplates.find(i => i.itemId === 2003)!,
    quantity: 2,
    obtainedAt: '2026-04-29T18:00:00Z'
  },
  {
    id: 'inv-010',
    characterId: 'mock-char-1',
    itemId: 2005,
    item: mockItemTemplates.find(i => i.itemId === 2005)!,
    quantity: 2,
    obtainedAt: '2026-04-30T20:00:00Z'
  },
  // 背包中的装备物品
  {
    id: 'inv-011',
    characterId: 'mock-char-1',
    itemId: 3002,
    item: mockItemTemplates.find(i => i.itemId === 3002)!,
    quantity: 1,
    obtainedAt: '2026-05-01T10:00:00Z',
    extraStats: [
      { key: 'agility', value: 2 },
      { key: 'dodgeRate', value: 0.01 }
    ]
  },
  {
    id: 'inv-012',
    characterId: 'mock-char-1',
    itemId: 3004,
    item: mockItemTemplates.find(i => i.itemId === 3004)!,
    quantity: 1,
    obtainedAt: '2026-05-01T12:00:00Z'
  },
  {
    id: 'inv-013',
    characterId: 'mock-char-1',
    itemId: 3005,
    item: mockItemTemplates.find(i => i.itemId === 3005)!,
    quantity: 1,
    obtainedAt: '2026-05-01T14:00:00Z',
    extraStats: [
      { key: 'strength', value: 4 },
      { key: 'physicalAttack', value: 7 },
      { key: 'hp', value: 30 }
    ]
  },
  {
    id: 'inv-m2-001',
    characterId: 'mock-char-2',
    itemId: 1004,
    item: mockItemTemplates.find(i => i.itemId === 1004)!,
    quantity: 12,
    obtainedAt: '2026-05-02T10:00:00Z'
  },
  {
    id: 'inv-m2-002',
    characterId: 'mock-char-2',
    itemId: 1007,
    item: mockItemTemplates.find(i => i.itemId === 1007)!,
    quantity: 2,
    obtainedAt: '2026-05-02T11:00:00Z'
  },
  {
    id: 'inv-m2-003',
    characterId: 'mock-char-2',
    itemId: 2003,
    item: mockItemTemplates.find(i => i.itemId === 2003)!,
    quantity: 4,
    obtainedAt: '2026-05-03T09:00:00Z'
  },
  {
    id: 'inv-m2-004',
    characterId: 'mock-char-2',
    itemId: 2004,
    item: mockItemTemplates.find(i => i.itemId === 2004)!,
    quantity: 1,
    obtainedAt: '2026-05-03T09:30:00Z'
  },
  {
    id: 'inv-m2-005',
    characterId: 'mock-char-2',
    itemId: 3001,
    item: mockItemTemplates.find(i => i.itemId === 3001)!,
    quantity: 1,
    obtainedAt: '2026-05-04T14:00:00Z',
    extraStats: [
      { key: 'magicAttack', value: 8 },
      { key: 'intelligence', value: 5 }
    ]
  },
  {
    id: 'inv-m2-006',
    characterId: 'mock-char-2',
    itemId: 3003,
    item: mockItemTemplates.find(i => i.itemId === 3003)!,
    quantity: 1,
    obtainedAt: '2026-05-04T16:00:00Z'
  },
  {
    id: 'inv-m2-007',
    characterId: 'mock-char-2',
    itemId: 6003,
    item: mockItemTemplates.find(i => i.itemId === 6003)!,
    quantity: 1,
    obtainedAt: '2026-05-05T18:00:00Z'
  }
]

/**
 * 创建 Mock 背包记录 ID。
 * @param characterId - 所属角色 ID
 * @param itemId - 物品模板 ID
 * @returns 唯一背包记录 ID
 */
function createMockInventoryId(characterId: string, itemId: number): string {
  return `inv-${characterId}-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 将掉落品质转换为背包物品稀有度。
 * @param quality - 掉落品质
 * @returns 背包物品稀有度
 */
function rewardQualityToRarity(quality?: BattleRewardItem['quality']): ItemRarity {
  const rarityMap: Record<NonNullable<BattleRewardItem['quality']>, ItemRarity> = {
    common: 'Normal',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  }
  return quality ? rarityMap[quality] : 'Normal'
}

/**
 * 创建一条 Mock 背包物品记录。
 * @param characterId - 所属角色 ID
 * @param itemId - 物品模板 ID
 * @param quantity - 初始数量
 * @param quality - 可选掉落品质，用于覆盖未知模板的稀有度
 * @returns 背包物品记录；模板不存在时返回 null
 */
function createMockInventoryEntry(
  characterId: string,
  itemId: number,
  quantity: number,
  quality?: BattleRewardItem['quality']
): InventoryItem | null {
  const template = mockItemTemplates.find(item => item.itemId === itemId)
  if (!template) return null
  return {
    id: createMockInventoryId(characterId, itemId),
    characterId,
    itemId,
    item: {
      ...template,
      rarity: quality ? rewardQualityToRarity(quality) : template.rarity
    },
    quantity,
    obtainedAt: new Date().toISOString()
  }
}

/**
 * 向 Mock 背包加入指定物品，并自动处理可堆叠物品。
 * @param characterId - 接收物品的角色 ID
 * @param itemId - 物品模板 ID
 * @param quantity - 加入数量
 * @param quality - 可选掉落品质
 * @returns 无返回值
 */
function addMockInventoryItem(
  characterId: string,
  itemId: number,
  quantity: number,
  quality?: BattleRewardItem['quality']
): void {
  const template = mockItemTemplates.find(item => item.itemId === itemId)
  if (!template || quantity <= 0) return

  let remaining = quantity
  while (remaining > 0) {
    if (template.maxStack > 1) {
      const stack = mockInventoryItems.find(item =>
        item.characterId === characterId &&
        item.itemId === itemId &&
        item.quantity < template.maxStack
      )
      if (stack) {
        const addCount = Math.min(template.maxStack - stack.quantity, remaining)
        stack.quantity += addCount
        remaining -= addCount
        continue
      }
      const newStackCount = Math.min(template.maxStack, remaining)
      const entry = createMockInventoryEntry(characterId, itemId, newStackCount, quality)
      if (entry) mockInventoryItems.push(entry)
      remaining -= newStackCount
      continue
    }

    const entry = createMockInventoryEntry(characterId, itemId, 1, quality)
    if (entry) mockInventoryItems.push(entry)
    remaining -= 1
  }
}

/**
 * 为新建 Mock 角色写入职业初始背包数据。
 * @param characterId - 角色 ID
 * @param profession - 职业编号：1 战士、2 法师、3 猎人
 * @returns 无返回值
 */
export function seedMockStarterInventory(characterId: string, profession: number): void {
  if (mockInventoryItems.some(item => item.characterId === characterId)) return
  const starterItems: Record<number, Array<{ itemId: number; quantity: number }>> = {
    1: [
      { itemId: 1001, quantity: 10 },
      { itemId: 1006, quantity: 3 },
      { itemId: 2001, quantity: 20 },
      { itemId: 3002, quantity: 1 }
    ],
    2: [
      { itemId: 1004, quantity: 10 },
      { itemId: 1007, quantity: 2 },
      { itemId: 2003, quantity: 2 },
      { itemId: 3001, quantity: 1 }
    ],
    3: [
      { itemId: 1001, quantity: 8 },
      { itemId: 1006, quantity: 2 },
      { itemId: 2002, quantity: 8 },
      { itemId: 3005, quantity: 1 }
    ]
  }
  for (const item of starterItems[profession] ?? starterItems[1]) {
    addMockInventoryItem(characterId, item.itemId, item.quantity)
  }
}

/**
 * 将副本或战斗 Mock 奖励写入角色背包。
 * @param characterId - 接收奖励的角色 ID
 * @param rewards - 奖励数据
 * @returns 无返回值
 */
export function grantMockRewardsToInventory(characterId: string, rewards: BattleRewards): void {
  for (const reward of rewards.items) {
    addMockInventoryItem(characterId, reward.itemId, reward.quantity, reward.quality)
  }
}

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取角色背包物品列表
 * @param characterId - 角色 UUID
 */
export async function getInventoryApi(characterId: string): Promise<ApiResponse<InventoryItem[]>> {
  if (isMockEnabled()) {
    return mockGetInventory(characterId)
  }
  const res = await request.get<ApiResponse<RawInventoryItem[]>>(`/inventory/list/${characterId}`)
  const transformed = (res.data.data as RawInventoryItem[]).map(transformInventoryItem)
  return { ...res.data, data: transformed } as ApiResponse<InventoryItem[]>
}

/**
 * 使用消耗品
 * @param characterId - 角色 UUID
 * @param inventoryId - 背包记录 ID
 * @param quantity - 使用数量
 */
export async function useItemApi(characterId: string, inventoryId: string, quantity: number): Promise<ApiResponse<UseItemResult>> {
  if (isMockEnabled()) {
    return mockUseItem(characterId, inventoryId, quantity)
  }
  const res = await request.post<ApiResponse<UseItemResult>>('/inventory/use', {
    characterId,
    inventoryId,
    quantity
  })
  return res.data
}

/**
 * 丢弃物品
 * @param characterId - 角色 UUID
 * @param inventoryId - 背包记录 ID
 * @param quantity - 丢弃数量
 */
export async function discardItemApi(characterId: string, inventoryId: string, quantity: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockDiscardItem(characterId, inventoryId, quantity)
  }
  const res = await request.post<ApiResponse<null>>('/inventory/discard', {
    characterId,
    inventoryId,
    quantity
  })
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

async function mockGetInventory(characterId: string): Promise<ApiResponse<InventoryItem[]>> {
  await delay(600)

  const items = mockInventoryItems.filter(item => item.characterId === characterId)
  // 如果该角色没有背包数据，返回空数组
  if (items.length === 0) {
    return { code: 200, message: '获取成功', data: [] }
  }

  return { code: 200, message: '获取成功', data: [...items] }
}

async function mockUseItem(characterId: string, inventoryId: string, quantity: number): Promise<ApiResponse<UseItemResult>> {
  await delay(400)

  // 查找背包记录
  const invItem = mockInventoryItems.find(i => i.id === inventoryId && i.characterId === characterId)
  if (!invItem) {
    return { code: 404, message: '物品不存在', data: { effects: [], message: '' } }
  }

  // 校验物品类型（仅消耗品可使用）
  if (invItem.item.category !== 'consumable') {
    return { code: 400, message: '该物品无法使用', data: { effects: [], message: '' } }
  }

  // 校验数量
  if (quantity <= 0 || quantity > invItem.quantity) {
    return { code: 400, message: '数量不足', data: { effects: [], message: '' } }
  }

  // 执行效果（模拟）
  const effects: string[] = []
  let totalHealHp = 0
  let totalHealMp = 0
  let totalExp = 0
  let revivePercent = 0

  if (invItem.item.effects) {
    for (const eff of invItem.item.effects) {
      const totalValue = eff.value * quantity
      if (eff.type === 'heal_hp') {
        totalHealHp += totalValue
        effects.push(`恢复 ${totalValue} HP`)
      } else if (eff.type === 'heal_mp') {
        totalHealMp += totalValue
        effects.push(`恢复 ${totalValue} MP`)
      } else if (eff.type === 'add_exp') {
        totalExp += totalValue
        effects.push(`获得 ${totalValue} EXP`)
      } else if (eff.type === 'revive') {
        revivePercent = Math.max(revivePercent, eff.value)
        effects.push(`复活并恢复 ${eff.value}% HP`)
      }
    }
  }

  // 更新数量
  invItem.quantity -= quantity
  if (invItem.quantity <= 0) {
    // 从背包移除
    const idx = mockInventoryItems.findIndex(i => i.id === inventoryId)
    if (idx !== -1) mockInventoryItems.splice(idx, 1)
  }

  // 生成汇总消息
  const messageParts: string[] = []
  if (totalHealHp > 0) messageParts.push(`恢复 ${totalHealHp} 点生命值`)
  if (totalHealMp > 0) messageParts.push(`恢复 ${totalHealMp} 点魔法值`)
  if (totalExp > 0) messageParts.push(`获得 ${totalExp} 点经验值`)
  const hasRevive = invItem.item.effects?.some(e => e.type === 'revive')
  if (hasRevive) messageParts.push('角色已复活')
  const message = messageParts.length > 0 ? `成功使用 ${invItem.item.name}×${quantity}，${messageParts.join('、')}` : '使用成功'

  mockConsumableEffectApplier?.({
    characterId,
    healHp: totalHealHp,
    healMp: totalHealMp,
    exp: totalExp,
    revivePercent
  })

  return { code: 200, message: '使用成功', data: { effects, message } }
}

async function mockDiscardItem(characterId: string, inventoryId: string, quantity: number): Promise<ApiResponse<null>> {
  await delay(400)

  // 查找背包记录
  const invItem = mockInventoryItems.find(i => i.id === inventoryId && i.characterId === characterId)
  if (!invItem) {
    return { code: 404, message: '物品不存在', data: null }
  }

  // 校验数量
  if (quantity <= 0 || quantity > invItem.quantity) {
    return { code: 400, message: '数量不足', data: null }
  }

  // 更新数量
  invItem.quantity -= quantity
  if (invItem.quantity <= 0) {
    // 从背包移除
    const idx = mockInventoryItems.findIndex(i => i.id === inventoryId)
    if (idx !== -1) mockInventoryItems.splice(idx, 1)
  }

  return { code: 200, message: '丢弃成功', data: null }
}
