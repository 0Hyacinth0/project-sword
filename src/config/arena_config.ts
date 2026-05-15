/**
 * 竞技场段位配置
 * 6级段位：青铜/白银/黄金/铂金/钻石/王者
 * 每级分 I/II/III 三个小级（王者除外）
 */
import type { ArenaTierConfig, ArenaTier, ArenaSubTier, TierInfo } from '../types/arena'

/** 段位配置列表（按积分升序） */
export const ARENA_TIER_CONFIGS: ArenaTierConfig[] = [
  { tier: 'bronze', name: '青铜', minScore: 0, maxScore: 599, color: '#8b8b8b', icon: '◆' },
  { tier: 'silver', name: '白银', minScore: 600, maxScore: 1199, color: '#c0c0c0', icon: '◆' },
  { tier: 'gold', name: '黄金', minScore: 1200, maxScore: 1799, color: '#ffd700', icon: '◆' },
  { tier: 'platinum', name: '铂金', minScore: 1800, maxScore: 2399, color: '#00b894', icon: '◆' },
  { tier: 'diamond', name: '钻石', minScore: 2400, maxScore: 2799, color: '#7c5cfc', icon: '◆' },
  { tier: 'king', name: '王者', minScore: 2800, maxScore: -1, color: '#ff6b6b', icon: '👑' }
]

/** 小级列表（从低到高：III → II → I） */
const SUB_TIERS: ArenaSubTier[] = ['III', 'II', 'I']

/**
 * 根据积分解析段位和小级
 * @param score - 竞技积分
 * @returns 段位信息
 */
export function resolveTier(score: number): TierInfo {
  let matchedConfig = ARENA_TIER_CONFIGS[0]

  for (const config of ARENA_TIER_CONFIGS) {
    if (config.maxScore === -1 || score <= config.maxScore) {
      matchedConfig = config
      break
    }
  }

  // 王者无小级
  if (matchedConfig.tier === 'king') {
    return {
      tier: 'king',
      subTier: 'I',
      tierName: `${matchedConfig.icon} ${matchedConfig.name}`,
      progress: 1,
      remainingScore: 0
    }
  }

  // 计算小级
  const range = matchedConfig.maxScore - matchedConfig.minScore + 1
  const subRange = Math.floor(range / 3)
  const offset = score - matchedConfig.minScore
  const subIndex = Math.min(2, Math.floor(offset / subRange))
  const subTier = SUB_TIERS[subIndex]

  // 计算当前小级进度
  const subFloor = matchedConfig.minScore + subIndex * subRange
  const subCeil = subIndex === 2 ? matchedConfig.maxScore + 1 : subFloor + subRange
  const progress = (score - subFloor) / (subCeil - subFloor)

  // 距下一个小级所需积分
  const remainingScore = subCeil - score

  return {
    tier: matchedConfig.tier,
    subTier,
    tierName: `${matchedConfig.icon} ${matchedConfig.name} ${subTier}`,
    progress,
    remainingScore
  }
}

/**
 * 获取段位配置
 * @param tier - 段位标识
 */
export function getTierConfig(tier: ArenaTier): ArenaTierConfig {
  return ARENA_TIER_CONFIGS.find(c => c.tier === tier) ?? ARENA_TIER_CONFIGS[0]
}