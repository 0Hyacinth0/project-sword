/**
 * 战宠相关 API
 * 获取角色战宠列表、出战/收回战宠、喂食、进化、重命名
 */
import request from './request'
import type { ApiResponse } from './request'
import type { PetInfo, PetDetailInfo, PetListResult } from '../types/pet'

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取角色战宠列表
 */
export async function getPetListApi(characterId: string): Promise<ApiResponse<PetListResult>> {
  const res = await request.get<ApiResponse<PetListResult>>(`/pet/list/${characterId}`)
  return res.data
}

/**
 * 获取战宠详情
 */
export async function getPetDetailApi(characterId: string, petId: string): Promise<ApiResponse<PetDetailInfo>> {
  const res = await request.get<ApiResponse<PetDetailInfo>>(`/pet/detail/${petId}`)
  return res.data
}

/**
 * 设置出战战宠
 */
export async function setActivePetApi(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/set-active', { characterId, petId })
  return res.data
}

/**
 * 喂食战宠（消耗经验道具）
 * @param characterId - 角色 UUID
 * @param petId - 战宠实例 ID
 * @param inventoryId - 经验道具背包记录 ID
 * @param quantity - 使用数量
 */
export async function feedPetApi(characterId: string, petId: string, inventoryId: string, quantity: number): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/feed', { characterId, petId, inventoryId, quantity })
  return res.data
}

/**
 * 进化战宠
 */
export async function evolvePetApi(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/evolve', { characterId, petId })
  return res.data
}

/**
 * 重命名战宠
 */
export async function renamePetApi(characterId: string, petId: string, nickname: string): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/rename', { characterId, petId, nickname })
  return res.data
}

/**
 * 装备技能到槽位
 * @param characterId - 角色 ID
 * @param petId - 战宠实例 ID
 * @param skillId - 技能 ID
 * @param slotIndex - 槽位索引（0-2）
 */
export async function equipSkillApi(characterId: string, petId: string, skillId: number, slotIndex: number): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/equip-skill', { characterId, petId, skillId, slotIndex })
  return res.data
}

/**
 * 卸下技能
 * @param characterId - 角色 ID
 * @param petId - 战宠实例 ID
 * @param slotIndex - 槽位索引（0-2）
 */
export async function unequipSkillApi(characterId: string, petId: string, slotIndex: number): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/unequip-skill', { characterId, petId, slotIndex })
  return res.data
}

/**
 * 给战宠穿戴装备
 * @param characterId - 角色 ID
 * @param petId - 战宠实例 ID
 * @param inventoryId - 背包记录 ID
 * @param slotType - 装备槽位类型（armor / accessory）
 */
export async function equipPetItemApi(characterId: string, petId: string, inventoryId: string, slotType: 'armor' | 'accessory'): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/equip-item', { characterId, petId, inventoryId, slotType })
  return res.data
}

/**
 * 卸下战宠装备
 * @param characterId - 角色 ID
 * @param petId - 战宠实例 ID
 * @param slotType - 装备槽位类型（armor / accessory）
 */
export async function unequipPetItemApi(characterId: string, petId: string, slotType: 'armor' | 'accessory'): Promise<ApiResponse<PetListResult>> {
  const res = await request.post<ApiResponse<PetListResult>>('/pet/unequip-item', { characterId, petId, slotType })
  return res.data
}
