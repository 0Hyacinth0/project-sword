<template>
  <div class="settlement-overlay" v-if="visible">
    <div class="settlement-card" :class="outcome">
      <!-- 结果标题 -->
      <div class="result-header">
        <div class="result-icon">{{ outcomeIcon }}</div>
        <h2 class="result-title">{{ outcomeLabel }}</h2>
        <p class="result-subtitle" v-if="outcome === 'victory'">战斗胜利，获得以下奖励</p>
        <p class="result-subtitle" v-else-if="outcome === 'defeat'">胜败乃兵家常事，下次再接再厉</p>
        <p class="result-subtitle" v-else>成功脱离了战斗</p>
      </div>

      <!-- 胜利：奖励展示 -->
      <template v-if="outcome === 'victory' && rewards">
        <!-- 经验 & 金币 -->
        <div class="reward-core">
          <div class="reward-item exp-reward">
            <span class="reward-icon">EXP</span>
            <div class="reward-info">
              <span class="reward-label">经验值</span>
              <span class="reward-value anim-count">{{ animatedExp }}</span>
            </div>
          </div>
          <div class="reward-item gold-reward">
            <span class="reward-icon">G</span>
            <div class="reward-info">
              <span class="reward-label">金币</span>
              <span class="reward-value anim-count">{{ animatedGold }}</span>
            </div>
          </div>
          <div class="reward-item pet-reward" v-if="rewards.petExp && rewards.petExp > 0">
            <span class="reward-icon">PET</span>
            <div class="reward-info">
              <span class="reward-label">战宠经验</span>
              <span class="reward-value anim-count">{{ animatedPetExp }}</span>
            </div>
          </div>
        </div>

        <!-- 升级提示 -->
        <div class="level-up-banner" v-if="rewards.levelUp">
          <span class="level-up-text">LEVEL UP! Lv.{{ rewards.newLevel }}</span>
        </div>

        <!-- 掉落物品 -->
        <div class="drop-section" v-if="rewards.items.length > 0">
          <div class="section-title">战利品</div>
          <div class="drop-grid">
            <div
              v-for="(item, i) in rewards.items"
              :key="`${item.itemId}-${i}`"
              class="drop-card"
              :class="item.quality ?? 'common'"
              :style="{ animationDelay: `${0.3 + i * 0.1}s` }"
            >
              <div class="drop-icon">{{ itemTypeIcon(item) }}</div>
              <div class="drop-info">
                <span class="drop-name" :class="item.quality">{{ item.name }}</span>
                <span class="drop-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="drop-section" v-else>
          <div class="no-drop">本次战斗未获得物品</div>
        </div>

        <!-- 战斗统计 -->
        <div class="stats-section" v-if="statistics">
          <div class="section-title">战斗统计</div>
          <div class="stats-grid">
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.totalRounds }}</span>
              <span class="stat-desc">总回合</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.totalDamageDealt }}</span>
              <span class="stat-desc">总伤害</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.criticalHits }}</span>
              <span class="stat-desc">暴击</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.dodgeCount }}</span>
              <span class="stat-desc">闪避</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.totalHealed }}</span>
              <span class="stat-desc">治疗</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.enemiesKilled }}</span>
              <span class="stat-desc">击杀</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 失败/逃跑：简化展示 -->
      <template v-if="outcome === 'defeat' || outcome === 'fled'">
        <div class="stats-section" v-if="statistics">
          <div class="stats-grid compact">
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.totalRounds }}</span>
              <span class="stat-desc">坚持回合</span>
            </div>
            <div class="stat-cell">
              <span class="stat-num">{{ statistics.totalDamageDealt }}</span>
              <span class="stat-desc">造成伤害</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 操作按钮 -->
      <div class="settlement-actions">
        <button class="action-btn primary" @click="$emit('confirm')">
          {{ outcome === 'victory' ? '领取奖励' : '返回' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BattleOutcome, BattleRewards, BattleStatistics } from '../../types/battle'

const props = defineProps<{
  /** 是否显示结算页面 */
  visible: boolean
  /** 战斗结果 */
  outcome: BattleOutcome | null
  /** 战斗奖励 */
  rewards: BattleRewards | null
  /** 战斗统计 */
  statistics: BattleStatistics | null
}>()

defineEmits<{
  confirm: []
}>()

// ── 数字动画 ──

const animatedExp = ref(0)
const animatedGold = ref(0)
const animatedPetExp = ref(0)

/**
 * 数字递增动画
 * @param target - 目标值
 * @param setter - 设置函数
 * @param duration - 动画时长(ms)
 */
function animateNumber(target: number, setter: (v: number) => void, duration: number = 800): void {
  const start = 0
  const startTime = performance.now()

  function tick(now: number): void {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    // ease-out 缓动
    const eased = 1 - Math.pow(1 - progress, 3)
    setter(Math.floor(start + (target - start) * eased))
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

/** 监听 visible 触发动画 */
watch(() => props.visible, (v) => {
  if (v && props.rewards) {
    animatedExp.value = 0
    animatedGold.value = 0
    animatedPetExp.value = 0
    setTimeout(() => {
      animateNumber(props.rewards!.exp, (n) => { animatedExp.value = n })
      animateNumber(props.rewards!.gold, (n) => { animatedGold.value = n })
      if (props.rewards!.petExp) {
        animateNumber(props.rewards!.petExp, (n) => { animatedPetExp.value = n })
      }
    }, 400)
  }
})

// ── 计算属性 ──

/** 结果图标 */
const outcomeIcon = computed(() => {
  switch (props.outcome) {
    case 'victory': return 'V'
    case 'defeat': return 'D'
    case 'fled': return 'F'
    default: return ''
  }
})

/** 结果标题 */
const outcomeLabel = computed(() => {
  switch (props.outcome) {
    case 'victory': return '战斗胜利'
    case 'defeat': return '战斗失败'
    case 'fled': return '成功逃脱'
    default: return ''
  }
})

/**
 * 获取物品类型图标
 * @param item - 掉落物品
 */
function itemTypeIcon(item: { itemType?: string }): string {
  switch (item.itemType) {
    case 'equipment': return 'E'
    case 'material': return 'M'
    case 'consumable': return 'P'
    case 'pet_egg': return 'E'
    default: return '?'
  }
}
</script>

<style scoped>
/* ── 遮罩层 ── */
.settlement-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: overlay-in 0.3s ease-out;
  padding: 20px;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── 结算卡片 ── */
.settlement-card {
  padding: 32px 36px;
  border-radius: 20px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-float);
  max-width: 480px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  animation: card-in 0.5s var(--ease-spring);
}

@keyframes card-in {
  from { opacity: 0; transform: scale(0.88) translateY(24px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── 结果头部 ── */
.result-header {
  text-align: center;
  margin-bottom: 24px;
}

.result-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 12px;
}

.settlement-card.victory .result-icon {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-gold);
}

.settlement-card.defeat .result-icon {
  background: rgba(255, 59, 48, 0.15);
  color: var(--accent-red);
}

.settlement-card.fled .result-icon {
  background: rgba(0, 113, 227, 0.15);
  color: var(--accent-blue);
}

.result-title {
  font-size: var(--font-size-subheading);
  font-weight: 700;
  margin: 0 0 4px;
}

.settlement-card.victory .result-title { color: var(--accent-gold); }
.settlement-card.defeat .result-title { color: var(--accent-red); }
.settlement-card.fled .result-title { color: var(--accent-blue); }

.result-subtitle {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin: 0;
}

/* ── 核心奖励（经验/金币/战宠） ── */
.reward-core {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
}

.reward-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-caption);
  font-weight: 700;
  flex-shrink: 0;
}

.exp-reward .reward-icon { background: rgba(0, 113, 227, 0.12); color: var(--accent-blue); }
.gold-reward .reward-icon { background: rgba(245, 158, 11, 0.12); color: var(--accent-gold); }
.pet-reward .reward-icon { background: rgba(52, 199, 89, 0.12); color: var(--accent-green); }

.reward-info { flex: 1; display: flex; align-items: center; justify-content: space-between; }

.reward-label {
  font-size: var(--font-size-small);
  color: var(--text-muted);
}

.reward-value {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
}

.exp-reward .reward-value { color: var(--accent-blue); }
.gold-reward .reward-value { color: var(--accent-gold); }
.pet-reward .reward-value { color: var(--accent-green); }

/* ── 升级提示 ── */
.level-up-banner {
  text-align: center;
  padding: 10px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(255, 149, 0, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  animation: glow-pulse 1.5s ease-in-out infinite;
}

.level-up-text {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 16px rgba(245, 158, 11, 0.4); }
}

/* ── 掉落物品区域 ── */
.section-title {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 10px;
}

.drop-section {
  margin-bottom: 16px;
}

.drop-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drop-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  animation: drop-in 0.4s var(--ease-out-expo) both;
}

