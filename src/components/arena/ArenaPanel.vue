<template>
  <div class="arena-panel" style="position: relative">
    <!-- 加载态 -->
    <div v-if="store.loading" class="arena-panel__loading">
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>

    <!-- 无数据空态 -->
    <div v-else-if="!store.playerData" class="arena-panel__empty">
      <span class="arena-panel__empty-icon">⚔️</span>
      <span class="arena-panel__empty-text">暂无竞技场数据</span>
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 赛季头部 -->
      <div class="arena-panel__season">
        <span class="arena-panel__season-label">当前赛季</span>
        <span class="arena-panel__season-name">{{ store.seasonDisplayName }}</span>
        <span class="arena-panel__season-countdown">
          剩余 {{ store.daysRemaining }} 天 {{ remainingHours }} 小时
        </span>
      </div>

      <!-- 段位卡片 -->
      <div class="arena-panel__tier-card" :style="tierCardStyle">
        <span class="tier-card__icon">{{ currentTierConfig?.icon }}</span>
        <span class="tier-card__name">{{ store.tierInfo?.tierName }}</span>
        <span class="tier-card__score">{{ store.playerData.score }} 积分</span>
        <div class="tier-card__progress-wrap">
          <div class="tier-card__progress-bar" :style="progressBarStyle"></div>
        </div>
        <span class="tier-card__remaining">
          距下一级还需 {{ store.tierInfo?.remainingScore }} 积分
        </span>
      </div>

      <!-- 战绩统计 -->
      <div class="arena-panel__stats">
        <div class="stats-item">
          <span class="stats-item__label">胜场</span>
          <span class="stats-item__value stats-item__value--green">{{ store.playerData.wins }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-item__label">败场</span>
          <span class="stats-item__value stats-item__value--red">{{ store.playerData.losses }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-item__label">胜率</span>
          <span class="stats-item__value stats-item__value--blue">{{ winRateText }}</span>
        </div>
      </div>

      <!-- 段位列表 -->
      <div class="arena-panel__tier-list">
        <div
          v-for="item in tierList"
          :key="item.tier"
          :class="['tier-row', { 'tier-row--current': item.tier === store.playerData?.tier }]"
          :style="rowStyle(item)"
        >
          <span class="tier-row__icon">{{ item.icon }}</span>
          <span class="tier-row__name">{{ item.name }}</span>
          <span class="tier-row__range">{{ formatRange(item) }}</span>
          <span v-if="item.tier === store.playerData?.tier" class="tier-row__badge">当前</span>
        </div>
      </div>

      <!-- 匹配按钮 -->
      <button v-if="store.playerData" class="arena-panel__match-btn" @click="handleStartMatch">
        ⚔️ 开始匹配
      </button>
    </template>

    <PvpMatchOverlay
      :visible="pvpStore.isMatching"
      :state="pvpStore.matchState"
      :opponent="pvpStore.opponent"
      :estimated="pvpStore.estimatedScore"
      @cancel="handleCancelMatch"
      @start-battle="handleStartBattle"
    />

    <PvpSettlementOverlay
      :visible="pvpStore.matchState === 'settling'"
      :result="pvpStore.scoreResult"
      :is-victory="(pvpStore.scoreResult?.scoreChange ?? 0) > 0"
      :wins="store.playerData?.wins ?? 0"
      :losses="store.playerData?.losses ?? 0"
      :win-rate="store.playerData?.winRate ?? 0"
      @close="handleCloseSettlement"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useArenaStore } from '../../stores/arena'
import { usePvpStore } from '../../stores/pvp'
import { ARENA_TIER_CONFIGS } from '../../config/arena_config'
import PvpMatchOverlay from './PvpMatchOverlay.vue'
import PvpSettlementOverlay from './PvpSettlementOverlay.vue'
import type { ArenaTierConfig } from '../../types/arena'

const store = useArenaStore()
const pvpStore = usePvpStore()

const emit = defineEmits<{
  'battle-started': []
}>()

/**
 * 段位列表（从高到低：王者 → 青铜）
 * 将配置数组反转以便模板渲染
 */
const tierList = computed(() => [...ARENA_TIER_CONFIGS].reverse())

/**
 * 当前段位配置
 */
const currentTierConfig = computed(() => store.currentTierConfig)

/**
 * 段位卡片渐变背景样式
 * 使用当前段位颜色生成从色到透明的渐变
 */
const tierCardStyle = computed(() => {
  const color = currentTierConfig.value?.color ?? '#8b8b8b'
  return {
    background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
    borderColor: `${color}40`
  }
})

/**
 * 进度条填充样式
 * 宽度按段位进度百分比计算，使用渐变色
 */
const progressBarStyle = computed(() => {
  const progress = store.tierInfo?.progress ?? 0
  return {
    width: `${Math.round(progress * 100)}%`
  }
})

/**
 * 赛季剩余小时（取天数换算后的小时余数）
 */
const remainingHours = computed(() => {
  const hours = store.hoursRemaining
  return Math.floor(hours % 24)
})

/**
 * 胜率显示文本
 * 以百分比形式展示
 */
const winRateText = computed(() => {
  if (!store.playerData) return '0%'
  return `${(store.playerData.winRate * 100).toFixed(1)}%`
})

/**
 * 获取段位行样式（当前段位高亮背景）
 * @param item - 段位配置项
 * @returns 行内样式对象
 */
function rowStyle(item: ArenaTierConfig): Record<string, string> {
  if (item.tier !== store.playerData?.tier) return {}
  return {
    backgroundColor: `${item.color}18`
  }
}

/**
 * 格式化段位积分区间文本
 * @param item - 段位配置项
 * @returns 积分区间字符串
 */
function formatRange(item: ArenaTierConfig): string {
  if (item.maxScore === -1) return `${item.minScore}+`
  return `${item.minScore} - ${item.maxScore}`
}

/**
 * 开始匹配
 * 触发 PVP 匹配流程
 */
function handleStartMatch(): void {
  pvpStore.startMatchmaking()
}

/**
 * 取消匹配
 * 中止当前进行中的匹配流程
 */
function handleCancelMatch(): void {
  pvpStore.cancelMatchmaking()
}

/**
 * 确认开始战斗
 * 调用 PVP 确认接口，成功后触发 battle-started 事件
 */
async function handleStartBattle(): Promise<void> {
  const result = await pvpStore.confirmBattle()
  if (result.success) {
    emit('battle-started')
  }
}

/**
 * 关闭结算面板
 * 重置匹配状态，回到初始界面
 */
function handleCloseSettlement(): void {
  pvpStore.resetMatch()
}

onMounted(() => {
  store.fetchArenaData()
})
</script>

<style scoped>
.arena-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  gap: 14px;
  overflow-y: auto;
}

