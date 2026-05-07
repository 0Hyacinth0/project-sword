<template>
  <div class="battle-view">
    <!-- 战斗未开始：入口 -->
    <div class="battle-entry" v-if="!store.isBattleActive">
      <div class="entry-card">
        <h2 class="entry-title">⚔ 回合制战斗</h2>
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
    <div class="battle-arena" v-else>
      <!-- 阶段指示器 -->
      <div class="phase-indicator">
        <span class="round-text">第 {{ store.round }} 回合</span>
        <span class="current-phase" :class="store.phase">{{ phaseLabel }}</span>
      </div>

      <!-- 行动顺序条 -->
      <ActionOrderBar :entries="store.battleState?.actionOrderPreview ?? []" />

      <!-- 敌方区域 -->
      <div class="enemy-area">
        <h3 class="area-label">敌方</h3>
        <CombatantBar
          v-for="enemy in store.combatants.filter(c => c.side === 'enemy')"
          :key="enemy.uid"
          :combatant="enemy"
          :is-active="store.currentActor?.uid === enemy.uid"
          side="enemy"
        />
      </div>

      <!-- 友方区域 -->
      <div class="ally-area">
        <h3 class="area-label">我方</h3>
        <CombatantBar
          v-for="ally in store.combatants.filter(c => c.side === 'ally')"
          :key="ally.uid"
          :combatant="ally"
          :is-active="store.currentActor?.uid === ally.uid"
          side="ally"
        />
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

      <!-- 伤害飘字 -->
      <div class="damage-floats">
        <div
          v-for="(result, i) in damageResults"
          :key="i"
          class="float-text"
          :class="{ crit: result.isCritical, dodge: result.isDodged, heal: result.isHeal }"
          :style="{ animationDelay: `${i * 0.1}s` }"
        >
          {{ result.isDodged ? 'MISS' : result.isHeal ? `+${result.value}` : `-${result.value}` }}
        </div>
      </div>

      <!-- 战斗结算 -->
      <BattleResultOverlay
        :visible="store.isBattleOver"
        :outcome="store.battleOutcome"
        :rewards="store.battleRewards"
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
import type { BattleAction, DamageResult } from '../types/battle'
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

/** 伤害飘字 */
const damageResults = ref<DamageResult[]>([])

/** 伤害明细面板 */
const showDamageBreakdown = ref(false)

/** 监听最新伤害结果，触发飘字动画 */
watch(() => store.battleState?.lastDamageResults, (results) => {
  if (results && results.length > 0) {
    damageResults.value = results
    setTimeout(() => {
      damageResults.value = []
    }, 1500)
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
  border-radius: 8px;
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

.phase-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-radius: 12px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
}

.round-text {
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
}

.current-phase {
  font-size: var(--font-size-small);
  padding: 4px 12px;
  border-radius: 4px;
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  font-weight: 500;
}

.current-phase.ROUND_START { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
.current-phase.BUFF_SETTLEMENT { background: rgba(175, 82, 222, 0.1); color: #af52de; }
.current-phase.ACTION_SELECT { background: rgba(0, 113, 227, 0.1); color: var(--accent-blue); }
.current-phase.SETTLEMENT { background: rgba(255, 149, 0, 0.1); color: var(--accent-gold); }
.current-phase.BATTLE_END { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }

.area-label {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin: 0 0 8px;
}

.enemy-area,
.ally-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── 伤害飘字 ── */
.damage-floats {
  position: fixed;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.float-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-red);
  animation: fct-float 1.5s ease-out forwards;
}

.float-text.crit {
  font-size: 32px;
  color: var(--accent-gold);
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.float-text.dodge {
  color: var(--text-muted);
  font-size: 18px;
}

.float-text.heal {
  color: var(--accent-green);
}

@keyframes fct-float {
  0% { opacity: 0; transform: translateY(20px) scale(0.8); }
  15% { opacity: 1; transform: translateY(-5px) scale(1.1); }
  30% { transform: translateY(-15px) scale(1.0); }
  80% { opacity: 1; transform: translateY(-40px); }
  100% { opacity: 0; transform: translateY(-60px); }
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
</style>
