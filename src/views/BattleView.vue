<template>
  <div class="battle-view">
    <!-- 战斗未开始：入口 -->
    <div class="battle-entry" v-if="!store.isBattleActive">
      <div class="entry-card">
        <h2 class="entry-title">回合制战斗</h2>
        <p class="entry-desc">进入战斗，测试回合制战斗引擎</p>

        <div class="phase-flow">
          <div class="phase-step" v-for="(step, i) in phaseSteps" :key="i">
            <div class="step-dot">{{ i + 1 }}</div>
            <span class="step-label">{{ step }}</span>
            <span v-if="i < phaseSteps.length - 1" class="step-arrow">→</span>
          </div>
        </div>

        <button class="start-btn" @click="handleStartBattle" :disabled="store.loading">
          {{ store.loading ? '加载中...' : '开始战斗' }}
        </button>

        <!-- 技能展示 -->
        <div class="skills-section">
          <SkillInfoPanel :skills="warriorSkills" />
        </div>

        <!-- 伤害公式 -->
        <button class="formula-btn" @click="showDamageBreakdown = !showDamageBreakdown">
          {{ showDamageBreakdown ? '收起伤害公式' : '查看伤害计算公式' }}
        </button>
        <DamageBreakdownPanel :visible="showDamageBreakdown" @close="showDamageBreakdown = false" />
      </div>
    </div>

    <!-- 战斗进行中 -->
    <div class="battle-arena" :class="{ shake: screenShake }" v-else>
      <!-- 顶部：回合指示器 -->
      <div class="phase-indicator">
        <div class="phase-left">
          <span class="round-badge">R{{ store.round }}</span>
          <span class="current-phase" :class="store.phase">{{ phaseLabel }}</span>
        </div>
        <button class="exit-btn" @click="handleBattleEnd" v-if="store.isBattleOver">结束战斗</button>
      </div>

      <!-- 行动顺序条 -->
      <ActionOrderBar :entries="store.battleState?.actionOrderPreview ?? []" />

      <!-- 战场主区域 -->
      <div class="battlefield">
        <!-- 敌方区域 -->
        <div class="battle-side enemy-side">
          <div class="side-header">
            <span class="side-icon enemy-icon">!</span>
            <span class="side-title">敌方</span>
          </div>
          <div class="combatant-list">
            <CombatantBar
              v-for="enemy in store.combatants.filter(c => c.side === 'enemy')"
              :key="enemy.uid"
              :combatant="enemy"
              :is-active="store.currentActor?.uid === enemy.uid"
              side="enemy"
            />
          </div>
          <div class="side-empty" v-if="store.combatants.filter(c => c.side === 'enemy').length === 0">
            无敌人
          </div>
        </div>

        <!-- 中央分隔 -->
        <div class="battlefield-divider">
          <div class="divider-line"></div>
          <span class="divider-text">VS</span>
          <div class="divider-line"></div>
        </div>

        <!-- 我方区域 -->
        <div class="battle-side ally-side">
          <div class="side-header">
            <span class="side-icon ally-icon">&#9733;</span>
            <span class="side-title">我方</span>
          </div>
          <div class="combatant-list">
            <CombatantBar
              v-for="ally in store.combatants.filter(c => c.side === 'ally')"
              :key="ally.uid"
              :combatant="ally"
              :is-active="store.currentActor?.uid === ally.uid"
              side="ally"
            />
          </div>
        </div>
      </div>

      <!-- 行动面板 -->
      <BattleActionPanel
        :visible="store.waitingForPlayer"
        :actor-uid="store.currentActor?.uid ?? ''"
        :actor-name="store.currentActor?.name ?? ''"
        :phase="store.phase"
        :skills="store.currentActor?.skills ?? []"
        :targets="store.availableTargets"
        :cooldowns="store.currentActor?.cooldowns ?? {}"
        :current-mp="store.currentActor?.stats.mp ?? 0"
        @action="handleAction"
      />

      <!-- 战斗日志 -->
      <BattleLog
        :entries="store.log"
        :current-round="store.round"
      />

      <!-- 战斗结算 -->
      <BattleResultOverlay
        :visible="store.isBattleOver"
        :outcome="store.battleOutcome"
        :rewards="store.battleRewards"
        :statistics="store.battleStatistics"
        @confirm="handleBattleEnd"
      />
    </div>

    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack" v-if="!store.isBattleActive">
      ← 返回
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBattleStore } from '../stores/battle'
import { BattlePhase } from '../types/battle'
import type { BattleAction } from '../types/battle'
import { triggerDamageAnimations, triggerBuffAnimation, triggerDeathAnimation, screenShake } from '../utils/battleAnimation'
import CombatantBar from '../components/battle/CombatantBar.vue'
import BattleActionPanel from '../components/battle/BattleActionPanel.vue'
import BattleLog from '../components/battle/BattleLog.vue'
import BattleResultOverlay from '../components/battle/BattleResultOverlay.vue'
import ActionOrderBar from '../components/battle/ActionOrderBar.vue'
import SkillInfoPanel from '../components/battle/SkillInfoPanel.vue'
import DamageBreakdownPanel from '../components/battle/DamageBreakdownPanel.vue'
import { getJobSkills } from '../config/skill_config'
import type { SkillConfig } from '../config/skill_config'

