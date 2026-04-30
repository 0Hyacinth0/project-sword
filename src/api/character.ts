/**
 * 角色相关 API
 * 角色列表、创建、删除、名称检测
 */
import request from './request'
import type { ApiResponse } from './request'

/**
 * 角色信息（与后端 characters 表字段对应）
 * 后端字段为 snake_case，jeecg-boot 自动转 camelCase
 */
export interface CharacterInfo {
  id: string
  userId: string
  characterName: string
  profession: number           // 职业类型：1-战士, 2-法师, 3-猎人
  level: number
  experience: number
  strength: number             // 力量
  intelligence: number         // 智力
  agility: number              // 敏捷
  hp: number                   // 生命值
  mp: number                   // 魔法值
  physicalAttack: number       // 物理攻击力
  magicAttack: number          // 魔法攻击力
  defense: number              // 防御力
  dodgeRate: number            // 闪避率
  criticalRate: number         // 暴击率
  createTime: string
  updateTime: string
}

/** 创建角色参数 */
export interface CreateCharacterParams {
  characterName: string
  profession: number           // 1-战士, 2-法师, 3-猎人
}

/** 角色名检测结果 */
export interface CheckNameResult {
  available: boolean
}

// ──────────────────────────────────────────
// Mock 开关（按接口独立控制）
// ──────────────────────────────────────────

const MOCK = {
  list: false,          // 角色列表 —— 已联调
  create: false,        // 创建角色 —— 已联调
  delete: false,         // 删除角色 —— 已联调
  checkName: true       // 角色名检测 —— 待联调
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
    level: 15,
    experience: 2340,
    strength: 10,
    intelligence: 3,
    agility: 5,
    hp: 500,
    mp: 50,
    physicalAttack: 20,
    magicAttack: 6,
    defense: 15,
    dodgeRate: 5,
    criticalRate: 3,
    createTime: '2026-04-20T08:00:00Z',
    updateTime: '2026-04-28T10:00:00Z'
  },
  {
    id: 'mock-char-2',
    userId: 'mock-user',
    characterName: '冰霜女王',
    profession: 2,
    level: 8,
    experience: 860,
    strength: 2,
    intelligence: 12,
    agility: 4,
    hp: 200,
    mp: 300,
    physicalAttack: 4,
    magicAttack: 24,
    defense: 5,
    dodgeRate: 3,
    criticalRate: 5,
    createTime: '2026-04-25T12:30:00Z',
    updateTime: '2026-04-29T08:00:00Z'
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
  if (MOCK.list) {
    await delay(800)
    return { code: 200, message: '获取成功', data: [...mockCharacters] }
  }
  const res = await request.get<ApiResponse<CharacterInfo[]>>('/character/list')
  return res.data
}

/** 创建角色 */
export async function createCharacterApi(params: CreateCharacterParams): Promise<ApiResponse<CharacterInfo>> {
  if (MOCK.create) {
    return mockCreateCharacter(params)
  }
  const res = await request.post<ApiResponse<CharacterInfo>>('/character/create', params)
  return res.data
}

/** 检测角色名是否可用 */
export async function checkCharacterNameApi(name: string): Promise<ApiResponse<CheckNameResult>> {
  if (MOCK.checkName) {
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
  if (MOCK.delete) {
    return mockDeleteCharacter(characterId)
  }
  const res = await request.delete<ApiResponse<null>>(`/character/delete/${characterId}`)
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

  const baseStats: Record<number, { str: number; int: number; agi: number }> = {
    1: { str: 10, int: 3, agi: 5 },
    2: { str: 2, int: 12, agi: 4 },
    3: { str: 5, int: 4, agi: 11 }
  }

  const stats = baseStats[params.profession]
  const newChar: CharacterInfo = {
    id: crypto.randomUUID(),
    userId: 'mock-user',
    characterName: params.characterName,
    profession: params.profession,
    level: 1,
    experience: 0,
    strength: stats.str,
    intelligence: stats.int,
    agility: stats.agi,
    hp: stats.str * 5 + 100,
    mp: stats.int * 5 + 20,
    physicalAttack: stats.str * 2,
    magicAttack: stats.int * 2,
    defense: 5,
    dodgeRate: Math.floor(stats.agi * 0.5),
    criticalRate: Math.floor(stats.agi * 0.3),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
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