/* ── 加载态 ── */
.arena-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--text-muted);
  font-size: var(--font-size-caption);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-light);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 空态 ── */
.arena-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--text-muted);
}

.arena-panel__empty-icon {
  font-size: 32px;
}

.arena-panel__empty-text {
  font-size: var(--font-size-caption);
}

/* ── 赛季头部 ── */
.arena-panel__season {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.arena-panel__season-label {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  font-weight: 500;
}

.arena-panel__season-name {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 600;
}

.arena-panel__season-countdown {
  font-size: var(--font-size-xs);
  color: var(--accent-gold);
  margin-left: auto;
}

/* ── 段位卡片 ── */
.arena-panel__tier-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  gap: 6px;
  border: 1px solid transparent;
}

.tier-card__icon {
  font-size: 28px;
  line-height: 1;
}

.tier-card__name {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
}

.tier-card__score {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  font-weight: 500;
}

.tier-card__progress-wrap {
  width: 100%;
  height: 6px;
  background: var(--bg-panel-light);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.tier-card__progress-bar {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #00b894, #00d2ff);
  transition: width 0.4s ease;
}

.tier-card__remaining {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── 战绩统计 ── */
.arena-panel__stats {
  display: flex;
  gap: 8px;
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  background: var(--bg-panel-light);
  border-radius: 10px;
}

.stats-item__label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.stats-item__value {
  font-size: var(--font-size-base);
  font-weight: 700;
}

.stats-item__value--green {
  color: var(--accent-green);
}

.stats-item__value--red {
  color: var(--accent-red);
}

.stats-item__value--blue {
  color: var(--accent-blue);
}

/* ── 段位列表 ── */
.arena-panel__tier-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tier-row {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.tier-row--current {
  font-weight: 600;
}

.tier-row__icon {
  font-size: var(--font-size-small);
  width: 20px;
  text-align: center;
}

.tier-row__name {
  font-size: var(--font-size-caption);
  color: var(--text-primary);
  font-weight: inherit;
}

.tier-row__range {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-left: auto;
}

.tier-row__badge {
  font-size: var(--font-size-xs);
  color: var(--accent-gold);
  background: rgba(245, 158, 11, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

/* ── 匹配按钮 ── */
.arena-panel__match-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent-blue), #7c5cfc);
  color: white;
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.arena-panel__match-btn:hover {
  opacity: 0.9;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .arena-panel { padding: 10px; gap: 10px; }
  .arena-panel__tier-card { padding: 16px; }
  .tier-card__icon { font-size: 24px; }
  .stats-item { padding: 8px 0; }
}

@media (max-width: 375px) {
  .arena-panel { padding: 8px; gap: 8px; }
  .arena-panel__season { flex-direction: column; align-items: flex-start; gap: 4px; }
  .arena-panel__season-countdown { margin-left: 0; font-size: 11px; }
  .arena-panel__tier-card { padding: 12px; border-radius: 12px; }
  .tier-card__icon { font-size: 20px; }
  .tier-card__name { font-size: var(--font-size-small); }
  .tier-card__score { font-size: var(--font-size-caption); }
  .tier-card__remaining { font-size: 11px; }
  .arena-panel__stats { gap: 6px; }
  .stats-item { padding: 6px 0; }
  .stats-item__value { font-size: var(--font-size-small); }
  .stats-item__label { font-size: 11px; }
  .tier-row { padding: 4px 8px; gap: 6px; }
  .tier-row__name { font-size: 11px; }
  .tier-row__range { font-size: 10px; }
  .arena-panel__match-btn { padding: 10px; font-size: 11px; border-radius: 8px; }
}
</style>
