/**
 * 角色相关 API
 * 角色列表、创建、删除、名称检测、属性加点
 */
import request from './request'
import { parseExtraStats } from './inventory'
import type { ApiResponse } from './request'
import type { EquipmentSlots, EquipmentSlotType, Equipment, ExtraStat } from '../types/equipment'
import type { PetInfo } from '../types/pet'
import type { LevelUpResult } from '../utils/levelConfig'

/**
 * 角色信息（与后端 characters 表字段对应）
 * 后端字段为 snake_case，jeecg-boot 自动转 camelCase
 */
export interface CharacterInfo {
  id: string
  userId: string
  characterName: string
  profession: number           // 职业类型：1-剑客, 2-术士, 3-刺客
  professionName: string       // 职业名称（后端返回）
  level: number
  experience: number           // 当前经验值
  nextLevelExp: number         // 升级所需经验
  availablePoints: number      // 可用属性点
  strength: number             // 力量
  intelligence: number         // 智力
  agility: number              // 敏捷
  hp: number                   // 当前生命值
  maxHp: number                // 最大生命值
  mp: number                   // 当前魔法值
  maxMp: number                // 最大魔法值
  physicalAttack: number       // 物理攻击力
  magicAttack: number          // 魔法攻击力
  defense: number              // 防御力
  dodgeRate: number            // 闪避率
  criticalRate: number         // 暴击率
  bonusHp: number              // 额外生命值加成
  bonusPhysicalAttack: number  // 额外物理攻击加成
  bonusMagicAttack: number     // 额外魔法攻击加成
  bonusDefense: number         // 额外防御加成
  createTime: string
  updateTime: string
  // 新增字段
  portraitUrl?: string | null    // 角色立绘 URL，null 时显示占位
  equipment: EquipmentSlots | null  // 装备槽位数据（后端可能返回 null）
  activePet: PetInfo | null    // 出战战宠数据
}

/** 空装备槽位模板 */
const EMPTY_EQUIPMENT_SLOTS: EquipmentSlots = {
  weapon: null,
  helmet: null,
  chest: null,
  legs: null,
  accessory1: null,
  accessory2: null
}

/** 后端返回的单件装备原始结构（扁平格式） */
interface RawEquipment {
  id?: string
  name?: string
  slotType?: string
  rarity?: string
  baseStats?: string
  enhanceLevel?: number
  extraStats?: string | ExtraStat[]
  setId?: string | null
  setName?: string | null
  icon?: string
  description?: string
}

/**
 * 将后端单件装备扁平数据转为前端 Equipment 对象
 * @param raw - 后端返回的装备数据
 */
function transformEquipment(raw: RawEquipment): Equipment | null {
  if (!raw || !raw.name) return null
  let stats: Record<string, number> = {}
  if (raw.baseStats) {
    try {
      stats = JSON.parse(raw.baseStats)
    } catch {
      stats = {}
    }
  }
  return {
    id: raw.id || '',
    name: raw.name,
    rarity: (raw.rarity || 'Normal') as Equipment['rarity'],
    slotType: (raw.slotType || 'weapon') as EquipmentSlotType,
    stats,
    enhanceLevel: raw.enhanceLevel ?? 0,
    extraStats: parseExtraStats(raw.extraStats),
    setId: raw.setId ?? undefined,
    setName: raw.setName ?? undefined,
    iconUrl: raw.icon,
    description: raw.description
  }
}

/**
 * 将后端返回的装备数据转为前端 EquipmentSlots 格式
 * 支持后端返回 EquipmentSlots 对象、扁平数组、或 null
 * @param raw - 后端返回的 equipment 字段
 */
function normalizeEquipment(raw: unknown): EquipmentSlots {
  if (!raw) return { ...EMPTY_EQUIPMENT_SLOTS }
  // 已经是 EquipmentSlots 格式（每个槽位是 Equipment 对象或 null）
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const slots = { ...EMPTY_EQUIPMENT_SLOTS } as Record<string, Equipment | null>
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (key in EMPTY_EQUIPMENT_SLOTS) {
        if (value && typeof value === 'object' && 'name' in (value as object)) {
          slots[key] = transformEquipment(value as RawEquipment)
        } else {
          slots[key] = null
        }
      }
    }
    return slots as unknown as EquipmentSlots
  }
  // 后端返回数组格式
  if (Array.isArray(raw)) {
    const slots = { ...EMPTY_EQUIPMENT_SLOTS } as Record<string, Equipment | null>
    for (const item of raw) {
      const equip = transformEquipment(item as RawEquipment)
      if (equip?.slotType && equip.slotType in EMPTY_EQUIPMENT_SLOTS) {
        slots[equip.slotType] = equip
      }
    }
    return slots as unknown as EquipmentSlots
  }
  return { ...EMPTY_EQUIPMENT_SLOTS }
}

/**
 * 标准化角色数据：将后端返回的 null equipment 转为空槽位对象
 * @param data - 后端返回的原始角色数据
 * @returns 标准化后的角色数据
 */
