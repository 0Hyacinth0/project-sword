/**
 * 套装效果配置
 * 定义各套装的件数要求和属性加成
 */
import type { EquipmentStats, SetBonus } from '../types/equipment'

/** 套装效果等级 */
export interface SetBonusLevel {
  /** 需要装备件数 */
  requiredCount: number
  /** 效果描述 */
  description: string
  /** 属性加成 */
  stats: EquipmentStats
}

/** 套装配置 */
export interface SetConfig {
  /** 套装 ID */
  setId: string
  /** 套装名称 */
  setName: string
  /** 套装总件数 */
  totalCount: number
  /** 各等级效果 */
  bonuses: SetBonusLevel[]
}

/** 套装配置表 */
export const SET_CONFIGS: Record<string, SetConfig> = {
  'set-001': {
    setId: 'set-001',
    setName: '勇者之证',
    totalCount: 2,
    bonuses: [
      {
        requiredCount: 2,
        description: '2件：物理攻击 +10，生命 +50',
        stats: { physicalAttack: 10, hp: 50 }
      }
    ]
  },
  'set-002': {
    setId: 'set-002',
    setName: '冰霜之心',
    totalCount: 3,
    bonuses: [
      {
        requiredCount: 2,
        description: '2件：魔法攻击 +8，魔力 +40',
        stats: { magicAttack: 8, mp: 40 }
      },
      {
        requiredCount: 3,
        description: '3件：智力 +5，暴击率 +3%',
        stats: { intelligence: 5, criticalRate: 0.03 }
      }
    ]
  }
}

/**
 * 根据套装 ID 获取套装配置
 */
export function getSetConfig(setId: string): SetConfig | undefined {
  return SET_CONFIGS[setId]
}

/**
 * 计算当前装备的套装效果
 * @param equipment - 六槽位装备数据
 * @returns 激活的套装效果列表
 */
export function calculateSetBonuses(equipment: Record<string, { setId?: string; setName?: string } | null>): SetBonus[] {
  // 统计各套装的已装备数量
  const setCounts: Record<string, { count: number; setName: string }> = {}

  for (const slot of Object.values(equipment)) {
    if (slot?.setId) {
      if (!setCounts[slot.setId]) {
        setCounts[slot.setId] = { count: 0, setName: slot.setName || slot.setId }
      }
      setCounts[slot.setId].count++
    }
  }

  // 生成套装效果
  const bonuses: SetBonus[] = []

  for (const [setId, info] of Object.entries(setCounts)) {
    const config = SET_CONFIGS[setId]
    if (!config) continue

    bonuses.push({
      setId,
      setName: config.setName,
      equippedCount: info.count,
      totalCount: config.totalCount,
      bonuses: config.bonuses
    })
  }

  return bonuses
}
