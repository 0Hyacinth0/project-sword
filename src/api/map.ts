/**
 * 地图相关 API
 * 进入区域探索、获取区域详情、野外怪物遭遇
 */
import request from './request'
import type { ApiResponse } from './request'
import type { MapArea, AreaMonster } from '../types/map'
import type { Combatant, BattleSkill } from '../types/battle'

/** 区域详情响应 */
export interface AreaDetailResponse {
  area: MapArea
  /** 当前探索次数（每日限制等，后续扩展） */
  exploreCount: number
}

/** 进入区域请求 */
export interface EnterAreaRequest {
  characterId: string
  areaId: string
}

/** 进入区域响应 */
export interface EnterAreaResponse {
  areaId: string
  message: string
}

/**
 * 获取区域详情
 * @param areaId - 区域 ID
 * @returns 区域详情
 */
export async function getAreaDetailApi(areaId: string): Promise<ApiResponse<AreaDetailResponse>> {
  const res = await request.get<ApiResponse<AreaDetailResponse>>(`/map/area/${areaId}`)
  // 后端可能直接返回区域数据，而非嵌套在 area 字段下
  const raw = res.data.data as unknown as Record<string, unknown>
  if (raw && !raw.area) {
    res.data.data = { area: raw as unknown as MapArea, exploreCount: 0 }
  }
  return res.data
}

/**
 * 进入区域探索（触发野外战斗）
 * @param data - 进入区域请求参数
 * @returns 进入结果
 */
export async function enterAreaApi(data: EnterAreaRequest): Promise<ApiResponse<EnterAreaResponse>> {
  const res = await request.post<ApiResponse<EnterAreaResponse>>('/map/enter', data)
  // 后端可能返回不同字段名，标准化为 EnterAreaResponse
  const raw = res.data.data as unknown as Record<string, unknown>
  if (raw && raw.areaId === undefined) {
    // 尝试从其他字段映射
    res.data.data = {
      areaId: (raw.areaId ?? raw.id ?? raw.currentAreaId ?? data.areaId) as string,
      message: (raw.message ?? raw.msg ?? '已进入区域') as string,
    }
  }
  return res.data
}

/**
 * 获取全部区域列表
 * @returns 区域数组
 */
export async function getAreaListApi(): Promise<ApiResponse<MapArea[]>> {
  const res = await request.get<ApiResponse<MapArea[]>>('/map/areas')
  return res.data
}

// ──────────────────────────────────────────
// 野外怪物遭遇
// ──────────────────────────────────────────

/** 野外怪物通用技能模板 */
const WILD_MONSTER_SKILLS: BattleSkill[] = [
  { id: 9001, name: '撕咬', type: 'active_attack', power: 120, cooldown: 0, mpCost: 0, targetType: 'single_enemy', description: '用利齿撕咬目标' },
  { id: 9002, name: '猛击', type: 'active_attack', power: 160, cooldown: 2, mpCost: 8, targetType: 'single_enemy', description: '全力猛击目标' }
]

/** 精英怪物专属技能模板 */
export const ELITE_MONSTER_SKILLS: BattleSkill[] = [
  {
    id: 9010, name: '横扫', type: 'active_attack', power: 130, cooldown: 3, mpCost: 0,
    targetType: 'single_enemy', description: '对目标造成强力横扫攻击'
  },
  {
    id: 9011, name: '战意高昂', type: 'active_buff', power: 0, cooldown: 4, mpCost: 0,
    targetType: 'self', description: '提升自身攻击力',
    attachedBuff: { name: '战意高昂', isDebuff: false, stat: 'physicalAttack', value: 15, duration: 3 }
  },
  {
    id: 9012, name: '毒雾', type: 'active_attack', power: 80, cooldown: 3, mpCost: 0,
    targetType: 'single_enemy', description: '释放毒雾造成伤害并削弱防御',
    attachedBuff: { name: '中毒', isDebuff: true, stat: 'defense', value: -8, duration: 3 }
  }
]

/**
 * 根据区域怪物数据生成战斗单位
 * 属性根据怪物等级和类型（普通/精英/Boss）缩放
 * @param monster - 区域怪物数据
 * @returns Combatant 战斗单位
 */
export function createWildMonsterCombatant(monster: AreaMonster): Combatant {
  /** 类型倍率：普通1.0 / 精英1.5 / Boss2.5 */
  const typeMultiplier = monster.type === 'boss' ? 2.5 : monster.type === 'elite' ? 1.5 : 1.0
  const lv = monster.level

  const maxHp = Math.floor((50 + lv * 15) * typeMultiplier)
  const maxMp = Math.floor((20 + lv * 5) * typeMultiplier)

  return {
    uid: `enemy-${monster.id}-${Date.now()}`,
    sourceId: monster.id,
    name: monster.name,
    side: 'enemy',
    type: 'enemy',
    stats: {
      maxHp,
      hp: maxHp,
      maxMp,
      mp: maxMp,
      physicalAttack: Math.floor((5 + lv * 3) * typeMultiplier),
      magicAttack: Math.floor((3 + lv * 2) * typeMultiplier),
      defense: Math.floor((3 + lv * 2) * typeMultiplier),
      speed: Math.floor(5 + lv * 1.5 * typeMultiplier),
      dodgeRate: Math.min(0.05 + lv * 0.005, 0.25),
      criticalRate: Math.min(0.03 + lv * 0.003, 0.2)
    },
    skills: [...WILD_MONSTER_SKILLS],
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}

/**
 * 应用多人副本怪物属性缩放
 * 根据队伍人数提升怪物 HP/ATK/DEF
 * @param enemies - 敌人列表
 * @param memberCount - 队伍人数
 */
export function applyMultiPlayerScaling(enemies: Combatant[], memberCount: number): void {
  if (memberCount <= 1) return
  const hpScale = 1 + 0.5 * (memberCount - 1)
  const atkScale = 1 + 0.3 * (memberCount - 1)
  const defScale = 1 + 0.2 * (memberCount - 1)
  enemies.forEach(enemy => {
    enemy.stats.maxHp = Math.floor(enemy.stats.maxHp * hpScale)
    enemy.stats.hp = enemy.stats.maxHp
    enemy.stats.physicalAttack = Math.floor(enemy.stats.physicalAttack * atkScale)
    enemy.stats.magicAttack = Math.floor(enemy.stats.magicAttack * atkScale)
    enemy.stats.defense = Math.floor(enemy.stats.defense * defScale)
  })
}
