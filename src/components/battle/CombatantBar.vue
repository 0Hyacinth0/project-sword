<template>
  <div
    class="combatant-bar"
    :class="[side, { dead: !combatant.isAlive, active: isActive }, animClass]"
    @animationend="onAnimEnd"
  >
    <!-- 头部：图标 + 名称 + 等级 -->
    <div class="combatant-header">
      <div class="combatant-avatar" :class="combatant.type">
        <span class="avatar-icon">{{ typeIcon }}</span>
      </div>
      <div class="combatant-info">
        <div class="name-row">
          <span class="combatant-name">{{ combatant.name }}</span>
          <span v-if="level !== undefined && level > 0" class="combatant-level">Lv.{{ level }}</span>
          <span class="type-badge" :class="combatant.type">{{ typeLabel }}</span>
        </div>
        <div class="buff-row" v-if="combatant.buffs.length > 0">
          <span
            v-for="buff in combatant.buffs"
            :key="buff.uid"
            class="buff-tag"
            :class="{ debuff: buff.isDebuff }"
          >
            {{ buff.name }} {{ buff.remainingTurns }}
          </span>
        </div>
      </div>
    </div>

    <!-- HP 条 -->
    <div class="bar-wrapper">
      <span class="bar-label hp-label">HP</span>
      <div class="bar-track hp-track">
        <div
          class="bar-fill hp-fill"
          :class="hpColorClass"
          :style="{ width: hpPercent + '%' }"
        ></div>
        <span class="bar-text">{{ combatant.stats.hp }} / {{ combatant.stats.maxHp }}</span>
      </div>
    </div>

    <!-- MP 条 -->
    <div class="bar-wrapper" v-if="combatant.stats.maxMp > 0">
      <span class="bar-label mp-label">MP</span>
      <div class="bar-track mp-track">
        <div class="bar-fill mp-fill" :style="{ width: mpPercent + '%' }"></div>
        <span class="bar-text">{{ combatant.stats.mp }} / {{ combatant.stats.maxMp }}</span>
      </div>
    </div>

    <!-- 死亡遮罩 -->
    <div class="death-overlay" v-if="!combatant.isAlive">
      <span class="death-text">阵亡</span>
    </div>

    <!-- 浮动文字容器 -->
    <div class="fct-container">
      <div
        v-for="ft in myFloatingTexts"
        :key="ft.id"
        class="fct"
        :class="ft.type"
      >
        {{ ft.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Combatant } from '../../types/battle'
import { getUnitAnim, clearUnitAnim, getFloatingTexts } from '../../utils/battleAnimation'
import type { UnitAnimType } from '../../utils/battleAnimation'

const props = defineProps<{
  /** 参战单位数据 */
  combatant: Combatant
  /** 是否为当前行动者 */
  isActive: boolean
  /** 阵营（用于着色） */
  side: 'ally' | 'enemy'
  /** 等级（可选，用于展示） */
  level?: number
}>()

/** 类型图标 */
const typeIcon = computed(() => {
  switch (props.combatant.type) {
    case 'player': return '⚔'
    case 'pet': return '🐾'
    case 'enemy': return '👹'
  }
})

/** 类型标签文字 */
const typeLabel = computed(() => {
  switch (props.combatant.type) {
    case 'player': return '玩家'
    case 'pet': return '战宠'
    case 'enemy': return '怪物'
  }
})

/** HP 百分比 */
const hpPercent = computed(() => {
  if (props.combatant.stats.maxHp === 0) return 0
  return Math.max(0, Math.min(100, (props.combatant.stats.hp / props.combatant.stats.maxHp) * 100))
})

/** MP 百分比 */
const mpPercent = computed(() => {
  if (props.combatant.stats.maxMp === 0) return 0
  return Math.max(0, Math.min(100, (props.combatant.stats.mp / props.combatant.stats.maxMp) * 100))
})

/** HP 颜色等级 */
const hpColorClass = computed(() => {
  if (hpPercent.value < 25) return 'danger'
  if (hpPercent.value < 50) return 'warning'
  return 'normal'
})

// ── 动画系统 ──

/** 当前单位动画 class */
const animClass = ref('')

/** 监听动画状态变化 */
watch(() => getUnitAnim(props.combatant.uid), (anim: UnitAnimType | null) => {
  if (!anim) return
  animClass.value = anim
}, { immediate: true })

/** 动画结束回调 */
function onAnimEnd(): void {
  animClass.value = ''
  clearUnitAnim(props.combatant.uid)
}

/** 获取属于当前单位的浮动文字 */
const myFloatingTexts = computed(() => {
  return getFloatingTexts().filter(ft => ft.targetUid === props.combatant.uid)
})
</script>

<style scoped>
.combatant-bar {
  position: relative;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  transition: border-color 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth);
  overflow: visible;
}

