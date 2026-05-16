<template>
  <Transition name="overlay-fade">
    <div v-if="visible" class="pvp-overlay">
      <!-- ═══ 搜索中状态 ═══ -->
      <template v-if="state === 'searching'">
        <div class="pvp-overlay__search">
          <!-- 顶部图标 + 脉冲动画 -->
          <span class="pvp-overlay__sword-icon">⚔️</span>

          <span class="pvp-overlay__title">正在寻找对手...</span>
          <span class="pvp-overlay__subtitle">预计等待 5-15 秒</span>

          <!-- 旋转圆环 -->
          <div class="pvp-overlay__spinner"></div>

          <!-- 预览行：自己 + VS + ??? -->
          <div class="pvp-overlay__preview">
            <div class="pvp-overlay__preview-self">
              <span class="preview-self__icon">{{ myTierIcon }}</span>
              <span class="preview-self__name">我的角色</span>
            </div>
            <span class="pvp-overlay__preview-vs">VS</span>
            <div class="pvp-overlay__preview-unknown">
              <span class="preview-unknown__text">???</span>
            </div>
          </div>

          <!-- 取消按钮 -->
          <button class="pvp-overlay__btn-cancel" @click="$emit('cancel')">
            取消匹配
          </button>
        </div>
      </template>

      <!-- ═══ 找到对手状态 ═══ -->
      <template v-if="(state === 'found' || state === 'ready') && opponent">
        <div class="pvp-overlay__found">
          <!-- 金色徽章 -->
          <div class="pvp-overlay__found-badge">
            <span class="found-badge__icon">🎯</span>
            <span class="found-badge__text">对手已找到！</span>
          </div>

          <!-- VS 对比区域 -->
          <div class="pvp-overlay__compare">
            <!-- 自己的卡片 -->
            <div class="compare-card" :style="selfCardStyle">
              <span class="compare-card__tier-icon">{{ myTierIcon }}</span>
              <span class="compare-card__name">我的角色</span>
              <span class="compare-card__tier-name">{{ myTierName }}</span>
              <span class="compare-card__detail">Lv.{{ myLevel }} · {{ myScore }}分</span>
            </div>

            <!-- VS 分隔 -->
            <span class="pvp-overlay__compare-vs">VS</span>

            <!-- 对手卡片 -->
            <div class="compare-card" :style="opponentCardStyle">
              <span class="compare-card__tier-icon">{{ opponentTierIcon }}</span>
              <span class="compare-card__name">{{ opponent.characterName }}</span>
              <span class="compare-card__tier-name">{{ opponentTierName }}</span>
              <span class="compare-card__detail">Lv.{{ opponent.level }} · {{ opponent.score }}分</span>
            </div>
          </div>

          <!-- 预计积分 -->
          <div v-if="estimated" class="pvp-overlay__estimate">
            <span class="estimate__win">胜利 +{{ estimated.win }}</span>
            <span class="estimate__sep">·</span>
            <span class="estimate__lose">失败 -{{ estimated.lose }}</span>
          </div>

          <!-- 操作按钮 -->
          <div class="pvp-overlay__actions">
            <button class="pvp-overlay__btn-start" @click="$emit('start-battle')">
              开始战斗
            </button>
            <button class="pvp-overlay__btn-abandon" @click="$emit('cancel')">
              放弃匹配
            </button>
          </div>
        </div>
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArenaStore } from '../../stores/arena'
import { getTierConfig } from '../../config/arena_config'
import type { PvpMatchState, PvpOpponent, EstimatedScore } from '../../types/pvp'

/** 组件属性定义 */
const props = defineProps<{
  /** 是否显示覆盖层 */
  visible: boolean
  /** 匹配状态 */
  state: PvpMatchState
  /** 对手信息（找到对手后不为空） */
  opponent: PvpOpponent | null
  /** 预计积分变化 */
  estimated: EstimatedScore | null
}>()

/** 组件事件定义 */
defineEmits<{
  /** 取消匹配 */
  (e: 'cancel'): void
  /** 开始战斗 */
  (e: 'start-battle'): void
}>()

const arenaStore = useArenaStore()

/**
 * 获取自己的段位配置
 * 从竞技场 store 获取玩家段位数据
 */
const selfTierConfig = computed(() => {
  if (!arenaStore.playerData) return getTierConfig('bronze')
  return getTierConfig(arenaStore.playerData.tier)
})

/** 自己的段位图标 */
const myTierIcon = computed(() => selfTierConfig.value.icon)

