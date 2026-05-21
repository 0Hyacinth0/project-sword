/**
 * PVP 匹配配置
 * 简化 Elo 积分计算、Mock 对手池
 */
import type { PvpOpponent, EstimatedScore } from '../types/pvp'
import type { Combatant } from '../types/battle'

/**
 * 计算简化 Elo 积分变化
 * 基础 ±25 分，根据积分差距调整 ±10，范围 ±15 ~ ±35
 * @param myScore - 我的积分
 * @param opponentScore - 对手积分
 * @returns 预计积分变化（胜/败）
 */
export function calculateEloScore(myScore: number, opponentScore: number): EstimatedScore {
  const base = 25
  const diff = Math.round((opponentScore - myScore) / 100)
  const win = Math.max(15, Math.min(35, base + diff))
  const lose = Math.max(15, Math.min(35, base - diff))
  return { win, lose }
}

/** Mock 对手池 */
export const MOCK_PVP_OPPONENTS: PvpOpponent[] = [
  { characterId: 'pvp-opp-001', characterName: '赤焰术士', profession: 'Mage', level: 33, tier: 'diamond', subTier: 'III', score: 2450 },
  { characterId: 'pvp-opp-002', characterName: '暗夜刺客', profession: 'Hunter', level: 28, tier: 'platinum', subTier: 'I', score: 2300 },
  { characterId: 'pvp-opp-003', characterName: '圣光剑客', profession: 'Warrior', level: 25, tier: 'platinum', subTier: 'III', score: 1900 },
  { characterId: 'pvp-opp-004', characterName: '寒冰妖姬', profession: 'Mage', level: 22, tier: 'gold', subTier: 'I', score: 1700 },
  { characterId: 'pvp-opp-005', characterName: '狂刀侠客', profession: 'Warrior', level: 20, tier: 'silver', subTier: 'II', score: 900 },
  { characterId: 'pvp-opp-006', characterName: '影舞刺客', profession: 'Hunter', level: 15, tier: 'bronze', subTier: 'I', score: 200 }
]

/**
 * 从 Mock 对手池中选取匹配对手
 * 优先选择积分接近的对手，有一定随机性
 * @param myScore - 我的积分
 * @returns 匹配到的对手
 */
export function selectMockOpponent(myScore: number): PvpOpponent {
  const sorted = [...MOCK_PVP_OPPONENTS]
    .map(opp => ({ opp, diff: Math.abs(opp.score - myScore) }))
    .sort((a, b) => a.diff - b.diff)

  const topN = sorted.slice(0, Math.min(3, sorted.length))
  const pick = topN[Math.floor(Math.random() * topN.length)]
  return pick.opp
}

/**
 * 根据职业和等级生成对手战斗属性
 * @param opponent - 对手信息
 * @returns 战斗属性
 */
export function generateOpponentStats(opponent: PvpOpponent): {
  maxHp: number; maxMp: number; physicalAttack: number; magicAttack: number
  defense: number; speed: number; dodgeRate: number; criticalRate: number
} {
  const base = opponent.level * 8
  const isMage = opponent.profession === 'Mage'
  const isHunter = opponent.profession === 'Hunter'

  return {
    maxHp: base * 4 + 100,
    maxMp: base * 2,
    physicalAttack: isMage ? base * 0.6 : base,
    magicAttack: isMage ? base * 1.4 : isHunter ? base * 0.8 : base * 0.5,
    defense: base * 0.8,
    speed: isHunter ? 18 : 10,
    dodgeRate: isHunter ? 0.15 : 0.05,
    criticalRate: isHunter ? 0.12 : 0.08
  }
}

/**
 * 获取职业对应的基础战斗技能
 * @param profession - 职业
 * @returns 技能列表
 */
export function getOpponentSkills(profession: string): Array<{
  id: number; name: string; mpCost: number; power: number;
  targetType: 'single_enemy' | 'all_enemies'; cooldown: number; element: string
}> {
  const skillSets: Record<string, Array<{
    id: number; name: string; mpCost: number; power: number;
    targetType: 'single_enemy' | 'all_enemies'; cooldown: number; element: string
  }>> = {
    Warrior: [
      { id: 8001, name: '猛击', mpCost: 8, power: 1.3, targetType: 'single_enemy', cooldown: 0, element: 'none' },
      { id: 8002, name: '旋风斩', mpCost: 15, power: 1.0, targetType: 'all_enemies', cooldown: 3, element: 'none' },
      { id: 8003, name: '战吼', mpCost: 12, power: 1.5, targetType: 'single_enemy', cooldown: 4, element: 'none' }
    ],
    Mage: [
      { id: 8101, name: '火球术', mpCost: 10, power: 1.4, targetType: 'single_enemy', cooldown: 0, element: 'fire' },
      { id: 8102, name: '暴风雪', mpCost: 18, power: 1.1, targetType: 'all_enemies', cooldown: 3, element: 'water' },
      { id: 8103, name: '雷电术', mpCost: 14, power: 1.6, targetType: 'single_enemy', cooldown: 4, element: 'wind' }
    ],
    Hunter: [
      { id: 8201, name: '连射', mpCost: 8, power: 1.2, targetType: 'single_enemy', cooldown: 0, element: 'none' },
      { id: 8202, name: '箭雨', mpCost: 16, power: 0.9, targetType: 'all_enemies', cooldown: 3, element: 'none' },
      { id: 8203, name: '毒箭', mpCost: 12, power: 1.4, targetType: 'single_enemy', cooldown: 4, element: 'wind' }
    ]
  }
  return skillSets[profession] ?? skillSets.Warrior
}

/**
 * 根据好友信息生成镜像 Combatant（用于异步 PVP 挑战）
 * 复用 generateOpponentStats 和 getOpponentSkills 逻辑
 * @param friend - 好友信息（FriendInfo 类型，含 profession/level/characterName/characterId）
 * @returns 敌方 Combatant 对象
 */
export function generateFriendMirrorCombatant(friend: {
  characterId: string
  characterName: string
  profession: string
  level: number
}): Combatant {
  const mirrorOpponent: PvpOpponent = {
    characterId: friend.characterId,
    characterName: friend.characterName,
    profession: friend.profession,
    level: friend.level,
    tier: 'bronze',
    subTier: 'I',
    score: 0
  }

  const stats = generateOpponentStats(mirrorOpponent)
  const skills = getOpponentSkills(friend.profession)

  const ELEMENT_MAP: Record<string, number> = {
    none: 0, fire: 1, water: 2, wind: 3, earth: 4, light: 5, dark: 6
  }

  return {
    uid: `enemy-friend-${friend.characterId}`,
    sourceId: friend.characterId,
    name: friend.characterName,
    side: 'enemy',
    type: 'enemy',
    stats: {
      maxHp: stats.maxHp,
      hp: stats.maxHp,
      maxMp: stats.maxMp,
      mp: stats.maxMp,
      physicalAttack: stats.physicalAttack,
      magicAttack: stats.magicAttack,
      defense: stats.defense,
      speed: stats.speed,
      dodgeRate: stats.dodgeRate,
      criticalRate: stats.criticalRate
    },
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      type: 'active_attack' as const,
      mpCost: skill.mpCost,
      power: skill.power,
      targetType: skill.targetType,
      cooldown: skill.cooldown,
      element: ELEMENT_MAP[skill.element] ?? 0,
      description: ''
    })),
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}