const router = useRouter()
const store = useBattleStore()

/** 展示用的战士技能配置 */
const warriorSkills: SkillConfig[] = getJobSkills('WARRIOR', 15)

/** 状态机流程步骤（入口页面展示用） */
const phaseSteps = [
  '回合开始',
  'Buff/Debuff结算',
  '行动选择',
  '伤害计算',
  '闪避/暴击判定',
  '结算',
  '回合结束'
]

/** 当前阶段中文标签 */
const phaseLabel = computed(() => {
  switch (store.phase) {
    case BattlePhase.IDLE: return '空闲'
    case BattlePhase.ROUND_START: return '回合开始'
    case BattlePhase.BUFF_SETTLEMENT: return 'Buff/Debuff结算'
    case BattlePhase.ACTION_SELECT: return '行动选择'
    case BattlePhase.DAMAGE_CALCULATION: return '伤害计算'
    case BattlePhase.DODGE_CRIT_CHECK: return '闪避/暴击判定'
    case BattlePhase.SETTLEMENT: return '结算'
    case BattlePhase.ROUND_END: return '回合结束'
    case BattlePhase.BATTLE_END: return '战斗结束'
    default: return ''
  }
})

/** 伤害明细面板 */
const showDamageBreakdown = ref(false)

/** 监听伤害结果，触发动画 */
watch(() => store.battleState?.lastDamageResults, (results) => {
  if (results && results.length > 0) {
    const actorUid = store.currentActor?.uid
    triggerDamageAnimations(results, actorUid)
  }
})

/** 监听 Buff 结算，触发动画 */
watch(() => store.battleState?.lastBuffResults, (results) => {
  if (results && results.length > 0) {
    for (const r of results) {
      triggerBuffAnimation(r.targetUid, r.isDebuff)
    }
  }
})

/** 监听战斗结束，触发死亡动画 */
watch(() => store.isBattleOver, (over) => {
  if (over) {
    const deadUnits = store.combatants.filter(c => !c.isAlive)
    for (const unit of deadUnits) {
      triggerDeathAnimation(unit.uid)
    }
  }
})

/**
 * 发起战斗
 */
async function handleStartBattle() {
  await store.startBattle(
    'mock-char-1',
    '勇者',
    {
      base: { maxHp: 200, maxMp: 80, physicalAttack: 25, magicAttack: 15, defense: 12, dodgeRate: 0.05, criticalRate: 0.1 },
      equipment: { maxHp: 0, maxMp: 0, physicalAttack: 0, magicAttack: 0, defense: 0, dodgeRate: 0, criticalRate: 0 },
      pet: { hp: 0, attack: 0, defense: 0 },
      total: { maxHp: 200, maxMp: 80, physicalAttack: 25, magicAttack: 15, defense: 12, dodgeRate: 0.05, criticalRate: 0.1 }
    },
    [
      { id: 5001, name: '重击', type: 'active_attack', power: 150, cooldown: 2, mpCost: 8, targetType: 'single_enemy', description: '集中力量进行重击' },
      { id: 5002, name: '火球术', type: 'active_attack', power: 180, cooldown: 3, mpCost: 15, targetType: 'single_enemy', description: '投掷火球攻击敌人' },
      { id: 5003, name: '治疗术', type: 'active_heal', power: 120, cooldown: 2, mpCost: 10, targetType: 'self', description: '恢复自身生命值' },
      { id: 5004, name: '战吼', type: 'active_buff', cooldown: 4, mpCost: 5, targetType: 'self', description: '提升攻击力', attachedBuff: { name: '战意高昂', isDebuff: false, stat: 'physicalAttack', value: 15, duration: 3 } }
    ],
    {
      id: 'pet-001',
      nickname: '小火焰',
      stats: { hp: 120, maxHp: 120, attack: 18, defense: 6, speed: 16 },
      skills: [{ id: 6001, name: '火焰喷射', type: 'active_attack', power: 100, cooldown: 0, mpCost: 5, targetType: 'single_enemy', description: '喷射火焰攻击' }]
    }
  )
}

