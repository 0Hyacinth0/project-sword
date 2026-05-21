/**
 * 战斗相关 API
 * 发起战斗、提交行动、结束战斗
 */
import request from './request'
import type { ApiResponse } from './request'
import type {
  Combatant,
  BattleSkill,
  StartBattleRequest,
  StartBattleResponse,
  PlayerActionRequest,
  PlayerActionResponse,
  BattleEndResponse
} from '../types/battle'
import type { CharacterInfo } from './character'
import type { InventoryItem } from '../types/item'
import type { RoomMember } from '../types/team'

// ──────────────────────────────────────────
// 奖励领取相关类型
// ──────────────────────────────────────────

/** 增加金币请求参数 */
export interface AddGoldParams {
  characterId: string
  gold: number
}

/** 增加金币响应 */
export interface AddGoldResult {
  character: CharacterInfo
}

/** 添加物品请求参数 */
export interface AddItemsParams {
  characterId: string
  items: { itemId: number; quantity: number }[]
}

/** 添加物品响应 */
export interface AddItemsResult {
  addedItems: InventoryItem[]
}

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 发起战斗
 * @param params - 发起战斗参数
 * @returns 战斗初始数据（敌人列表和战斗 ID）
 */
export async function startBattleApi(params: StartBattleRequest): Promise<ApiResponse<StartBattleResponse>> {
  const res = await request.post<ApiResponse<StartBattleResponse>>('/battle/start', params)
  return res.data
}

/**
 * 提交玩家行动
 * @param params - 行动参数
 * @returns 更新后的战斗状态
 */
export async function submitActionApi(params: PlayerActionRequest): Promise<ApiResponse<PlayerActionResponse>> {
  const res = await request.post<ApiResponse<PlayerActionResponse>>('/battle/action', params)
  return res.data
}

/**
 * 结束战斗（获取奖励）
 * @param battleId - 战斗 ID
 * @returns 战斗结果和奖励
 */
export async function endBattleApi(battleId: string): Promise<ApiResponse<BattleEndResponse>> {
  const res = await request.post<ApiResponse<BattleEndResponse>>(`/battle/end/${battleId}`)
  return res.data
}

/**
 * 增加角色金币
 * @param params - 包含角色ID和金币数量
 */
export async function addGoldApi(params: AddGoldParams): Promise<ApiResponse<AddGoldResult>> {
  const res = await request.post<ApiResponse<AddGoldResult>>('/character/add-gold', params)
  return res.data
}

/**
 * 添加物品到角色背包
 * @param params - 包含角色ID和物品列表
 */
export async function addItemsApi(params: AddItemsParams): Promise<ApiResponse<AddItemsResult>> {
  const res = await request.post<ApiResponse<AddItemsResult>>('/inventory/add', params)
  return res.data
}

// ──────────────────────────────────────────
// 辅助：构造玩家战斗单位（从角色数据转换）
// ──────────────────────────────────────────

/**
 * 将角色属性转换为战斗单位
 * @param characterId - 角色 ID
 * @param name - 角色名称
 * @param stats - 角色完整属性（来自 calculateFullStats 的 total）
 * @param skills - 角色技能列表
 * @returns 战斗单位
 */
export function createPlayerCombatant(
  characterId: string,
  name: string,
  stats: { maxHp: number; maxMp: number; physicalAttack: number; magicAttack: number; defense: number; dodgeRate: number; criticalRate: number },
  skills: BattleSkill[]
): Combatant {
  return {
    uid: 'ally-player',
    sourceId: characterId,
    name,
    side: 'ally',
    type: 'player',
    stats: {
      ...stats,
      hp: stats.maxHp,
      mp: stats.maxMp,
      speed: 10 // 基础速度，后续由敏捷计算
    },
    skills,
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}

/**
 * 将战宠数据转换为战斗单位
 * @param pet - 战宠信息
 * @param masterUid - 主人的战斗 uid（用于战宠死亡时关联主人）
 * @param petBonus - 战宠给予主人的属性加成值（用于战宠死亡时扣减）
 * @returns 战斗单位
 */
export function createPetCombatant(
  pet: {
    id: string
    nickname: string
    stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number }
    skills?: BattleSkill[]
  },
  masterUid: string = 'ally-player',
  petBonus?: { maxHp: number; physicalAttack: number; magicAttack: number; defense: number; dodgeRate: number; criticalRate: number }
): Combatant {
  return {
    uid: 'ally-pet',
    sourceId: pet.id,
    name: pet.nickname,
    side: 'ally',
    type: 'pet',
    stats: {
      maxHp: pet.stats.maxHp,
      hp: pet.stats.hp,
      maxMp: 40,
      mp: 40,
      physicalAttack: pet.stats.attack,
      magicAttack: Math.floor(pet.stats.attack * 0.5),
      defense: pet.stats.defense,
      speed: pet.stats.speed,
      dodgeRate: 0.05,
      criticalRate: 0.03
    },
    skills: pet.skills ?? [],
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0,
    masterUid,
    petBonusToMaster: petBonus
  }
}

/**
 * 创建房间成员 AI 控制的友方战斗单位
 * 根据职业和等级生成属性，由 AI 自动行动
 * @param member - 房间成员信息
 * @param skills - 成员使用的技能列表（由调用方根据职业和等级生成）
 * @returns AI 友方战斗单位
 */
export function createAllyCombatantFromRoomMember(member: RoomMember, skills: BattleSkill[] = []): Combatant {
  const lv = member.level
  const professionMultipliers: Record<string, { hp: number; pa: number; ma: number; def: number; spd: number }> = {
    Warrior: { hp: 1.2, pa: 1.1, ma: 0.6, def: 1.2, spd: 0.8 },
    Mage: { hp: 0.8, pa: 0.6, ma: 1.3, def: 0.7, spd: 1.0 },
    Hunter: { hp: 0.9, pa: 1.0, ma: 0.8, def: 0.9, spd: 1.3 }
  }
  const m = professionMultipliers[member.profession] ?? professionMultipliers.Warrior
  const maxHp = Math.floor((80 + lv * 12) * m.hp)
  const maxMp = Math.floor((30 + lv * 5) * m.ma)

  return {
    uid: `ally-member-${member.characterId}`,
    sourceId: member.characterId,
    name: member.characterName,
    side: 'ally',
    type: 'player',
    stats: {
      maxHp,
      hp: maxHp,
      maxMp,
      mp: maxMp,
      physicalAttack: Math.floor((5 + lv * 3) * m.pa),
      magicAttack: Math.floor((3 + lv * 2) * m.ma),
      defense: Math.floor((3 + lv * 2) * m.def),
      speed: Math.floor((5 + lv * 1.5) * m.spd),
      dodgeRate: Math.min(0.05 + lv * 0.005, 0.2),
      criticalRate: Math.min(0.03 + lv * 0.003, 0.15)
    },
    skills,
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}
