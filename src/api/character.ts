/**
 * 角色相关 API
 * 角色列表、创建、删除、名称检测、属性加点
 */
import request from './request'
import type { ApiResponse } from './request'
import type { EquipmentSlots } from '../types/equipment'
import type { PetInfo } from '../types/pet'
import { calculateBaseStats } from '../utils/attributeCalculator'
import { calculateNextLevelExp, type LevelUpResult, calculateLevelUp } from '../utils/levelConfig'
import { isMockEnabled } from '../utils/mockConfig'

/**
 * 角色信息（与后端 characters 表字段对应）
 * 后端字段为 snake_case，jeecg-boot 自动转 camelCase
 */
export interface CharacterInfo {
  id: string
  userId: string
  characterName: string
  profession: number           // 职业类型：1-战士, 2-法师, 3-猎人
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
  createTime: string
  updateTime: string
  // 新增字段
  portraitUrl: string | null    // 角色立绘 URL，null 时显示占位
  equipment: EquipmentSlots    // 装备槽位数据
  activePet: PetInfo | null    // 出战战宠数据
}

/** 创建角色参数 */
export interface CreateCharacterParams {
  characterName: string
  profession: number           // 1-战士, 2-法师, 3-猎人
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
// Mock 数据
// ──────────────────────────────────────────

/** Mock 角色库 */
const mockCharacters: CharacterInfo[] = [
  {
    id: 'mock-char-1',
    userId: 'mock-user',
    characterName: '剑圣无名',
    profession: 1,
    professionName: '战士',
    portraitUrl: null,
    level: 15,
    experience: 2340,
    nextLevelExp: 3000,
    availablePoints: 3,
    strength: 10,
    intelligence: 3,
    agility: 5,
    hp: 500,
    maxHp: 500,
    mp: 50,
    maxMp: 50,
    physicalAttack: 20,
    magicAttack: 6,
    defense: 15,
    dodgeRate: 0.05,
    criticalRate: 0.03,
    createTime: '2026-04-20T08:00:00Z',
    updateTime: '2026-04-28T10:00:00Z',
    equipment: {
      weapon: { id: 'eq-001', name: '精钢长剑', rarity: 'Rare', slotType: 'weapon', stats: { physicalAttack: 15 } },
      helmet: null,
      chest: { id: 'eq-002', name: '铁甲胸铠', rarity: 'Normal', slotType: 'chest', stats: { defense: 8, hp: 50 } },
      legs: null,
      accessory1: null,
      accessory2: null
    },
    activePet: {
      id: 'pet-001',
      petTypeId: 1001,
      nickname: '小火焰',
      level: 10,
      exp: 8500,
      maxExp: 10000,
      rarity: 3,
      isActive: true,
      stats: { hp: 180, maxHp: 180, attack: 25, defense: 12, speed: 18 },
      bonusToOwner: { hp: 18, attack: 3, defense: 1 }
    }
  },
  {
    id: 'mock-char-2',
    userId: 'mock-user',
    characterName: '冰霜女王',
    profession: 2,
    professionName: '法师',
    portraitUrl: null,
    level: 8,
    experience: 860,
    nextLevelExp: 1500,
    availablePoints: 0,
    strength: 2,
    intelligence: 12,
    agility: 4,
    hp: 200,
    maxHp: 200,
    mp: 300,
    maxMp: 300,
    physicalAttack: 4,
    magicAttack: 24,
    defense: 5,
    dodgeRate: 0.03,
    criticalRate: 0.05,
    createTime: '2026-04-25T12:30:00Z',
    updateTime: '2026-04-29T08:00:00Z',
    equipment: {
      weapon: { id: 'eq-003', name: '冰晶法杖', rarity: 'Epic', slotType: 'weapon', stats: { magicAttack: 20 } },
      helmet: null,
      chest: null,
      legs: null,
      accessory1: { id: 'eq-004', name: '魔力指环', rarity: 'Rare', slotType: 'accessory1', stats: { mp: 30 } },
      accessory2: null
    },
    activePet: null
  }
]

const mockNamesTaken = new Set(['剑圣无名', '冰霜女王', '暗影刺客'])

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/** 获取当前账号的角色列表 */
export async function getCharacterListApi(): Promise<ApiResponse<CharacterInfo[]>> {
  if (isMockEnabled()) {
    await delay(800)
    return { code: 200, message: '获取成功', data: [...mockCharacters] }
  }
  const res = await request.get<ApiResponse<CharacterInfo[]>>('/character/list')
  return res.data
}

/** 创建角色 */
export async function createCharacterApi(params: CreateCharacterParams): Promise<ApiResponse<CharacterInfo>> {
  if (isMockEnabled()) {
    return mockCreateCharacter(params)
  }
  const res = await request.post<ApiResponse<CharacterInfo>>('/character/create', params)
  return res.data
}

/** 检测角色名是否可用 */
export async function checkCharacterNameApi(name: string): Promise<ApiResponse<CheckNameResult>> {
  if (isMockEnabled()) {
    await delay(500)
    const available = !mockNamesTaken.has(name)
    return {
      code: 200,
      message: available ? '角色名可用' : '该角色名已被使用',
      data: { available }
    }
  }
  const res = await request.get<ApiResponse<CheckNameResult>>('/character/check-name', {
    params: { name }
  })
  return res.data
}

/** 删除角色 */
export async function deleteCharacterApi(characterId: string): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockDeleteCharacter(characterId)
  }
  const res = await request.delete<ApiResponse<null>>(`/character/delete/${characterId}`)
  return res.data
}

