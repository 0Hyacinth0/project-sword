/**
 * 副本掉落解析工具
 * 根据副本掉落表生成楼层奖励，替代通用 calculateRewards
 */
import type { BattleRewardItem } from '../types/battle'
import type { DungeonDropEntry } from '../types/dungeon'
import { getDungeonDropTable } from '../config/dungeon_drop_config'

/**
 * 解析掉落条目，按概率掷骰生成物品
 * @param entries - 掉落条目列表
 * @param multiplier - 掉落率倍率
 * @param isElite - 是否为精英副本
 * @returns 掉落的物品列表
 */
function resolveDrops(entries: DungeonDropEntry[], multiplier: number, isElite: boolean): BattleRewardItem[] {
  const items: BattleRewardItem[] = []

  for (const entry of entries) {
    if (entry.eliteOnly && !isElite) continue  // 非精英副本跳过精英专属掉落
    const finalRate = Math.min(entry.dropRate * multiplier, 1.0)
    if (Math.random() < finalRate) {
      const quantity = entry.minQuantity + Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1))
      items.push({
        itemId: entry.itemId,
        name: entry.name,
        quantity,
        quality: entry.quality,
        itemType: entry.itemType
      })
    }
  }

  return items
}

/**
 * 根据副本掉落表计算楼层物品掉落
 * @param dungeonId - 副本 ID
 * @param isBossFloor - 是否为 Boss 层
 * @param isElite - 是否为精英副本，默认 false
 * @returns 掉落物品列表；未找到掉落表时返回空数组
 */
export function calculateDungeonDrops(dungeonId: string, isBossFloor: boolean, isElite: boolean = false): BattleRewardItem[] {
  const table = getDungeonDropTable(dungeonId)
  if (!table) return []

  const pool = isBossFloor ? table.bossDrops : table.floorDrops
  return resolveDrops(pool, table.dropRateMultiplier, isElite)
}