export function normalizeCharacter(data: CharacterInfo): CharacterInfo {
  return {
    ...data,
    equipment: normalizeEquipment(data.equipment),
    portraitUrl: data.portraitUrl ?? null,
    bonusHp: data.bonusHp ?? 0,
    bonusPhysicalAttack: data.bonusPhysicalAttack ?? 0,
    bonusMagicAttack: data.bonusMagicAttack ?? 0,
    bonusDefense: data.bonusDefense ?? 0
  }
}

/** 创建角色参数 */
export interface CreateCharacterParams {
  characterName: string
  profession: number           // 1-剑客, 2-术士, 3-刺客
}

/** 属性加点参数 */
export interface UpdateAttributesParams {
  characterId: string
  str: number                   // 力量增加值
  int: number                   // 智力增加值
  agi: number                   // 敏捷增加值
}

/** 角色名检测结果 */
export interface CheckNameResult {
  available: boolean
}

/** 增加经验参数 */
export interface AddExperienceParams {
  characterId: string
  expToAdd: number
}

/** 增加经验响应 */
export interface AddExperienceResult {
  character: CharacterInfo
  levelUp: LevelUpResult | null
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/** 获取当前账号的角色列表 */
export async function getCharacterListApi(): Promise<ApiResponse<CharacterInfo[]>> {
  const res = await request.get<ApiResponse<CharacterInfo[]>>('/character/list')
  res.data.data = res.data.data.map(c => normalizeCharacter(c))
  return res.data
}

/** 创建角色 */
export async function createCharacterApi(params: CreateCharacterParams): Promise<ApiResponse<CharacterInfo>> {
  const res = await request.post<ApiResponse<CharacterInfo>>('/character/create', params)
  return res.data
}

/** 检测角色名是否可用 */
export async function checkCharacterNameApi(name: string): Promise<ApiResponse<CheckNameResult>> {
  const res = await request.post<ApiResponse<CheckNameResult>>('/character/check-name', { name })
  return res.data
}

/** 删除角色 */
export async function deleteCharacterApi(characterId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<null>>(`/character/delete/${characterId}`)
  return res.data
}

/** 获取角色详情 */
export async function getCharacterInfoApi(characterId: string): Promise<ApiResponse<CharacterInfo>> {
  const res = await request.get<ApiResponse<CharacterInfo>>(`/character/info/${characterId}`)
  res.data.data = normalizeCharacter(res.data.data)
  return res.data
}

/** 属性加点 */
export async function updateAttributesApi(params: UpdateAttributesParams): Promise<ApiResponse<CharacterInfo>> {
  const res = await request.post<ApiResponse<CharacterInfo>>('/character/update-attributes', {
    characterId: params.characterId,
    str: params.str,
    int: params.int,
    agi: params.agi
  })
  return res.data
}

// ──────────────────────────────────────────
// 经验与升级
// ──────────────────────────────────────────

/**
 * 增加角色经验（可能触发升级）
 * @param params - 包含角色ID和要增加的经验值
 * @returns 更新后的角色信息，以及升级结果（如有升级）
 */
export async function addExperienceApi(params: AddExperienceParams): Promise<ApiResponse<AddExperienceResult>> {
  const res = await request.post<ApiResponse<AddExperienceResult>>('/character/add-experience', params)
  return res.data
}

// ──────────────────────────────────────────
// 装备强化
// ──────────────────────────────────────────

/** 强化结果 */
export interface EnhanceResult {
  success: boolean
  newLevel: number
  message: string
  character: CharacterInfo
}

/**
 * 强化装备
 * @param characterId - 角色 UUID
 * @param slotType - 要强化的装备槽位
 */
export async function enhanceEquipmentApi(characterId: string, slotType: string): Promise<ApiResponse<EnhanceResult>> {
  const res = await request.post<ApiResponse<EnhanceResult>>('/equipment/enhance', {
    characterId,
    slotType
  })
  return res.data
}

// ──────────────────────────────────────────
// 装备穿戴/卸下
// ──────────────────────────────────────────

/**
 * 穿戴装备（从背包到装备栏）
 * @param characterId - 角色 UUID
 * @param inventoryId - 背包记录 ID
 * @param slotType - 装备槽位类型
 */
export async function equipItemApi(characterId: string, inventoryId: string, slotType?: string): Promise<ApiResponse<CharacterInfo>> {
  const res = await request.post<ApiResponse<CharacterInfo>>('/equipment/equip', {
    characterId,
    inventoryId,
    slotType
  })
  return res.data
}

/**
 * 卸下装备（从装备栏到背包）
 * @param characterId - 角色 UUID
 * @param slotType - 要卸下的槽位类型
 */
export async function unequipItemApi(characterId: string, slotType: EquipmentSlotType): Promise<ApiResponse<CharacterInfo>> {
  const res = await request.post<ApiResponse<CharacterInfo>>('/equipment/unequip', {
    characterId,
    slotType
  })
  return res.data
}
