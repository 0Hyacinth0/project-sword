import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBattleStore } from './battle'
import { useCharacterStore } from './character'
import { getDungeonConfig } from '../config/dungeon_config'
import { createWildMonsterCombatant, ELITE_MONSTER_SKILLS, applyMultiPlayerScaling } from '../api/map'
import { createPlayerCombatant, createAllyCombatantFromRoomMember } from '../api/battle'
import { getActiveBattleSkills } from '../config/skill_config'
import { calculateFullStats } from '../utils/attributeCalculator'
import { professionToJobType } from '../config/job_config'
import { calculateRewards } from '../utils/battleEngine'
import { calculateDungeonDrops } from '../utils/dungeonDrops'
import type { DungeonRunState, DungeonFloorResult, DungeonConfig, MemberDropDistribution } from '../types/dungeon'
import type { Combatant, BattleRewards } from '../types/battle'
import type { RoomMember } from '../types/team'

/** 空奖励 */
const EMPTY_REWARDS: BattleRewards = { exp: 0, gold: 0, items: [] }

/**
 * 副本状态管理
 * 管理副本运行生命周期：进入 → 楼层循环 → 结算
 */
export const useDungeonStore = defineStore('dungeon', () => {
  // ── 状态 ──
  const runState = ref<DungeonRunState | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──
  const isInDungeon = computed(() => runState.value !== null && runState.value.status === 'active')
  const isFloorComplete = computed(() => runState.value?.status === 'floor_complete')
  const isFloorDefeat = computed(() => runState.value?.status === 'floor_defeat')
  const isComplete = computed(() => runState.value?.status === 'complete')
  const isRetreated = computed(() => runState.value?.status === 'retreated')
  const isRunOver = computed(() => {
    if (!runState.value) return false
    return ['complete', 'retreated', 'floor_defeat'].includes(runState.value.status)
  })

  /** 当前副本配置 */
  const currentConfig = computed<DungeonConfig | null>(() => {
    if (!runState.value) return null
    return getDungeonConfig(runState.value.dungeonId) ?? null
  })

  /** 当前楼层配置 */
  const currentFloorConfig = computed(() => {
    if (!currentConfig.value || !runState.value) return null
    return currentConfig.value.floors.find(f => f.floorNumber === runState.value!.currentFloor) ?? null
  })

  /** 是否为最后一层 */
  const isLastFloor = computed(() => {
    if (!runState.value) return false
    return runState.value.currentFloor >= runState.value.totalFloors
  })

  /**
   * 进入副本
   * @param dungeonId - 副本 ID
   */
  function enterDungeon(dungeonId: string): { success: boolean; message: string } {
    const dungeon = getDungeonConfig(dungeonId)
    if (!dungeon) {
      return { success: false, message: '副本不存在' }
    }

    const characterStore = useCharacterStore()
    const charDetail = characterStore.characterDetail
    if (!charDetail) {
      return { success: false, message: '请先选择角色' }
    }

    if (charDetail.level < dungeon.levelRequirement) {
      return { success: false, message: `等级不足，需要 Lv.${dungeon.levelRequirement}` }
    }

    runState.value = {
      dungeonId,
      currentFloor: 1,
      totalFloors: dungeon.totalFloors,
      status: 'active',
      accumulatedRewards: { ...EMPTY_REWARDS, items: [] },
      floorHistory: [],
      playerHpPercent: 100,
      playerMpPercent: 100
    }

    return { success: true, message: '进入副本成功' }
  }

  /**
   * 开始当前楼层的战斗
   * 构造敌人并调用 battleStore.startWildBattle
   */
  async function startFloorBattle(): Promise<{ success: boolean; message: string }> {
    if (!runState.value || !currentFloorConfig.value) {
      return { success: false, message: '没有进行中的副本' }
    }

    const characterStore = useCharacterStore()
    const battleStore = useBattleStore()
    const charDetail = characterStore.characterDetail
    const characterId = characterStore.selectedCharacterId

    if (!charDetail || !characterId) {
      return { success: false, message: '请先选择角色' }
    }

    // 生成当前楼层所有敌人
    const enemies: Combatant[] = currentFloorConfig.value.enemies.map(m => createWildMonsterCombatant(m))

    // 精英副本增强：属性额外提升 + 注入精英专属技能
    const dungeonConfig = getDungeonConfig(runState.value.dungeonId)
    if (dungeonConfig?.difficulty === 'elite') {
      enemies.forEach(enemy => {
        enemy.stats.maxHp = Math.floor(enemy.stats.maxHp * 1.3)
        enemy.stats.hp = enemy.stats.maxHp
        enemy.stats.physicalAttack = Math.floor(enemy.stats.physicalAttack * 1.3)
        enemy.stats.magicAttack = Math.floor(enemy.stats.magicAttack * 1.3)
        enemy.stats.defense = Math.floor(enemy.stats.defense * 1.2)
        enemy.stats.speed = Math.floor(enemy.stats.speed * 1.2)
        enemy.stats.dodgeRate = Math.min(0.3, (enemy.stats.dodgeRate || 0) + 0.1)
        enemy.stats.criticalRate = Math.min(0.3, (enemy.stats.criticalRate || 0) + 0.1)
        enemy.skills = [...ELITE_MONSTER_SKILLS]
      })
    }

    // 获取角色技能和属性
    const jobType = professionToJobType(charDetail.profession)
    const skills = getActiveBattleSkills(jobType, charDetail.level)
    const attrs = {
      strength: charDetail.strength,
      intelligence: charDetail.intelligence,
      agility: charDetail.agility
    }
    const statsBreakdown = calculateFullStats(attrs, charDetail.profession, charDetail.equipment, null)

    // 发起战斗（支持多敌人）
    const result = await battleStore.startWildBattle(
      characterId,
      charDetail.characterName,
      statsBreakdown,
      skills,
      enemies
    )

    if (result.success) {
      // 如果不是第一层，需要修补玩家 HP/MP（楼层间延续）
      if (runState.value.currentFloor > 1) {
        patchPlayerHpMp()
      }
    }

    return result
  }

  /**
   * 修补战斗中玩家单位的 HP/MP（楼层间延续）
   * HP 恢复至 maxHp 的 30%，MP 恢复至 maxMp 的 50%
   */
  function patchPlayerHpMp(): void {
    const battleStore = useBattleStore()
    if (!battleStore.battleState || !runState.value) return

    const player = battleStore.battleState.combatants.find(c => c.type === 'player')
    if (!player) return

    const hpPercent = runState.value.playerHpPercent / 100
    const mpPercent = runState.value.playerMpPercent / 100

    player.stats.hp = Math.max(1, Math.floor(player.stats.maxHp * hpPercent))
    player.stats.mp = Math.floor(player.stats.maxMp * mpPercent)
  }

  /**
   * 开始多人副本楼层战斗
   * @param roomMembers - 房间成员列表
   */
  async function startMultiPlayerFloorBattle(roomMembers: RoomMember[]): Promise<{ success: boolean; message: string }> {
    if (!runState.value || !currentFloorConfig.value) {
      return { success: false, message: '没有进行中的副本' }
    }

    const characterStore = useCharacterStore()
    const battleStore = useBattleStore()
    const charDetail = characterStore.characterDetail
    const characterId = characterStore.selectedCharacterId

    if (!charDetail || !characterId) {
      return { success: false, message: '请先选择角色' }
    }

    // 生成敌人
    const enemies: Combatant[] = currentFloorConfig.value.enemies.map(m => createWildMonsterCombatant(m))

    // 应用多人缩放
    applyMultiPlayerScaling(enemies, roomMembers.length)

    // 应用精英缩放
    const dungeonConfig = getDungeonConfig(runState.value.dungeonId)
    if (dungeonConfig?.difficulty === 'elite') {
      enemies.forEach(enemy => {
        enemy.stats.maxHp = Math.floor(enemy.stats.maxHp * 1.3)
        enemy.stats.hp = enemy.stats.maxHp
        enemy.stats.physicalAttack = Math.floor(enemy.stats.physicalAttack * 1.3)
        enemy.stats.magicAttack = Math.floor(enemy.stats.magicAttack * 1.3)
        enemy.stats.defense = Math.floor(enemy.stats.defense * 1.2)
        enemy.stats.speed = Math.floor(enemy.stats.speed * 1.2)
        enemy.stats.dodgeRate = Math.min(0.3, (enemy.stats.dodgeRate || 0) + 0.1)
        enemy.stats.criticalRate = Math.min(0.3, (enemy.stats.criticalRate || 0) + 0.1)
        enemy.skills = [...ELITE_MONSTER_SKILLS]
      })
    }

    // 创建玩家战斗单位
    const jobType = professionToJobType(charDetail.profession)
    const skills = getActiveBattleSkills(jobType, charDetail.level)
    const attrs = {
      strength: charDetail.strength,
      intelligence: charDetail.intelligence,
      agility: charDetail.agility
    }
    const statsBreakdown = calculateFullStats(attrs, charDetail.profession, charDetail.equipment, null)
    const playerCombatant = createPlayerCombatant(characterId, charDetail.characterName, statsBreakdown.total, skills)

    // 创建 AI 队友战斗单位（排除自己，根据职业生成技能）
    const otherMembers = roomMembers.filter(m => m.characterId !== characterId)
    const allyCombatants = otherMembers.map(m => {
      const memberJobType = professionToJobType(Number(m.profession))
      const memberSkills = getActiveBattleSkills(memberJobType, m.level)
      return createAllyCombatantFromRoomMember(m, memberSkills)
    })

    // 发起多人战斗
    const result = await battleStore.startWildBattleWithAllies(playerCombatant, allyCombatants, enemies)

    if (result.success) {
      // 记录房间成员信息
      runState.value.roomMembers = roomMembers
      runState.value.isMultiPlayer = true

      // 如果不是第一层，修补 HP/MP
      if (runState.value.currentFloor > 1) {
        patchPlayerHpMp()
      }
    }

    return result
  }

  /**
   * 处理楼层战斗胜利
   * 累积奖励，推进楼层
   */
  function handleFloorComplete(): void {
    if (!runState.value) return

    const battleStore = useBattleStore()

    // 记录玩家战后 HP/MP 百分比
    const player = battleStore.battleState?.combatants.find(c => c.type === 'player')
    if (player) {
      runState.value.playerHpPercent = Math.max(30, Math.round((player.stats.hp / player.stats.maxHp) * 100))
      runState.value.playerMpPercent = Math.max(50, Math.round((player.stats.mp / player.stats.maxMp) * 100))
    }

    // 获取该层奖励（经验/金币按击杀敌人计算，物品使用副本专属掉落表）
    const deadEnemies = battleStore.battleState?.combatants.filter(c => c.side === 'enemy' && !c.isAlive) ?? []
    const baseRewards = calculateRewards(deadEnemies)
    const dungeonId = runState.value.dungeonId
    const isBossFloor = currentFloorConfig.value?.isBossFloor ?? false
    const isElite = currentConfig.value?.difficulty === 'elite'

    // 多人副本：为每个成员独立计算掉落
    let memberDrops: MemberDropDistribution[] | undefined = undefined
    if (runState.value.isMultiPlayer && runState.value.roomMembers) {
      memberDrops = runState.value.roomMembers.map(member => ({
        characterId: member.characterId,
        characterName: member.characterName,
        drops: calculateDungeonDrops(dungeonId, isBossFloor, isElite)
      }))
    }

    // 构建楼层奖励：保留通用经验/金币，物品使用掉落表（单人模式）
    const floorRewards: BattleRewards = {
      exp: baseRewards.exp,
      gold: baseRewards.gold,
      items: runState.value.isMultiPlayer ? [] : calculateDungeonDrops(dungeonId, isBossFloor, isElite),
      petExp: baseRewards.petExp
    }

    // 累积奖励（单人模式累积物品，多人模式物品分配到 memberDrops）
    runState.value.accumulatedRewards.exp += floorRewards.exp
    runState.value.accumulatedRewards.gold += floorRewards.gold
    runState.value.accumulatedRewards.items.push(...floorRewards.items)
    runState.value.accumulatedRewards.petExp = (runState.value.accumulatedRewards.petExp ?? 0) + (floorRewards.petExp ?? 0)

    // 记录楼层历史
    const floorResult: DungeonFloorResult = {
      floorNumber: runState.value.currentFloor,
      outcome: 'victory',
      rewards: floorRewards,
      memberDrops
    }
    runState.value.floorHistory.push(floorResult)

    // 清理战斗状态
    battleStore.finishBattle()

    // 推进楼层或完成副本
    if (runState.value.currentFloor >= runState.value.totalFloors) {
      runState.value.status = 'complete'
    } else {
      runState.value.currentFloor++
      runState.value.status = 'floor_complete'
    }
  }

  /**
   * 处理楼层战斗失败
   */
  function handleFloorDefeat(): void {
    if (!runState.value) return

    const battleStore = useBattleStore()

    // 记录楼层历史
    const floorResult: DungeonFloorResult = {
      floorNumber: runState.value.currentFloor,
      outcome: 'defeat',
      rewards: null
    }
    runState.value.floorHistory.push(floorResult)

    // 清理战斗状态
    battleStore.finishBattle()

    runState.value.status = 'floor_defeat'
  }

  /**
   * 中途撤退
   * 保留已累积的奖励
   */
  function retreat(): void {
    if (!runState.value) return
    runState.value.status = 'retreated'
  }

  /**
   * 领取奖励并退出
   * @returns 累积奖励
   */
  async function claimRewardsAndExit(): Promise<BattleRewards | null> {
    if (!runState.value) return null

    const rewards: BattleRewards = {
      exp: runState.value.accumulatedRewards.exp,
      gold: runState.value.accumulatedRewards.gold,
      items: [...runState.value.accumulatedRewards.items],
      petExp: runState.value.accumulatedRewards.petExp
    }

    // 如果通关，加上通关奖励
    if (runState.value.status === 'complete') {
      const config = getDungeonConfig(runState.value.dungeonId)
      if (config) {
        rewards.exp += config.rewards.bonusExp
        rewards.gold += config.rewards.bonusGold
        rewards.items.push(
          ...config.rewards.guaranteedItems.map(item => ({
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            quality: item.rarity.toLowerCase() as 'common' | 'rare' | 'epic' | 'legendary'
          }))
        )
      }
    }

    clearRun()
    return rewards
  }

  /** 清除副本运行状态 */
  function clearRun(): void {
    runState.value = null
  }

  return {
    runState,
    loading,
    isInDungeon,
    isFloorComplete,
    isFloorDefeat,
    isComplete,
    isRetreated,
    isRunOver,
    currentConfig,
    currentFloorConfig,
    isLastFloor,
    enterDungeon,
    startFloorBattle,
    startMultiPlayerFloorBattle,
    handleFloorComplete,
    handleFloorDefeat,
    retreat,
    claimRewardsAndExit,
    clearRun
  }
})
