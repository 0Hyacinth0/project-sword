/**
 * Boss 战机制引擎
 * 处理狂暴检测、阶段切换、复活逻辑
 */
import type { BattleState, Combatant } from '../types/battle'
import { getBossConfig } from '../config/boss_config'
import type { BossBattleState } from '../types/boss'

/**
 * 将 Boss 技能配置转换为技能对象
 * @param skillId - 技能 ID
 * @returns 技能对象
 */
function convertBossSkill(skillId: number) {
  return {
    id: skillId,
    name: `技能${skillId}`,
    type: 'active_attack' as const,
    power: 100,
    cooldown: 0,
    mpCost: 0,
    targetType: 'single_enemy' as const,
    description: ''
  }
}

/**
 * 初始化 Boss 战状态
 * 查找 Boss 配置，替换 Boss 技能为第一阶段技能
 * @param bossCombatant - Boss 战斗单位
 * @returns BossBattleState 初始状态，非 Boss 战斗返回 null
 */
export function initBossBattleState(bossCombatant: Combatant): BossBattleState | null {
  const bossId = bossCombatant.sourceId
  const config = getBossConfig(bossId)
  if (!config) return null

  // 替换 Boss 技能为第一阶段技能
  // 替换 Boss 技能为第一阶段技能
  bossCombatant.skills = config.phases[0].skillIds.map(convertBossSkill)

  return {
    currentPhase: 1,
    isEnraged: false,
    currentRound: 0,
    reviveCount: 0,
    phaseChanged: false
  }
}

/**
 * 检查并处理阶段切换
 * 根据 Boss 当前 HP 百分比判断是否进入新阶段
 * @param state - 战斗状态
 * @param bossState - Boss 战运行状态
 * @param bossCombatant - Boss 战斗单位
 * @returns 是否发生了阶段切换
 */
export function checkPhaseTransition(
  state: BattleState,
  bossState: BossBattleState,
  bossCombatant: Combatant
): boolean {
  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return false

  const hpPercent = bossCombatant.stats.hp / bossCombatant.stats.maxHp

  // 从高阈值往低阈值检查（配置已按 hpThreshold 降序）
  for (const phase of config.phases) {
    if (hpPercent <= phase.hpThreshold && bossState.currentPhase < phase.phase) {
      // 进入新阶段
      bossState.currentPhase = phase.phase
      bossState.phaseChanged = true

      // 替换技能列表
      bossCombatant.skills = phase.skillIds.map(convertBossSkill)

      // 应用攻击力倍率
      const baseAtk = bossCombatant.stats.physicalAttack / (config.phases[0].attackMultiplier || 1)
      bossCombatant.stats.physicalAttack = Math.floor(baseAtk * phase.attackMultiplier)
      bossCombatant.stats.magicAttack = Math.floor(bossCombatant.stats.magicAttack * phase.attackMultiplier)

      // 记录日志
      state.log.push({
        round: state.round,
        type: 'system',
        message: `${bossCombatant.name} 进入阶段 ${phase.phase}！攻击力大幅提升！`,
        actorUid: bossCombatant.uid,
        timestamp: Date.now()
      })

      return true
    }
  }
  return false
}

/**
 * 检查并处理狂暴
 * 当回合数达到配置的狂暴触发回合时，大幅提升 Boss 属性
 * @param state - 战斗状态
 * @param bossState - Boss 战运行状态
 * @param bossCombatant - Boss 战斗单位
 * @returns 是否触发了狂暴
 */
export function checkEnrage(
  state: BattleState,
  bossState: BossBattleState,
  bossCombatant: Combatant
): boolean {
  if (bossState.isEnraged) return false

  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return false

  if (bossState.currentRound >= config.enrage.enrageRound) {
    bossState.isEnraged = true

    // 应用狂暴倍率
    bossCombatant.stats.physicalAttack = Math.floor(bossCombatant.stats.physicalAttack * config.enrage.attackMultiplier)
    bossCombatant.stats.magicAttack = Math.floor(bossCombatant.stats.magicAttack * config.enrage.attackMultiplier)
    bossCombatant.stats.speed = Math.floor(bossCombatant.stats.speed * config.enrage.speedMultiplier)

    // 记录日志
    state.log.push({
      round: state.round,
      type: 'system',
      message: `${bossCombatant.name} 已狂暴！攻击力 ×${config.enrage.attackMultiplier}，速度 ×${config.enrage.speedMultiplier}`,
      actorUid: bossCombatant.uid,
      timestamp: Date.now()
    })

    return true
  }
  return false
}

/**
 * 获取死亡的友方单位
 * @param state - 战斗状态
 * @returns 已阵亡的友方参战单位列表
 */
export function getDeadAllies(state: BattleState): Combatant[] {
  return state.combatants.filter(c => c.side === 'ally' && !c.isAlive)
}

/**
 * 执行复活操作
 * 校验复活次数、MP 消耗，复活目标并恢复部分 HP
 * @param state - 战斗状态
 * @param bossState - Boss 战运行状态
 * @param targetUid - 复活目标 UID
 * @param actorMp - 复活者的当前 MP
 * @returns 复活结果（成功/失败 + 提示信息）
 */
export function executeRevive(
  state: BattleState,
  bossState: BossBattleState,
  targetUid: string,
  actorMp: number
): { success: boolean; message: string } {
  const config = getBossConfig(state.combatants.find(c => c.side === 'enemy' && c.type === 'enemy')?.sourceId ?? '')
  if (!config) return { success: false, message: '非 Boss 战斗' }

  if (bossState.reviveCount >= config.revive.maxRevives) {
    return { success: false, message: '已达到最大复活次数' }
  }

  if (actorMp < config.revive.mpCost) {
    return { success: false, message: `MP 不足，需要 ${config.revive.mpCost}` }
  }

  const target = state.combatants.find(c => c.uid === targetUid)
  if (!target || target.isAlive) {
    return { success: false, message: '目标不存在或已存活' }
  }

  // 复活目标
  target.isAlive = true
  target.stats.hp = Math.floor(target.stats.maxHp * config.revive.reviveHpPercent / 100)
  target.stats.mp = Math.floor(target.stats.maxMp * 0.5)
  target.buffs = []
  target.actionValue = 0

  bossState.reviveCount++

  // 记录日志
  state.log.push({
    round: state.round,
    type: 'heal',
    message: `${target.name} 被复活！HP 恢复至 ${config.revive.reviveHpPercent}%（第 ${bossState.reviveCount} 次复活）`,
    targetUid: target.uid,
    timestamp: Date.now()
  })

  return { success: true, message: `复活 ${target.name} 成功` }
}

/**
 * 构建 Boss AOE 技能列表
 * @param bossCombatant - Boss 战斗单位
 * @returns Boss 可用的 AOE 技能列表
 */
export function buildBossAoeSkills(bossCombatant: Combatant): any[] {
  const config = getBossConfig(bossCombatant.sourceId)
  if (!config) return []

  return config.aoeSkillIds.map(skillId => convertBossSkill(skillId))
}

/**
 * 检查是否为 Boss 战斗
 * 通过查找敌方单位是否有对应的 Boss 配置来判断
 * @param state - 战斗状态
 * @returns 是否为 Boss 战斗
 */
export function isBossBattle(state: BattleState): boolean {
  const enemy = state.combatants.find(c => c.side === 'enemy')
  if (!enemy) return false
  return getBossConfig(enemy.sourceId) !== undefined
}
