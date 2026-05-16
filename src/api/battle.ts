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
import type { RoomMember } from '../types/team'
import { isMockEnabled } from '../utils/mockConfig'
import {
  createBattleState,
  submitPlayerAction as engineSubmitAction,
  calculateRewards
} from '../utils/battleEngine'

/** Mock 延迟 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────
// Mock 敌人数据
// ──────────────────────────────────────────

/** Mock 怪物技能 */
const MOCK_ENEMY_SKILLS: BattleSkill[] = [
  { id: 9001, name: '撕咬', type: 'active_attack', power: 120, cooldown: 0, mpCost: 0, targetType: 'single_enemy', description: '用利齿撕咬目标' },
  { id: 9002, name: '毒雾', type: 'active_attack', power: 80, cooldown: 3, mpCost: 10, targetType: 'single_enemy', description: '喷出毒雾攻击', attachedBuff: { name: '中毒', isDebuff: true, stat: 'maxHp', value: -10, duration: 3 } },
  { id: 9003, name: '嚎叫', type: 'active_buff', power: 0, cooldown: 4, mpCost: 5, targetType: 'self', description: '提升自身攻击力', attachedBuff: { name: '狂暴', isDebuff: false, stat: 'physicalAttack', value: 10, duration: 3 } }
]

/** Mock 敌人列表 */
function getMockEnemies(): Combatant[] {
  return [
    {
      uid: 'enemy-001',
      sourceId: 'monster-wolf',
      name: '暗影狼',
      side: 'enemy',
      type: 'enemy',
      stats: {
        maxHp: 120, hp: 120,
        maxMp: 30, mp: 30,
        physicalAttack: 18, magicAttack: 5,
        defense: 8, speed: 15,
        dodgeRate: 0.08, criticalRate: 0.05
      },
      skills: MOCK_ENEMY_SKILLS.slice(0, 2),
      buffs: [],
      cooldowns: {},
      isAlive: true,
      actionValue: 0
    },
    {
      uid: 'enemy-002',
      sourceId: 'monster-goblin',
      name: '哥布林盗贼',
      side: 'enemy',
      type: 'enemy',
      stats: {
        maxHp: 80, hp: 80,
        maxMp: 20, mp: 20,
        physicalAttack: 14, magicAttack: 3,
        defense: 5, speed: 20,
        dodgeRate: 0.15, criticalRate: 0.1
      },
      skills: [MOCK_ENEMY_SKILLS[0]],
      buffs: [],
      cooldowns: {},
      isAlive: true,
      actionValue: 0
    }
  ]
}

/** Mock 玩家技能 */
const MOCK_PLAYER_SKILLS: BattleSkill[] = [
  { id: 5001, name: '重击', type: 'active_attack', power: 150, cooldown: 2, mpCost: 8, targetType: 'single_enemy', description: '集中力量进行重击' },
  { id: 5002, name: '火球术', type: 'active_attack', power: 180, cooldown: 3, mpCost: 15, targetType: 'single_enemy', description: '投掷火球攻击敌人' },
  { id: 5003, name: '治疗术', type: 'active_heal', power: 120, cooldown: 2, mpCost: 10, targetType: 'self', description: '恢复自身生命值' },
  { id: 5004, name: '战吼', type: 'active_buff', cooldown: 4, mpCost: 5, targetType: 'self', description: '提升自身攻击力', attachedBuff: { name: '战意高昂', isDebuff: false, stat: 'physicalAttack', value: 15, duration: 3 } }
]

/** Mock 战宠技能 */
const MOCK_PET_SKILLS: BattleSkill[] = [
  { id: 6001, name: '火焰喷射', type: 'active_attack', power: 120, cooldown: 1, mpCost: 5, targetType: 'single_enemy', description: '喷射火焰攻击' },
  { id: 6002, name: '烈焰冲击', type: 'active_attack', power: 160, cooldown: 3, mpCost: 12, targetType: 'single_enemy', description: '蓄力后释放猛烈火焰' },
  { id: 6003, name: '守护之焰', type: 'active_buff', cooldown: 4, mpCost: 8, targetType: 'self', description: '提升自身防御力', attachedBuff: { name: '火焰护盾', isDebuff: false, stat: 'defense', value: 8, duration: 2 } }
]

// ──────────────────────────────────────────
// 内存中的战斗状态（Mock 模式）
// ──────────────────────────────────────────

let mockBattleId: string | null = null
let mockAllies: Combatant[] = []
let mockEnemies: Combatant[] = []

// ──────────────────────────────────────────
// API 函数
// ──────────────────────────────────────────

/**
 * 发起战斗
 * @param params - 发起战斗参数
 * @returns 战斗初始数据（敌人列表和战斗 ID）
 */