/** 自己的段位名称 */
const myTierName = computed(() => selfTierConfig.value.name)

/** 自己的段位颜色 */
const myTierColor = computed(() => selfTierConfig.value.color)

/** 自己的积分 */
const myScore = computed(() => arenaStore.playerData?.score ?? 0)

/** 自己的等级（固定30） */
const myLevel = 30

/**
 * 获取对手的段位配置
 * 从 props.opponent 获取对手段位信息
 */
const opponentTierConfig = computed(() => {
  if (!props.opponent) return getTierConfig('bronze')
  return getTierConfig(props.opponent.tier)
})

/** 对手的段位图标 */
const opponentTierIcon = computed(() => opponentTierConfig.value.icon)

/** 对手的段位名称 */
const opponentTierName = computed(() => opponentTierConfig.value.name)

/** 对手的段位颜色 */
const opponentTierColor = computed(() => opponentTierConfig.value.color)

/**
 * 自己的卡片背景样式
 * 使用段位颜色生成渐变背景
 */
const selfCardStyle = computed(() => {
  const color = myTierColor.value
  return {
    background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
    borderColor: `${color}50`
  }
})

/**
 * 对手的卡片背景样式
 * 使用对手段位颜色生成渐变背景
 */
const opponentCardStyle = computed(() => {
  const color = opponentTierColor.value
  return {
    background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
    borderColor: `${color}50`
  }
})
</script>

<style scoped>
/* ═══ 覆盖层容器 ═══ */
.pvp-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 20px;
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

/* ═══ 搜索中状态 ═══ */
.pvp-overlay__search {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.pvp-overlay__sword-icon {
  font-size: 40px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.8; }
}

.pvp-overlay__title {
  font-size: var(--font-size-section, 19px);
  font-weight: 600;
  color: var(--text-primary);
}

.pvp-overlay__subtitle {
  font-size: var(--font-size-small, 14px);
  color: var(--text-muted);
}

/* 旋转圆环 */
.pvp-overlay__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 4px 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 预览行 */
.pvp-overlay__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  margin-top: 8px;
  padding: 12px 0;
}

.pvp-overlay__preview-self {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.preview-self__icon {
  font-size: 24px;
}

.preview-self__name {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-primary);
  font-weight: 500;
}

.pvp-overlay__preview-vs {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-red);
  letter-spacing: 0.05em;
}

.pvp-overlay__preview-unknown {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 80px;
  opacity: 0.4;
}

.preview-unknown__text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-muted);
}

/* 取消按钮 */
.pvp-overlay__btn-cancel {
  margin-top: 8px;
  padding: 8px 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pvp-overlay__btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: var(--text-primary);
}

.pvp-overlay__btn-cancel:active {
  transform: scale(0.97);
}

/* ═══ 找到对手状态 ═══ */
.pvp-overlay__found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

/* 金色徽章 */
.pvp-overlay__found-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 980px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.found-badge__icon {
  font-size: 16px;
}

.found-badge__text {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  color: var(--accent-gold);
}

/* VS 对比区域 */
.pvp-overlay__compare {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.compare-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: transform 0.2s ease;
}

.compare-card:active {
  transform: scale(0.98);
}

.compare-card__tier-icon {
  font-size: 28px;
  line-height: 1;
}

.compare-card__name {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
}

.compare-card__tier-name {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted);
  font-weight: 500;
}

.compare-card__detail {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted);
}

.pvp-overlay__compare-vs {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent-red);
  letter-spacing: 0.05em;
  flex-shrink: 0;
  text-shadow: 0 0 12px rgba(255, 59, 48, 0.4);
}

/* 预计积分 */
.pvp-overlay__estimate {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
}

.estimate__win {
  color: var(--accent-green);
}

.estimate__sep {
  color: var(--text-muted);
}

.estimate__lose {
  color: var(--accent-red);
}

/* 操作按钮区 */
.pvp-overlay__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.pvp-overlay__btn-start {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-blue) 0%, #7c5cfc 100%);
  color: #fff;
  font-size: var(--font-size-base, 17px);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.15s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.3);
}

.pvp-overlay__btn-start:hover {
  filter: brightness(1.1);
}

.pvp-overlay__btn-start:active {
  transform: scale(0.98);
}

.pvp-overlay__btn-abandon {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-xs, 12px);
  font-weight: 400;
  cursor: pointer;
  transition: color 0.2s ease;
}

.pvp-overlay__btn-abandon:hover {
  color: var(--text-primary);
}
</style>