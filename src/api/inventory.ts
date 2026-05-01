/**
 * 背包物品 API
 * 获取角色背包物品列表
 */
import request from './request'
import type { ApiResponse } from './request'
import type { InventoryItem, BaseItem, UseItemResult } from '../types/item'
import { isMockEnabled } from '../utils/mockConfig'

// ──────────────────────────────────────────
// Mock 物品静态配置（模拟 items 表）
// ──────────────────────────────────────────

const mockItemTemplates: BaseItem[] = [
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
  }
]

// ──────────────────────────────────────────
// Mock 角色背包数据
// ──────────────────────────────────────────

const mockInventoryItems: InventoryItem[] = [
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
    quantity: 1,
    obtainedAt: '2026-04-30T20:00:00Z'
  }
]

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
  const res = await request.get<ApiResponse<InventoryItem[]>>(`/inventory/list/${characterId}`)
  return res.data
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