export async function startBattleApi(params: StartBattleRequest): Promise<ApiResponse<StartBattleResponse>> {
  if (isMockEnabled()) {
    return mockStartBattle(params)
  }
  const res = await request.post<ApiResponse<StartBattleResponse>>('/battle/start', params)
  return res.data
}

/**
 * 提交玩家行动
 * @param params - 行动参数
 * @returns 更新后的战斗状态
 */
export async function submitActionApi(params: PlayerActionRequest): Promise<ApiResponse<PlayerActionResponse>> {
  if (isMockEnabled()) {
    return mockSubmitAction(params)
  }
  const res = await request.post<ApiResponse<PlayerActionResponse>>('/battle/action', params)
  return res.data
}

/**
 * 结束战斗（获取奖励）
 * @param battleId - 战斗 ID
 * @returns 战斗结果和奖励
 */
export async function endBattleApi(battleId: string): Promise<ApiResponse<BattleEndResponse>> {
  if (isMockEnabled()) {
    return mockEndBattle(battleId)
  }
  const res = await request.post<ApiResponse<BattleEndResponse>>(`/battle/end/${battleId}`)
  return res.data
}

// ──────────────────────────────────────────
// Mock 实现
// ──────────────────────────────────────────

/** Mock：发起战斗 */
async function mockStartBattle(params: StartBattleRequest): Promise<ApiResponse<StartBattleResponse>> {
  await delay(300)

  mockBattleId = `battle-${Date.now()}`
  mockEnemies = getMockEnemies()

  // 构造玩家单位
  const player: Combatant = {
    uid: 'ally-player',
    sourceId: params.characterId,
    name: '勇者',
    side: 'ally',
    type: 'player',
    stats: {
      maxHp: 200, hp: 200,
      maxMp: 80, mp: 80,
      physicalAttack: 25, magicAttack: 15,
      defense: 12, speed: 14,
      dodgeRate: 0.05, criticalRate: 0.1
    },
    skills: MOCK_PLAYER_SKILLS,
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }

  // 构造战宠单位（链接主人 uid，携带加成数据）
  const petBonus = { maxHp: 12, physicalAttack: 2, magicAttack: 1, defense: 1, dodgeRate: 0.005, criticalRate: 0.003 }
  const pet: Combatant = {
    uid: 'ally-pet',
    sourceId: 'pet-001',
    name: '小火焰',
    side: 'ally',
    type: 'pet',
    stats: {
      maxHp: 120, hp: 120,
      maxMp: 40, mp: 40,
      physicalAttack: 18, magicAttack: 10,
      defense: 6, speed: 16,
      dodgeRate: 0.06, criticalRate: 0.04
    },
    skills: MOCK_PET_SKILLS,
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0,
    masterUid: 'ally-player',
    petBonusToMaster: petBonus
  }

  mockAllies = [player, pet]

  return {
    code: 200,
    message: '战斗开始',
    data: {
      battleId: mockBattleId,
      enemies: mockEnemies
    }
  }
}

/** Mock：提交行动 */
async function mockSubmitAction(params: PlayerActionRequest): Promise<ApiResponse<PlayerActionResponse>> {
  await delay(200)

  // 获取当前战斗状态（从内存恢复）
  let battleState = createBattleState(mockAllies, mockEnemies)

  // 如果不是第一回合，说明需要从 store 层传递完整状态
  // 这里简化处理：直接返回行动后的状态
  const result = engineSubmitAction(battleState, params.action)

  // 同步回内存
  mockAllies = result.combatants.filter(c => c.side === 'ally')
  mockEnemies = result.combatants.filter(c => c.side === 'enemy')

  return {
    code: 200,
    message: '行动执行成功',
    data: { battleState: result }
  }
}

/** Mock：结束战斗 */
async function mockEndBattle(_battleId: string): Promise<ApiResponse<BattleEndResponse>> {
  await delay(300)

  const outcome = mockAllies.some(c => c.isAlive) ? 'victory' as const : 'defeat' as const
  const rewards = outcome === 'victory' ? calculateRewards(mockEnemies) : { exp: 0, gold: 0, items: [] }

  // 清理
  mockBattleId = null
  mockAllies = []
  mockEnemies = []

  return {
    code: 200,
    message: outcome === 'victory' ? '战斗胜利！' : '战斗失败',
    data: {
      outcome,
      rewards
    }
  }
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
 * @returns AI 友方战斗单位
 */
export function createAllyCombatantFromRoomMember(member: RoomMember): Combatant {
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
    skills: [MOCK_PLAYER_SKILLS[0], MOCK_PLAYER_SKILLS[1]],
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}
