/**
 * Boss 战配置
 * 定义各区域 Boss 的阶段、狂暴、复活、AOE 配置
 */
import type { BossBattleConfig } from '../types/boss'

/**
 * Boss 配置表
 * Key 为 Boss enemy 的 sourceId（如 'boss-shadow-dragon'）
 */
export const BOSS_CONFIGS: Record<string, BossBattleConfig> = {
  // ── 暗影森林 ──
  'boss-shadow-wolf': {
    bossId: 'boss-shadow-wolf',
    bossName: '暗影狼王',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9001, 9002] },
      { phase: 2, hpThreshold: 0.5, attackMultiplier: 1.3, skillIds: [9001, 9002, 9010] }
    ],
    enrage: { enrageRound: 15, attackMultiplier: 2.0, speedMultiplier: 1.5 },
    revive: { reviveHpPercent: 30, mpCost: 20, maxRevives: 2 },
    aoeSkillIds: [9010]
  },
  'boss-shadow-dragon': {
    bossId: 'boss-shadow-dragon',
    bossName: '暗影龙',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9001, 9003] },
      { phase: 2, hpThreshold: 0.7, attackMultiplier: 1.2, skillIds: [9001, 9003, 9011] },
      { phase: 3, hpThreshold: 0.3, attackMultiplier: 1.5, skillIds: [9011, 9012] }
    ],
    enrage: { enrageRound: 20, attackMultiplier: 2.5, speedMultiplier: 2.0 },
    revive: { reviveHpPercent: 30, mpCost: 25, maxRevives: 3 },
    aoeSkillIds: [9011]
  },

  // ── 火焰山脉 ──
  'boss-flame-lord': {
    bossId: 'boss-flame-lord',
    bossName: '炎魔领主',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9004, 9005] },
      { phase: 2, hpThreshold: 0.6, attackMultiplier: 1.4, skillIds: [9004, 9005, 9013] },
      { phase: 3, hpThreshold: 0.25, attackMultiplier: 1.8, skillIds: [9013, 9014] }
    ],
    enrage: { enrageRound: 18, attackMultiplier: 3.0, speedMultiplier: 1.8 },
    revive: { reviveHpPercent: 25, mpCost: 30, maxRevives: 2 },
    aoeSkillIds: [9013]
  },

  // ── 冰霜峡谷 ──
  'boss-ice-giant': {
    bossId: 'boss-ice-giant',
    bossName: '冰霜巨人',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9006, 9007] },
      { phase: 2, hpThreshold: 0.4, attackMultiplier: 1.6, skillIds: [9006, 9007, 9015] }
    ],
    enrage: { enrageRound: 12, attackMultiplier: 2.2, speedMultiplier: 1.3 },
    revive: { reviveHpPercent: 35, mpCost: 15, maxRevives: 4 },
    aoeSkillIds: [9015]
  },

  // ── 神秘遗迹 ──
  'boss-ancient-guardian': {
    bossId: 'boss-ancient-guardian',
    bossName: '远古守护者',
    phases: [
      { phase: 1, hpThreshold: 1.0, attackMultiplier: 1.0, skillIds: [9008, 9009] },
      { phase: 2, hpThreshold: 0.75, attackMultiplier: 1.15, skillIds: [9008, 9009, 9016] },
      { phase: 3, hpThreshold: 0.45, attackMultiplier: 1.35, skillIds: [9016, 9017] },
      { phase: 4, hpThreshold: 0.15, attackMultiplier: 2.0, skillIds: [9017, 9018] }
    ],
    enrage: { enrageRound: 25, attackMultiplier: 3.5, speedMultiplier: 2.5 },
    revive: { reviveHpPercent: 20, mpCost: 35, maxRevives: 3 },
    aoeSkillIds: [9016, 9018]
  }
}

