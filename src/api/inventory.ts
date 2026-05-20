/**
 * 背包物品 API
 * 获取角色背包物品列表
 */
import request from './request'
import type { ApiResponse } from './request'
import type { InventoryItem, BaseItem, UseItemResult, ItemCategory, ItemRarity } from '../types/item'
import type { ExtraStat } from '../types/equipment'

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

/**
 * 获取角色背包物品列表
 * @param characterId - 角色 UUID
 */
export async function getInventoryApi(characterId: string): Promise<ApiResponse<InventoryItem[]>> {
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
  const res = await request.post<ApiResponse<null>>('/inventory/discard', {
    characterId,
    inventoryId,
    quantity
  })
  return res.data
}