/**
 * 提交玩家行动
 * @param action - 玩家选择的行动
 */
async function handleAction(action: BattleAction) {
  await store.submitAction(action)
}

/**
 * 结束战斗
 */
async function handleBattleEnd() {
  await store.finishBattle()
}

/** 返回上一页 */
function goBack() {
  router.push('/')
}
</script>

<style scoped>
.battle-view {
  min-height: 100vh;
  padding: 32px 28px 40px;
  max-width: 1120px;
  margin: 0 auto;
  position: relative;
}

/* ── 入口卡片 ── */
.battle-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  gap: 24px;
}

.entry-card {
  padding: 40px;
  border-radius: 20px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  max-width: 560px;
  width: 100%;
  text-align: center;
}

.entry-title {
  font-size: var(--font-size-heading);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.entry-desc {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin: 0 0 32px;
}

.phase-flow {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-bottom: 32px;
}

.phase-step {
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-blue);
  color: var(--button-text);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-label {
  font-size: var(--font-size-caption);
  color: var(--text-primary);
  white-space: nowrap;
}

.step-arrow {
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  margin: 0 2px;
}

.start-btn {
  padding: 12px 40px;
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--accent-blue);
  color: var(--button-text);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover:not(:disabled) { filter: brightness(1.1); }
.start-btn:active:not(:disabled) { transform: scale(0.98); }
.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.skills-section {
  max-width: 560px;
  width: 100%;
}

.formula-btn {
  padding: 8px 20px;
  font-size: var(--font-size-small);
  background: none;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--accent-blue);
  cursor: pointer;
  transition: all 0.2s ease;
}

.formula-btn:hover {
  background: rgba(0, 113, 227, 0.06);
}

/* ── 战斗竞技场 ── */
.battle-arena {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

/* ── 回合指示器 ── */
.phase-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-radius: 14px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
}

.phase-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.round-badge {
  font-size: var(--font-size-small);
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.current-phase {
  font-size: var(--font-size-small);
  padding: 4px 12px;
  border-radius: 6px;
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  font-weight: 500;
}

.current-phase.ROUND_START { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
.current-phase.BUFF_SETTLEMENT { background: rgba(175, 82, 222, 0.1); color: #af52de; }
.current-phase.ACTION_SELECT { background: rgba(0, 113, 227, 0.1); color: var(--accent-blue); }
.current-phase.SETTLEMENT { background: rgba(255, 149, 0, 0.1); color: var(--accent-gold); }
.current-phase.BATTLE_END { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }

.exit-btn {
  padding: 6px 16px;
  font-size: var(--font-size-small);
  font-weight: 500;
  background: var(--accent-red);
  color: var(--button-text);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exit-btn:hover { filter: brightness(1.1); }

/* ── 战场主区域 ── */
.battlefield {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;
}

.battle-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.side-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.enemy-icon {
  background: rgba(255, 59, 48, 0.12);
  color: var(--accent-red);
}

.ally-icon {
  background: rgba(0, 113, 227, 0.12);
  color: var(--accent-blue);
}

.side-title {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 500;
}

.combatant-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-empty {
  padding: 20px;
  text-align: center;
  font-size: var(--font-size-small);
  color: var(--text-muted);
  border-radius: 14px;
  border: 1px dashed var(--border-light);
}

/* ── 中央分隔 ── */
.battlefield-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  align-self: stretch;
}

.divider-line {
  flex: 1;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--border-light), transparent);
}

.divider-text {
  font-size: var(--font-size-section);
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  opacity: 0.4;
}

/* ── 震屏效果 ── */
.battle-arena.shake {
  animation: screen-shake 0.3s ease-out;
}

@keyframes screen-shake {
  0% { transform: translate(0, 0); }
  15% { transform: translate(-3px, 2px); }
  30% { transform: translate(3px, -2px); }
  45% { transform: translate(-2px, 1px); }
  60% { transform: translate(2px, -1px); }
  75% { transform: translate(-1px, 1px); }
  100% { transform: translate(0, 0); }
}

/* ── 返回按钮 ── */
.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  font-size: var(--font-size-small);
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  filter: brightness(1.05);
}

/* ── 响应式 ── */
@media (max-width: 960px) {
  .battle-view { padding: 24px 12px 36px; }
  .entry-card { padding: 28px 20px; }
  .phase-flow { gap: 2px; }
  .step-label { font-size: 10px; }
}

@media (max-width: 720px) {
  .battlefield {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .battlefield-divider {
    flex-direction: row;
    padding: 8px 24px;
  }

  .divider-line {
    height: 1px;
    width: auto;
    flex: 1;
    background: linear-gradient(90deg, transparent, var(--border-light), transparent);
  }
}
</style>