/* 阵营区分 */
.combatant-bar.ally { border-left: 3px solid var(--accent-blue); }
.combatant-bar.enemy { border-left: 3px solid var(--accent-red); }

/* 当前行动者高亮 */
.combatant-bar.active {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-card), 0 0 12px rgba(0, 113, 227, 0.25);
}

.combatant-bar.active.enemy {
  border-color: var(--accent-red);
  box-shadow: var(--shadow-card), 0 0 12px rgba(255, 59, 48, 0.25);
}

/* 死亡态 */
.combatant-bar.dead {
  opacity: 0.5;
  filter: grayscale(0.6);
}

/* ── 单位动画 ── */

/* 攻击：向对方方向冲刺 */
.combatant-bar.attack {
  animation: anim-attack 0.3s var(--ease-spring);
}

.combatant-bar.attack.ally {
  animation: anim-attack-right 0.3s var(--ease-spring);
}

.combatant-bar.attack.enemy {
  animation: anim-attack-left 0.3s var(--ease-spring);
}

/* 受击：红色闪烁 + 轻微抖动 */
.combatant-bar.hit {
  animation: anim-hit 0.35s ease-out;
}

/* 暴击受击：更强烈的抖动 */
.combatant-bar.crit-hit {
  animation: anim-crit-hit 0.5s ease-out;
}

/* 治疗：绿色光晕 */
.combatant-bar.heal {
  animation: anim-heal 0.6s ease-out;
}

/* 闪避：短暂半透明 */
.combatant-bar.dodge {
  animation: anim-dodge 0.35s ease-out;
}

/* 死亡：淡出缩小 */
.combatant-bar.death {
  animation: anim-death 0.6s ease-out forwards;
}

/* Buff 应用：蓝色脉冲 */
.combatant-bar.buff-apply {
  animation: anim-buff 0.4s ease-out;
}

@keyframes anim-attack-right {
  0% { transform: translateX(0); }
  40% { transform: translateX(12px); }
  100% { transform: translateX(0); }
}

@keyframes anim-attack-left {
  0% { transform: translateX(0); }
  40% { transform: translateX(-12px); }
  100% { transform: translateX(0); }
}

@keyframes anim-hit {
  0% { background-color: rgba(255, 59, 48, 0.15); transform: translateX(0); }
  15% { transform: translateX(-4px); }
  30% { transform: translateX(4px); }
  45% { transform: translateX(-2px); }
  60% { transform: translateX(2px); }
  100% { background-color: transparent; transform: translateX(0); }
}

@keyframes anim-crit-hit {
  0% { background-color: rgba(245, 158, 11, 0.25); transform: translateX(0) scale(1); }
  10% { transform: translateX(-6px) scale(1.02); }
  25% { transform: translateX(6px) scale(0.98); }
  40% { transform: translateX(-4px) scale(1.01); }
  55% { transform: translateX(4px); }
  70% { transform: translateX(-2px); }
  100% { background-color: transparent; transform: translateX(0) scale(1); }
}

@keyframes anim-heal {
  0% { box-shadow: var(--shadow-card), 0 0 0 rgba(52, 199, 89, 0); }
  30% { box-shadow: var(--shadow-card), 0 0 16px rgba(52, 199, 89, 0.35); }
  100% { box-shadow: var(--shadow-card), 0 0 0 rgba(52, 199, 89, 0); }
}

@keyframes anim-dodge {
  0% { opacity: 1; }
  30% { opacity: 0.4; }
  100% { opacity: 1; }
}

@keyframes anim-death {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.97); }
  100% { opacity: 0.4; transform: scale(0.95); filter: grayscale(0.8); }
}

@keyframes anim-buff {
  0% { box-shadow: var(--shadow-card), 0 0 0 rgba(0, 113, 227, 0); }
  30% { box-shadow: var(--shadow-card), 0 0 12px rgba(0, 113, 227, 0.3); }
  100% { box-shadow: var(--shadow-card), 0 0 0 rgba(0, 113, 227, 0); }
}

