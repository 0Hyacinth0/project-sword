<template>
  <Transition name="overlay-fade">
    <div v-if="visible && result" class="settlement-overlay">
      <!-- ═══ 胜负标题 ═══ -->
      <span class="settlement-overlay__result" :class="isVictory ? 'settlement-overlay__result--win' : 'settlement-overlay__result--lose'">
        {{ isVictory ? '胜利！' : '失败' }}
      </span>

      <!-- ═══ 段位变化提示 ═══ -->
      <span v-if="result.tierChanged" class="settlement-overlay__tier-change">
        {{ result.oldTier.tierName }} → {{ result.newTier.tierName }}
      </span>

      <!-- ═══ 积分变化区块 ═══ -->
      <div class="settlement-overlay__score-row">
        <div class="score-block">
          <span class="score-block__label">原积分</span>
          <span class="score-block__value">{{ result.oldScore }}</span>
        </div>
        <div class="score-block score-block--change">
          <span class="score-block__value" :class="result.scoreChange >= 0 ? 'score-block__value--up' : 'score-block__value--down'">
            {{ result.scoreChange >= 0 ? '+' : '' }}{{ result.scoreChange }}
          </span>
        </div>
        <div class="score-block">
          <span class="score-block__label">新积分</span>
          <span class="score-block__value" :class="result.scoreChange >= 0 ? 'score-block__value--up' : 'score-block__value--down'">
            {{ result.newScore }}
          </span>
        </div>
      </div>

      <!-- ═══ 段位进度条 ═══ -->
      <div class="settlement-overlay__progress">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${(result.newTier.progress * 100).toFixed(1)}%` }"
          ></div>
        </div>
        <span class="settlement-overlay__progress-hint">
          距下一级还需 {{ result.newTier.remainingScore }} 积分
        </span>
      </div>

      <!-- ═══ 战绩统计 ═══ -->
      <div class="settlement-overlay__stats">
        <div class="stat-item">
          <span class="stat-item__value stat-item__value--win">{{ wins }}</span>
          <span class="stat-item__label">胜场</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__value stat-item__value--lose">{{ losses }}</span>
          <span class="stat-item__label">败场</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__value stat-item__value--rate">{{ winRateText }}</span>
          <span class="stat-item__label">胜率</span>
        </div>
      </div>

      <!-- ═══ 返回按钮 ═══ -->
      <button class="settlement-overlay__btn-back" @click="$emit('close')">
        返回比武擂台
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PvpScoreResult } from '../../types/pvp'

/** 组件属性定义 */
const props = defineProps<{
  /** 是否显示覆盖层 */
  visible: boolean
  /** 积分结算结果 */
  result: PvpScoreResult | null
  /** 是否胜利 */
  isVictory: boolean
  /** 胜场数 */
  wins: number
  /** 败场数 */
  losses: number
  /** 胜率（0-1 的小数） */
  winRate: number
}>()

/** 组件事件定义 */
defineEmits<{
  /** 关闭结算面板 */
  (e: 'close'): void
}>()

/**
 * 将胜率小数格式化为百分比字符串
 * 例如 0.6542 → "65.4%"
 */
const winRateText = computed(() => {
  return `${(props.winRate * 100).toFixed(1)}%`
})
</script>

<style scoped>
/* ═══ 覆盖层容器 ═══ */
.settlement-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 24px 20px;
}

/* ═══ Transition 过渡 ═══ */
.overlay-fade-enter-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ═══ 胜负标题 ═══ */
.settlement-overlay__result {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.05em;
}

.settlement-overlay__result--win {
  color: var(--accent-gold);
  text-shadow: 0 2px 12px rgba(245, 158, 11, 0.4);
}

.settlement-overlay__result--lose {
  color: var(--accent-red);
  text-shadow: 0 2px 12px rgba(255, 59, 48, 0.4);
}

/* ═══ 段位变化提示 ═══ */
.settlement-overlay__tier-change {
  font-size: var(--font-size-small, 14px);
  color: var(--text-muted);
  font-weight: 500;
}

/* ═══ 积分变化区块 ═══ */
.settlement-overlay__score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 320px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.score-block__label {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted);
  font-weight: 400;
}

.score-block__value {
  font-size: var(--font-size-base, 17px);
  font-weight: 600;
  color: var(--text-primary);
}

.score-block__value--up {
  color: var(--accent-green);
}

.score-block__value--down {
  color: var(--accent-red);
}

.score-block--change {
  flex: 0 0 auto;
}

/* ═══ 段位进度条 ═══ */
.settlement-overlay__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 320px;
}

.progress-track {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-panel-light);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #00b894, #00d2ff);
  transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.settlement-overlay__progress-hint {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted);
}

/* ═══ 战绩统计 ═══ */
.settlement-overlay__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  max-width: 320px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.stat-item__value {
  font-size: var(--font-size-section, 19px);
  font-weight: 700;
}

.stat-item__value--win {
  color: var(--accent-green);
}

.stat-item__value--lose {
  color: var(--accent-red);
}

.stat-item__value--rate {
  color: var(--accent-blue);
}

.stat-item__label {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted);
  font-weight: 400;
}

/* ═══ 返回按钮 ═══ */
.settlement-overlay__btn-back {
  width: 100%;
  max-width: 320px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: var(--accent-blue);
  color: var(--button-text);
  font-size: var(--font-size-base, 17px);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.15s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.3);
  margin-top: 4px;
}

.settlement-overlay__btn-back:hover {
  filter: brightness(1.1);
}

.settlement-overlay__btn-back:active {
  transform: scale(0.98);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .settlement-overlay { padding: 20px 16px; gap: 12px; }
  .settlement-overlay__result { font-size: 24px; }
  .settlement-overlay__score-row { max-width: 280px; padding: 10px 12px; }
  .settlement-overlay__progress { max-width: 280px; }
  .settlement-overlay__stats { max-width: 280px; gap: 16px; }
  .settlement-overlay__btn-back { max-width: 280px; }
}

@media (max-width: 375px) {
  .settlement-overlay { padding: 16px 12px; gap: 10px; border-radius: 12px; }
  .settlement-overlay__result { font-size: 20px; }
  .settlement-overlay__tier-change { font-size: var(--font-size-caption); }
  .settlement-overlay__score-row { max-width: 260px; padding: 8px 10px; gap: 10px; border-radius: 10px; }
  .score-block__label { font-size: 10px; }
  .score-block__value { font-size: var(--font-size-small); }
  .progress-track { height: 6px; }
  .settlement-overlay__progress-hint { font-size: 10px; }
  .settlement-overlay__stats { max-width: 260px; gap: 12px; }
  .stat-item__value { font-size: var(--font-size-base); }
  .stat-item__label { font-size: 10px; }
  .settlement-overlay__btn-back { max-width: 260px; padding: 10px; font-size: var(--font-size-small); border-radius: 8px; }
}
</style>