/** Boss 专用技能池 */
export const BOSS_SKILLS = {
  // 通用 Boss 技能
  9001: { id: 9001, name: '撕裂', type: 'active_attack', power: 140, cooldown: 0, mpCost: 0, targetType: 'single_enemy', description: '撕裂目标' },
  9002: { id: 9002, name: '蓄力重击', type: 'active_attack', power: 200, cooldown: 3, mpCost: 15, targetType: 'single_enemy', description: '蓄力后重击' },
  9003: { id: 9003, name: '暗影吐息', type: 'active_attack', power: 180, cooldown: 2, mpCost: 20, targetType: 'all_enemies', description: '喷吐暗影能量' },
  9004: { id: 9004, name: '火焰斩', type: 'active_attack', power: 160, cooldown: 1, mpCost: 10, targetType: 'single_enemy', description: '燃烧斩击' },
  9005: { id: 9005, name: '熔岩护甲', type: 'active_buff', power: 0, cooldown: 4, mpCost: 15, targetType: 'self', description: '提升防御', attachedBuff: { name: '熔岩护甲', isDebuff: false, stat: 'defense', value: 20, duration: 3 } },
  9006: { id: 9006, name: '冰锥', type: 'active_attack', power: 150, cooldown: 0, mpCost: 5, targetType: 'single_enemy', description: '发射冰锥' },
  9007: { id: 9007, name: '寒冰屏障', type: 'active_buff', power: 0, cooldown: 3, mpCost: 10, targetType: 'self', description: '提升防御', attachedBuff: { name: '寒冰屏障', isDebuff: false, stat: 'defense', value: 25, duration: 2 } },
  9008: { id: 9008, name: '古老打击', type: 'active_attack', power: 170, cooldown: 0, mpCost: 8, targetType: 'single_enemy', description: '古老力量打击' },
  9009: { id: 9009, name: '能量吸收', type: 'active_buff', power: 0, cooldown: 5, mpCost: 20, targetType: 'self', description: '提升攻击', attachedBuff: { name: '能量吸收', isDebuff: false, stat: 'physicalAttack', value: 30, duration: 4 } },
  // AOE 技能
  9010: { id: 9010, name: '狼群召唤', type: 'active_attack', power: 100, cooldown: 4, mpCost: 25, targetType: 'all_enemies', description: '召唤狼群攻击全体' },
  9011: { id: 9011, name: '暗影风暴', type: 'active_attack', power: 150, cooldown: 5, mpCost: 40, targetType: 'all_enemies', description: '暗影风暴席卷全场' },
  9012: { id: 9012, name: '龙息', type: 'active_attack', power: 250, cooldown: 6, mpCost: 50, targetType: 'all_enemies', description: '龙之吐息' },
  9013: { id: 9013, name: '烈焰风暴', type: 'active_attack', power: 180, cooldown: 5, mpCost: 35, targetType: 'all_enemies', description: '烈焰席卷全场' },
  9014: { id: 9014, name: '末日审判', type: 'active_attack', power: 300, cooldown: 8, mpCost: 60, targetType: 'all_enemies', description: '终极火焰审判' },
  9015: { id: 9015, name: '冰封大地', type: 'active_attack', power: 160, cooldown: 4, mpCost: 30, targetType: 'all_enemies', description: '冰封全场' },
  9016: { id: 9016, name: '能量爆发', type: 'active_attack', power: 200, cooldown: 6, mpCost: 45, targetType: 'all_enemies', description: '能量波爆发' },
  9017: { id: 9017, name: '时光扭曲', type: 'active_buff', power: 0, cooldown: 7, mpCost: 50, targetType: 'self', description: '大幅提升速度', attachedBuff: { name: '时光扭曲', isDebuff: false, stat: 'speed', value: 50, duration: 3 } },
  9018: { id: 9018, name: '毁灭射线', type: 'active_attack', power: 350, cooldown: 10, mpCost: 80, targetType: 'all_enemies', description: '终极毁灭射线' }
}

/**
 * 获取 Boss 配置
 * @param bossId - Boss ID
 */
export function getBossConfig(bossId: string): BossBattleConfig | undefined {
  return BOSS_CONFIGS[bossId]
}

/**
 * 获取 Boss 技能
 * @param skillId - 技能 ID
 */
export function getBossSkill(skillId: number): typeof BOSS_SKILLS[keyof typeof BOSS_SKILLS] | undefined {
  return BOSS_SKILLS[skillId]
}