/* ── 浮动文字 (FCT) ── */
.fct-container {
  position: absolute;
  top: -8px;
  right: 12px;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.fct {
  font-weight: 700;
  white-space: nowrap;
  animation: fct-up 1.2s ease-out forwards;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.fct.damage {
  font-size: 20px;
  color: var(--accent-red);
}

.fct.critical {
  font-size: 28px;
  color: var(--accent-gold);
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.5), 0 1px 3px rgba(0, 0, 0, 0.2);
}

.fct.heal {
  font-size: 20px;
  color: var(--accent-green);
}

.fct.dodge {
  font-size: 16px;
  color: var(--text-muted);
}

.fct.buff {
  font-size: 14px;
  color: var(--accent-blue);
  font-weight: 600;
}

@keyframes fct-up {
  0% { opacity: 0; transform: translateY(8px) scale(0.7); }
  12% { opacity: 1; transform: translateY(-4px) scale(1.15); }
  25% { transform: translateY(-12px) scale(1.0); }
  70% { opacity: 1; transform: translateY(-30px); }
  100% { opacity: 0; transform: translateY(-45px); }
}

/* ── 头部 ── */
.combatant-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.combatant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.combatant-avatar.player { background: rgba(0, 113, 227, 0.12); }
.combatant-avatar.pet { background: rgba(52, 199, 89, 0.12); }
.combatant-avatar.enemy { background: rgba(255, 59, 48, 0.12); }

.avatar-icon { font-size: 18px; }

.combatant-info { flex: 1; min-width: 0; }

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.combatant-name {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combatant-level {
  font-size: var(--font-size-caption);
  font-weight: 500;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.04);
  padding: 1px 6px;
  border-radius: 4px;
}

.type-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
}

.type-badge.player { background: rgba(0, 113, 227, 0.1); color: var(--accent-blue); }
.type-badge.pet { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
.type-badge.enemy { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }

/* ── Buff 标签 ── */
.buff-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.buff-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(52, 199, 89, 0.1);
  color: var(--accent-green);
  font-weight: 500;
  white-space: nowrap;
}

.buff-tag.debuff {
  background: rgba(255, 59, 48, 0.1);
  color: var(--accent-red);
}

/* ── HP/MP 条 ── */
.bar-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.bar-label {
  font-size: 10px;
  font-weight: 600;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.hp-label { color: var(--accent-red); }
.mp-label { color: var(--accent-blue); }

.bar-track {
  flex: 1;
  height: 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;
}

.hp-fill.normal { background: linear-gradient(90deg, #34c759, #32d74b); }
.hp-fill.warning { background: linear-gradient(90deg, #f59e0b, #ffd60a); }
.hp-fill.danger { background: linear-gradient(90deg, #ff3b30, #ff453a); }

.mp-fill { background: linear-gradient(90deg, #0071e3, #2997ff); }

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
  border-radius: 6px 6px 0 0;
}

.bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* ── 死亡遮罩 ── */
.death-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.death-text {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .combatant-bar { padding: 10px 12px; }
  .combatant-avatar { width: 30px; height: 30px; }
  .avatar-icon { font-size: 15px; }
  .bar-track { height: 12px; }
  .fct.damage { font-size: 16px; }
  .fct.critical { font-size: 22px; }
  .fct.heal { font-size: 16px; }
}

@media (max-width: 375px) {
  .combatant-bar { padding: 8px 10px; border-radius: 12px; }
  .combatant-avatar { width: 26px; height: 26px; border-radius: 8px; }
  .avatar-icon { font-size: 13px; }
  .combatant-name { font-size: var(--font-size-caption); }
  .combatant-level { font-size: 10px; padding: 1px 4px; }
  .type-badge { font-size: 9px; padding: 1px 4px; }
  .bar-track { height: 10px; border-radius: 4px; }
  .bar-label { width: 16px; font-size: 9px; }
  .bar-text { font-size: 9px; }
  .buff-tag { font-size: 9px; padding: 1px 4px; }
  .fct-container { top: -6px; right: 8px; }
  .fct.damage { font-size: 14px; }
  .fct.critical { font-size: 18px; }
  .fct.heal { font-size: 14px; }
}

/* ── 深色模式 ── */
[data-theme='dark'] .combatant-level {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .bar-track {
  background: rgba(255, 255, 255, 0.08);
}

[data-theme='dark'] .death-overlay {
  background: rgba(0, 0, 0, 0.15);
}
</style>