@keyframes drop-in {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 物品品质边框颜色 */
.drop-card.rare { border-left: 3px solid var(--accent-blue); }
.drop-card.epic { border-left: 3px solid #af52de; }
.drop-card.legendary { border-left: 3px solid var(--accent-gold); }

.drop-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-caption);
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.drop-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drop-name {
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--text-primary);
}

.drop-name.rare { color: var(--accent-blue); }
.drop-name.epic { color: #af52de; }
.drop-name.legendary { color: var(--accent-gold); }

.drop-quantity {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  font-weight: 500;
}

.no-drop {
  text-align: center;
  padding: 16px;
  font-size: var(--font-size-small);
  color: var(--text-muted);
  border-radius: 10px;
  border: 1px dashed var(--border-light);
}

/* ── 战斗统计 ── */
.stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stats-grid.compact {
  grid-template-columns: repeat(2, 1fr);
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  border-radius: 10px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
}

.stat-num {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
}

.stat-desc {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── 操作按钮 ── */
.settlement-actions {
  margin-top: 8px;
}

.action-btn {
  width: 100%;
  padding: 12px 24px;
  font-size: var(--font-size-base);
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: var(--accent-blue);
  color: var(--button-text);
}

.action-btn.primary:hover { filter: brightness(1.1); }
.action-btn.primary:active { transform: scale(0.98); }

/* ── 自定义滚动条 ── */
.settlement-card::-webkit-scrollbar { width: 4px; }
.settlement-card::-webkit-scrollbar-track { background: transparent; }
.settlement-card::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.12); border-radius: 2px; }

/* ── 响应式 ── */
@media (max-width: 720px) {
  .settlement-card { padding: 24px 20px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .reward-item { padding: 8px 12px; }
}

/* ── 深色模式 ── */
[data-theme='dark'] .drop-icon {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .settlement-card::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
</style>
