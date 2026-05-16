<template>
  <div class="damage-breakdown-panel" v-if="visible">
    <div class="panel-header">
      <span class="panel-title">伤害计算明细</span>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="formula-section">
      <div class="formula-title">伤害公式链</div>
      <div class="formula-step" v-for="(step, i) in formulaSteps" :key="i">
        <span class="step-num">{{ i + 1 }}</span>
        <span class="step-text">{{ step }}</span>
      </div>
    </div>
    <div class="element-section">
      <div class="formula-title">元素克制</div>
      <div class="element-chart">
        <span class="elem" v-for="e in elementChain" :key="e.name" :style="{ color: e.color }">
          {{ e.name }} →
        </span>
      </div>
      <div class="element-chart">
        <span class="elem" style="color: #eab308">光 ↔ 暗</span>
      </div>
      <div class="element-bonus">
        <span>克制伤害 ×1.3</span>
        <span>被克制 ×0.7</span>
      </div>
    </div>
    <div class="stats-section">
      <div class="formula-title">关键参数</div>
      <div class="stat-row"><span>暴击倍率</span><span>×1.5</span></div>
      <div class="stat-row"><span>暴击率上限</span><span>80%</span></div>
      <div class="stat-row"><span>闪避率上限</span><span>80%</span></div>
      <div class="stat-row"><span>伤害波动</span><span>±10%</span></div>
      <div class="stat-row"><span>防御有效系数</span><span>50%</span></div>
      <div class="stat-row"><span>最低伤害</span><span>1</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DAMAGE_FORMULA_TEXT } from '../../utils/damageCalculator'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  close: []
}>()

const formulaSteps = [
  DAMAGE_FORMULA_TEXT.base,
  DAMAGE_FORMULA_TEXT.variance,
  DAMAGE_FORMULA_TEXT.element,
  DAMAGE_FORMULA_TEXT.crit,
  DAMAGE_FORMULA_TEXT.dodge
]

const elementChain = [
  { name: '火', color: '#ff6b35' },
  { name: '风', color: '#22c55e' },
  { name: '地', color: '#a16207' },
  { name: '水', color: '#3b82f6' },
  { name: '火', color: '#ff6b35' }
]
</script>

<style scoped>
.damage-breakdown-panel {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  max-width: 480px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover { background: rgba(0, 0, 0, 0.06); }

.formula-section, .element-section, .stats-section {
  margin-bottom: 16px;
}

.formula-title {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.formula-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  line-height: 1.4;
}

.step-num {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-blue);
  color: var(--button-text);
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.element-chart {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: var(--font-size-small);
  font-weight: 500;
}

.elem { white-space: nowrap; }

.element-bonus {
  display: flex;
  gap: 16px;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.stat-row span:last-child {
  font-weight: 600;
  color: var(--accent-blue);
}

/* ── 深色模式 ── */
[data-theme='dark'] .close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .stat-row {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .damage-breakdown-panel { padding: 12px 16px; max-width: 360px; }
  .panel-title { font-size: var(--font-size-small); }
  .formula-title { font-size: 10px; }
  .formula-step { font-size: 11px; }
}

@media (max-width: 375px) {
  .damage-breakdown-panel { padding: 10px 12px; max-width: 320px; border-radius: 12px; }
  .panel-header { margin-bottom: 10px; }
  .panel-title { font-size: var(--font-size-caption); }
  .close-btn { width: 20px; height: 20px; font-size: 14px; }
  .formula-section, .element-section, .stats-section { margin-bottom: 10px; }
  .formula-title { font-size: 9px; margin-bottom: 4px; }
  .formula-step { padding: 2px 0; font-size: 10px; gap: 4px; }
  .step-num { width: 14px; height: 14px; font-size: 9px; }
  .element-chart { font-size: var(--font-size-caption); gap: 2px; margin-bottom: 4px; }
  .element-bonus { font-size: 10px; gap: 8px; }
  .stat-row { padding: 2px 0; font-size: 10px; }
}
</style>
