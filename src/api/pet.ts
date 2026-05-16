/**
 * 战宠相关 API
 * 获取角色战宠列表、出战/收回战宠、喂食、进化、重命名
 */
import request from './request'
import { mockInventoryItems } from './inventory'
import type { ApiResponse } from './request'
import type { PetInfo, PetDetailInfo, PetListResult } from '../types/pet'
import { isMockEnabled } from '../utils/mockConfig'
import { EVOLVE_MATERIALS, PET_TYPE_CONFIGS, getLearnedSkills } from '../config/pet_config'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// Mock 战宠数据
// ──────────────────────────────────────────

const mockPets: Record<string, PetInfo[]> = {
  'mock-char-1': [
    {
      id: 'pet-001',
      petTypeId: 1001,
      nickname: '小火焰',
      level: 15,
      exp: 2000,
      maxExp: 12000,
      rarity: 3,
      isActive: true,
      stats: { hp: 230, maxHp: 230, attack: 35, defense: 18, speed: 22 },
      bonusToOwner: { hp: 23, attack: 4, defense: 2 },
      skills: PET_TYPE_CONFIGS[1001]?.skills.slice(0, 2) || [],
      learnedSkills: getLearnedSkills(1001, 15),
      equipment: {
        armor: { id: 'pet-eq-001', name: '火焰护甲', rarity: 'Rare', slotType: 'chest', stats: { hp: 30, defense: 8 }, enhanceLevel: 2 },
        accessory: null
      }
    },
    {
      id: 'pet-002',
      petTypeId: 1002,
      nickname: '疾风狼',
      level: 6,
      exp: 2300,
      maxExp: 5000,
      rarity: 2,
      isActive: false,
      stats: { hp: 90, maxHp: 90, attack: 18, defense: 6, speed: 24 },
      bonusToOwner: { attack: 2, dodgeRate: 0.01 },
      skills: PET_TYPE_CONFIGS[1002]?.skills.slice(0, 2) || [],
      learnedSkills: getLearnedSkills(1002, 6),
      equipment: {
        armor: null,
        accessory: { id: 'pet-eq-002', name: '疾风项链', rarity: 'Normal', slotType: 'accessory1', stats: { hp: 10, defense: 2 } }
      }
    }
  ],
  'mock-char-2': [
    {
      id: 'pet-003',
      petTypeId: 1003,
      nickname: '冰晶凤凰',
      level: 7,
      exp: 3100,
      maxExp: 6000,
      rarity: 4,
      isActive: true,
      stats: { hp: 250, maxHp: 250, attack: 40, defense: 15, speed: 22 },
      bonusToOwner: { hp: 25, attack: 5, defense: 2 },
      skills: PET_TYPE_CONFIGS[1003]?.skills || [],
      learnedSkills: getLearnedSkills(1003, 7),
      equipment: {
        armor: { id: 'pet-eq-003', name: '冰霜护甲', rarity: 'Epic', slotType: 'chest', stats: { hp: 50, defense: 15 }, extraStats: [{ key: 'defense', value: 5 }], enhanceLevel: 3 },
        accessory: { id: 'pet-eq-004', name: '冰晶戒指', rarity: 'Rare', slotType: 'accessory1', stats: { hp: 20, defense: 3 } }
      }
    }
  ]
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 获取角色战宠列表
 */
export async function getPetListApi(characterId: string): Promise<ApiResponse<PetListResult>> {
  if (isMockEnabled()) {
    return mockGetPetList(characterId)
  }
  const res = await request.get<ApiResponse<PetListResult>>(`/pet/list/${characterId}`)
  return res.data
}

/**
 * 获取战宠详情
 */
export async function getPetDetailApi(characterId: string, petId: string): Promise<ApiResponse<PetDetailInfo>> {
  if (isMockEnabled()) {
    return mockGetPetDetail(characterId, petId)
  }
  const res = await request.get<ApiResponse<PetDetailInfo>>(`/pet/detail/${petId}`)
  return res.data
}

/**
 * 设置出战战宠
 */
export async function setActivePetApi(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  if (isMockEnabled()) {
    return mockSetActivePet(characterId, petId)
  }
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
  if (isMockEnabled()) {
    return mockFeedPet(characterId, petId, inventoryId, quantity)
  }
  const res = await request.post<ApiResponse<PetListResult>>('/pet/feed', { characterId, petId, inventoryId, quantity })
  return res.data
}

/**
 * 进化战宠
 */
export async function evolvePetApi(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  if (isMockEnabled()) {
    return mockEvolvePet(characterId, petId)
  }
  const res = await request.post<ApiResponse<PetListResult>>('/pet/evolve', { characterId, petId })
  return res.data
}

/**
 * 重命名战宠
 */
export async function renamePetApi(characterId: string, petId: string, nickname: string): Promise<ApiResponse<PetListResult>> {
  if (isMockEnabled()) {
    return mockRenamePet(characterId, petId, nickname)
  }
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
  if (isMockEnabled()) {
    return mockEquipSkill(characterId, petId, skillId, slotIndex)
  }
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
  if (isMockEnabled()) {
    return mockUnequipSkill(characterId, petId, slotIndex)
  }
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
  if (isMockEnabled()) {
    return mockEquipPetItem(characterId, petId, inventoryId, slotType)
  }
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
  if (isMockEnabled()) {
    return mockUnequipPetItem(characterId, petId, slotType)
  }
  const res = await request.post<ApiResponse<PetListResult>>('/pet/unequip-item', { characterId, petId, slotType })
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

async function mockGetPetList(characterId: string): Promise<ApiResponse<PetListResult>> {
  await delay(500)
  const pets = mockPets[characterId] || []
  return { code: 200, message: '获取成功', data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockGetPetDetail(characterId: string, petId: string): Promise<ApiResponse<PetDetailInfo>> {
  await delay(400)
  const pets = mockPets[characterId]
  const pet = pets?.find(p => p.id === petId)
  if (!pet) {
    return { code: 404, message: '战宠不存在', data: null as unknown as PetDetailInfo }
  }
  const typeConfig = PET_TYPE_CONFIGS[pet.petTypeId]
  const detail: PetDetailInfo = {
    ...pet,
    element: typeConfig?.element || 1,
    evolveTo: typeConfig?.evolveTo,
    evolveLevel: typeConfig?.evolveLevel,
    description: `${pet.nickname}是一只忠诚的伙伴`
  }
  return { code: 200, message: '获取成功', data: detail }
}

async function mockSetActivePet(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  await delay(400)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const target = pets.find(p => p.id === petId)
  if (!target) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  for (const pet of pets) pet.isActive = pet.id === petId
  return { code: 200, message: `${target.nickname} 已设为出战`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockFeedPet(characterId: string, petId: string, inventoryId: string, quantity: number): Promise<ApiResponse<PetListResult>> {
  await delay(500)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  const invItem = mockInventoryItems.find(item => item.id === inventoryId && item.characterId === characterId)
  if (!invItem) return { code: 404, message: '经验道具不存在', data: null as unknown as PetListResult }
  const expEffect = invItem.item.effects?.find(effect => effect.type === 'add_exp')
  if (!expEffect) return { code: 400, message: '该物品不能用于战宠喂食', data: null as unknown as PetListResult }
  if (quantity <= 0 || quantity > invItem.quantity) {
    return { code: 400, message: '经验道具数量不足', data: null as unknown as PetListResult }
  }

  const expGain = quantity * expEffect.value
  invItem.quantity -= quantity
  if (invItem.quantity <= 0) {
    const index = mockInventoryItems.findIndex(item => item.id === inventoryId)
    if (index !== -1) mockInventoryItems.splice(index, 1)
  }

  pet.exp += expGain
  // 检查是否升级
  while (pet.exp >= pet.maxExp) {
    pet.exp -= pet.maxExp
    pet.level += 1
    pet.maxExp = Math.round(pet.maxExp * 1.2)
    // 属性提升
    pet.stats.hp = Math.round(pet.stats.hp * 1.08)
    pet.stats.maxHp = pet.stats.hp
    pet.stats.attack = Math.round(pet.stats.attack * 1.06)
    pet.stats.defense = Math.round(pet.stats.defense * 1.04)
    pet.stats.speed = Math.round(pet.stats.speed * 1.03)
    pet.learnedSkills = getLearnedSkills(pet.petTypeId, pet.level)
  }
  return { code: 200, message: `喂食成功，${pet.nickname} 获得 ${expGain} 经验`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockEvolvePet(characterId: string, petId: string): Promise<ApiResponse<PetListResult>> {
  await delay(800)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  const typeConfig = PET_TYPE_CONFIGS[pet.petTypeId]
  if (!typeConfig?.evolveTo) return { code: 400, message: '该战宠无法进化', data: null as unknown as PetListResult }
  if (pet.level < (typeConfig.evolveLevel || 999)) return { code: 400, message: `等级不足，需要 Lv.${typeConfig.evolveLevel}`, data: null as unknown as PetListResult }
  const materialCheck = consumeMockEvolutionMaterials(characterId, pet.petTypeId)
  if (!materialCheck.success) {
    return { code: 400, message: materialCheck.message, data: null as unknown as PetListResult }
  }
  // 进化：变更类型，属性大幅提升
  const evolveConfig = PET_TYPE_CONFIGS[typeConfig.evolveTo]
  pet.petTypeId = typeConfig.evolveTo
  pet.nickname = evolveConfig?.name || pet.nickname
  pet.rarity = (pet.rarity + 1) as 1 | 2 | 3 | 4
  pet.exp = Math.round(pet.exp * 0.8) // 保留80%经验
  pet.stats.hp = Math.round(pet.stats.hp * 1.5)
  pet.stats.maxHp = pet.stats.hp
  pet.stats.attack = Math.round(pet.stats.attack * 1.4)
  pet.stats.defense = Math.round(pet.stats.defense * 1.3)
  pet.stats.speed = Math.round(pet.stats.speed * 1.2)
  pet.skills = evolveConfig?.skills || pet.skills
  pet.learnedSkills = evolveConfig?.skills || pet.learnedSkills
  return { code: 200, message: `${pet.nickname} 进化成功！`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

/**
 * 校验并扣除 Mock 战宠进化材料。
 * @param characterId - 角色 ID
 * @param petTypeId - 战宠类型 ID
 * @returns 材料扣除结果
 */
function consumeMockEvolutionMaterials(characterId: string, petTypeId: number): { success: boolean; message: string } {
  const requirements = EVOLVE_MATERIALS[petTypeId] ?? []
  for (const requirement of requirements) {
    const total = mockInventoryItems
      .filter(item => item.characterId === characterId && item.itemId === requirement.itemId)
      .reduce((sum, item) => sum + item.quantity, 0)
    if (total < requirement.quantity) {
      return { success: false, message: `进化材料不足：${requirement.itemId} 需要 ${requirement.quantity}` }
    }
  }

  for (const requirement of requirements) {
    let remaining = requirement.quantity
    for (const item of mockInventoryItems.filter(entry => entry.characterId === characterId && entry.itemId === requirement.itemId)) {
      const consumeCount = Math.min(item.quantity, remaining)
      item.quantity -= consumeCount
      remaining -= consumeCount
      if (remaining <= 0) break
    }
    for (let index = mockInventoryItems.length - 1; index >= 0; index--) {
      if (mockInventoryItems[index].quantity <= 0) mockInventoryItems.splice(index, 1)
    }
  }

  return { success: true, message: '材料扣除成功' }
}

async function mockRenamePet(characterId: string, petId: string, nickname: string): Promise<ApiResponse<PetListResult>> {
  await delay(300)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  pet.nickname = nickname
  return { code: 200, message: '重命名成功', data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockEquipSkill(characterId: string, petId: string, skillId: number, slotIndex: number): Promise<ApiResponse<PetListResult>> {
  await delay(400)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  if (slotIndex < 0 || slotIndex > 2) return { code: 400, message: '无效槽位', data: null as unknown as PetListResult }
  // 从已学技能中查找
  const skill = pet.learnedSkills?.find(s => s.id === skillId)
  if (!skill) return { code: 400, message: '未学会该技能', data: null as unknown as PetListResult }
  // 装备到指定槽位
  const skills = pet.skills || []
  while (skills.length <= slotIndex) skills.push(null as unknown as typeof skill)
  skills[slotIndex] = skill
  pet.skills = skills.filter(Boolean)
  return { code: 200, message: `${skill.name} 已装备到槽位 ${slotIndex + 1}`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockUnequipSkill(characterId: string, petId: string, slotIndex: number): Promise<ApiResponse<PetListResult>> {
  await delay(400)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  if (slotIndex < 0 || slotIndex > 2) return { code: 400, message: '无效槽位', data: null as unknown as PetListResult }
  const skills = pet.skills || []
  if (slotIndex >= skills.length || !skills[slotIndex]) return { code: 400, message: '该槽位为空', data: null as unknown as PetListResult }
  const removed = skills[slotIndex]
  skills.splice(slotIndex, 1)
  pet.skills = skills
  return { code: 200, message: `${removed.name} 已卸下`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockEquipPetItem(characterId: string, petId: string, _inventoryId: string, slotType: 'armor' | 'accessory'): Promise<ApiResponse<PetListResult>> {
  await delay(500)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  // Mock：构造一个装备直接穿上
  const mockEq = {
    id: `pet-eq-new-${Date.now()}`,
    name: slotType === 'armor' ? '守护护甲' : '敏捷饰品',
    rarity: 'Rare' as const,
    slotType: slotType === 'armor' ? 'chest' as const : 'accessory1' as const,
    stats: slotType === 'armor' ? { hp: 25, defense: 6 } : { hp: 10, defense: 2 }
  }
  if (!pet.equipment) pet.equipment = { armor: null, accessory: null }
  pet.equipment[slotType] = mockEq
  return { code: 200, message: `${mockEq.name} 已装备`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}

async function mockUnequipPetItem(characterId: string, petId: string, slotType: 'armor' | 'accessory'): Promise<ApiResponse<PetListResult>> {
  await delay(400)
  const pets = mockPets[characterId]
  if (!pets) return { code: 404, message: '角色不存在', data: null as unknown as PetListResult }
  const pet = pets.find(p => p.id === petId)
  if (!pet) return { code: 404, message: '战宠不存在', data: null as unknown as PetListResult }
  if (!pet.equipment) return { code: 400, message: '无装备数据', data: null as unknown as PetListResult }
  const eq = pet.equipment[slotType]
  if (!eq) return { code: 400, message: '该槽位为空', data: null as unknown as PetListResult }
  pet.equipment[slotType] = null
  return { code: 200, message: `${eq.name} 已卸下`, data: { pets: [...pets], capacity: { max: 3, current: pets.length } } }
}