/** 获取角色详情 */
export async function getCharacterInfoApi(characterId: string): Promise<ApiResponse<CharacterInfo>> {
  if (isMockEnabled()) {
    await delay(600)
    const char = mockCharacters.find(c => c.id === characterId)
    if (!char) {
      return { code: 404, message: '角色不存在', data: null as unknown as CharacterInfo }
    }
    return { code: 200, message: '获取成功', data: { ...char } }
  }
  const res = await request.get<ApiResponse<CharacterInfo>>(`/character/info/${characterId}`)
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

async function mockCreateCharacter(params: CreateCharacterParams): Promise<ApiResponse<CharacterInfo>> {
  await delay(1200)

  if (mockCharacters.length >= 3) {
    return { code: 403, message: '每个账号最多创建 3 个角色', data: null as unknown as CharacterInfo }
  }

  if (mockNamesTaken.has(params.characterName)) {
    return { code: 409, message: '该角色名已被使用', data: null as unknown as CharacterInfo }
  }

  const baseStats: Record<number, { str: number; int: number; agi: number; professionName: string }> = {
    1: { str: 10, int: 3, agi: 5, professionName: '战士' },
    2: { str: 2, int: 12, agi: 4, professionName: '法师' },
    3: { str: 5, int: 4, agi: 11, professionName: '猎人' }
  }

  const stats = baseStats[params.profession]
  const derived = calculateBaseStats(
    { strength: stats.str, intelligence: stats.int, agility: stats.agi },
    params.profession
  )
  const newChar: CharacterInfo = {
    id: crypto.randomUUID(),
    userId: 'mock-user',
    characterName: params.characterName,
    profession: params.profession,
    professionName: stats.professionName,
    portraitUrl: null,
    level: 1,
    experience: 0,
    nextLevelExp: 100,
    availablePoints: 0,
    strength: stats.str,
    intelligence: stats.int,
    agility: stats.agi,
    hp: derived.maxHp,
    maxHp: derived.maxHp,
    mp: derived.maxMp,
    maxMp: derived.maxMp,
    physicalAttack: derived.physicalAttack,
    magicAttack: derived.magicAttack,
    defense: derived.defense,
    dodgeRate: derived.dodgeRate,
    criticalRate: derived.criticalRate,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    equipment: {
      weapon: null,
      helmet: null,
      chest: null,
      legs: null,
      accessory1: null,
      accessory2: null
    },
    activePet: null
  }

  mockCharacters.push(newChar)
  mockNamesTaken.add(params.characterName)

  return { code: 200, message: '角色创建成功', data: newChar }
}

async function mockDeleteCharacter(characterId: string): Promise<ApiResponse<null>> {
  await delay(800)

  const index = mockCharacters.findIndex(c => c.id === characterId)
  if (index === -1) {
    return { code: 404, message: '角色不存在', data: null }
  }

  const removed = mockCharacters.splice(index, 1)[0]
  mockNamesTaken.delete(removed.characterName)

  return { code: 200, message: '角色已删除', data: null }
}

/** 属性加点 */
export async function updateAttributesApi(params: UpdateAttributesParams): Promise<ApiResponse<CharacterInfo>> {
  if (isMockEnabled()) {
    return mockUpdateAttributes(params)
  }
  const res = await request.post<ApiResponse<CharacterInfo>>('/character/update-attributes', {
    characterId: params.characterId,
    str: params.str,
    int: params.int,
    agi: params.agi
  })
  return res.data
}

async function mockUpdateAttributes(params: UpdateAttributesParams): Promise<ApiResponse<CharacterInfo>> {
  await delay(600)
  const char = mockCharacters.find(c => c.id === params.characterId)
  if (!char) {
    return { code: 404, message: '角色不存在', data: null as unknown as CharacterInfo }
  }
  const total = params.str + params.int + params.agi
  if (total > char.availablePoints) {
    return { code: 400, message: '可用属性点不足', data: null as unknown as CharacterInfo }
  }
  char.strength += params.str
  char.intelligence += params.int
  char.agility += params.agi
  char.availablePoints -= total
  // 使用统一计算模块重新计算衍生属性
  const derived = calculateBaseStats(
    { strength: char.strength, intelligence: char.intelligence, agility: char.agility },
    char.profession
  )
  char.maxHp = derived.maxHp
  char.maxMp = derived.maxMp
  char.physicalAttack = derived.physicalAttack
  char.magicAttack = derived.magicAttack
  char.defense = derived.defense
  char.dodgeRate = derived.dodgeRate
  char.criticalRate = derived.criticalRate
  return { code: 200, message: '属性加点成功', data: { ...char } }
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
  if (isMockEnabled()) {
    return mockAddExperience(params)
  }
  const res = await request.post<ApiResponse<AddExperienceResult>>('/character/add-experience', params)
  return res.data
}

/**
 * Mock 实现：增加经验并处理升级
 */
async function mockAddExperience(params: AddExperienceParams): Promise<ApiResponse<AddExperienceResult>> {
  await delay(800)

  const char = mockCharacters.find(c => c.id === params.characterId)
  if (!char) {
    return { code: 404, message: '角色不存在', data: null as unknown as AddExperienceResult }
  }

  // 计算升级结果
  const levelUpResult = calculateLevelUp(char.level, char.experience, params.expToAdd)

  // 更新角色数据
  char.level = levelUpResult.newLevel
  char.experience = levelUpResult.overflowExp
  char.nextLevelExp = calculateNextLevelExp(char.level)
  char.availablePoints += levelUpResult.pointsGained

  // 如果升级，重新计算衍生属性（基础属性不变，需玩家手动加点）
  // 但 HP/MP 上限会随属性点分配后增长，这里暂不自动调整

  return {
    code: 200,
    message: levelUpResult.levelsGained > 0
      ? `恭喜升级！获得 ${levelUpResult.pointsGained} 点属性点`
      : `获得 ${params.expToAdd} 经验值`,
    data: {
      character: { ...char },
      levelUp: levelUpResult.levelsGained > 0 ? levelUpResult : null
    }
  }
}
