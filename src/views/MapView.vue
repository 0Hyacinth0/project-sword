<template>
  <div class="map-page">
    <!-- 页面标题栏 -->
    <header class="map-header">
      <button class="map-header__back" @click="router.back()">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>返回</span>
      </button>
      <h1 class="map-header__title">世界地图</h1>
      <span class="map-header__level-badge">Lv.{{ characterLevel }}</span>
    </header>

    <!-- 区域列表 -->
    <div class="map-area-list">
      <div
        v-for="area in mapStore.areas"
        :key="area.id"
        :class="[
          'area-card',
          `area-card--${getAreaStatus(area)}`,
          { 'area-card--expanded': mapStore.expandedAreaId === area.id }
        ]"
        @click="handleCardClick(area)"
      >
        <!-- 卡片主内容 -->
        <div class="area-card__inner">
          <div class="area-card__icon">{{ area.icon }}</div>
          <div class="area-card__info">
            <h3 class="area-card__name">{{ getAreaStatus(area) === 'undiscovered' ? '???' : area.name }}</h3>
            <span class="area-card__level-range">Lv.{{ area.levelRange[0] }}-{{ area.levelRange[1] }}</span>
          </div>
          <span :class="['area-card__status', `area-card__status--${getAreaStatus(area)}`]">
            {{ statusLabel(getAreaStatus(area)) }}
          </span>
        </div>

        <!-- 展开详情面板 -->
        <Transition name="area-detail">
          <div
            v-show="mapStore.expandedAreaId === area.id"
            class="area-detail"
          >
            <div class="area-detail__inner">
              <!-- 区域描述 -->
              <p class="area-detail__desc">{{ area.description }}</p>

              <!-- 怪物列表 -->
              <div class="area-detail__section">
                <h4 class="area-detail__section-title">怪物</h4>
                <div class="area-detail__tags">
                  <span
                    v-for="monster in area.monsters"
                    :key="monster.id"
                    :class="['area-detail__tag', 'area-detail__tag--monster', `area-detail__tag--${monster.type}`]"
                  >
                    {{ monster.name }} Lv.{{ monster.level }}
                  </span>
                </div>
              </div>

              <!-- 掉落列表 -->
              <div v-if="area.drops.length" class="area-detail__section">
                <h4 class="area-detail__section-title">掉落</h4>
                <div class="area-detail__tags">
                  <span
                    v-for="drop in area.drops"
                    :key="drop.itemId"
                    :class="['area-detail__tag', 'area-detail__tag--drop', `area-detail__tag--${drop.rarity}`]"
                  >
                    {{ drop.name }}
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="area-detail__actions">
                <button
                  class="area-detail__btn area-detail__btn--explore"
                  @click.stop="handleEnterArea(area)"
                >
                  进入探索
                </button>
                <button
                  class="area-detail__btn area-detail__btn--dungeon"
                  @click.stop="handleDungeon(area)"
                >
                  副本
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast-fade">
      <div v-if="toast.visible" :class="['toast', `toast--${toast.type}`]">
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMapStore } from '../stores/map'
import { useCharacterStore } from '../stores/character'
import { enterAreaApi } from '../api/map'
import type { MapArea, AreaStatus } from '../types/map'

const router = useRouter()
const mapStore = useMapStore()
const characterStore = useCharacterStore()

/** 角色等级 */
const characterLevel = computed(() => characterStore.characterDetail?.level ?? 1)

/** Toast 状态 */
const toast = reactive({
  visible: false,
  message: '',
  type: 'info' as 'success' | 'error' | 'info'
})

/** Toast 定时器 ID */
let toastTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 显示 toast 提示
 * @param message - 提示信息
 * @param type - 提示类型
 * @param duration - 显示时长（毫秒）
 */
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 2500): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.visible = true
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, duration)
}

/**
 * 获取指定区域的解锁状态
 * @param area - 地图区域
 * @returns 区域状态
 */
function getAreaStatus(area: MapArea): AreaStatus {
  return mapStore.getAreaStatus(area, characterLevel.value)
}

/**
 * 获取状态的中文标签
 * @param status - 区域状态
 * @returns 状态标签文本
 */
function statusLabel(status: AreaStatus): string {
  const labels: Record<AreaStatus, string> = {
    current: '当前',
    unlocked: '已解锁',
    locked: '未解锁',
    undiscovered: '未发现'
  }
  return labels[status]
}

/**
 * 处理区域卡片点击事件
 * 仅 current 或 unlocked 状态可展开/折叠
 * @param area - 被点击的区域
 */
function handleCardClick(area: MapArea): void {
  const status = getAreaStatus(area)
  if (status === 'current' || status === 'unlocked') {
    mapStore.toggleArea(area.id)
  }
}

/**
 * 处理"进入探索"按钮点击
 * 调用进入区域 API，成功后显示 toast 提示
 * @param area - 目标区域
 */
async function handleEnterArea(area: MapArea): Promise<void> {
  const characterId = characterStore.selectedCharacterId
  if (!characterId) {
    showToast('请先选择角色', 'error')
    return
  }
  try {
    const res = await enterAreaApi({ characterId, areaId: area.id })
    if (res.code === 200) {
      showToast(`即将进入${area.name}探索`, 'success')
    } else {
      showToast(res.message || '进入失败', 'error')
    }
  } catch {
    showToast('进入区域失败，请稍后重试', 'error')
  }
}

/**
 * 处理"副本"按钮点击
 * 当前阶段仅显示 toast 提示
 * @param _area - 目标区域（暂未使用）
 */
function handleDungeon(_area: MapArea): void {
  showToast('副本功能开发中', 'info')
}
</script>

<style scoped>
/* ── 页面容器 ── */
.map-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 28px 40px;
}

/* ── 标题栏 ── */
.map-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.map-header__back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--accent-blue);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.map-header__back:hover {
  filter: brightness(1.1);
}

.map-header__back:active {
  transform: scale(0.98);
}

.map-header__title {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.015em;
}

.map-header__level-badge {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--accent-gold);
  background: rgba(255, 149, 0, 0.1);
  padding: 4px 10px;
  border-radius: 980px;
  letter-spacing: 0.02em;
}

/* ── 区域列表 ── */
.map-area-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 区域卡片 ── */
.area-card {
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s, opacity 0.3s, filter 0.3s;
}

.area-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

/* ── 卡片状态：当前区域 ── */
.area-card--current {
  border-color: rgba(255, 149, 0, 0.4);
  box-shadow: 0 0 12px rgba(255, 149, 0, 0.15);
  cursor: pointer;
}

.area-card--current:hover {
  box-shadow: 0 0 18px rgba(255, 149, 0, 0.25);
}

/* ── 卡片状态：已解锁 ── */
.area-card--unlocked {
  cursor: pointer;
}

.area-card--unlocked:hover {
  filter: brightness(1.02);
  box-shadow: var(--shadow-elevated);
}

/* ── 卡片状态：未解锁 ── */
.area-card--locked {
  border-style: dashed;
  border-color: rgba(142, 142, 147, 0.3);
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── 卡片状态：未发现 ── */
.area-card--undiscovered {
  filter: blur(4px);
  opacity: 0.3;
  pointer-events: none;
}

/* ── 区域图标 ── */
.area-card__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 10px;
  background: var(--bg-panel-light);
  flex-shrink: 0;
}

/* ── 区域信息 ── */
.area-card__info {
  flex: 1;
  min-width: 0;
}

.area-card__name {
  font-family: var(--font-text);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.area-card__level-range {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

/* ── 状态标签 ── */
.area-card__status {
  font-size: var(--font-size-caption);
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.area-card__status--current {
  background: rgba(255, 149, 0, 0.12);
  color: var(--accent-gold);
}

.area-card__status--unlocked {
  background: rgba(52, 199, 89, 0.1);
  color: var(--accent-green);
}

.area-card__status--locked {
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
}

.area-card__status--undiscovered {
  background: rgba(142, 142, 147, 0.06);
  color: var(--text-muted);
}

/* ── 展开详情面板 ── */
.area-detail {
  border-top: 1px solid var(--border-light);
}

.area-detail__inner {
  padding: 16px 20px 20px;
}

.area-detail__desc {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin: 0 0 14px;
  line-height: 1.5;
}

/* ── 详情分节 ── */
.area-detail__section {
  margin-bottom: 14px;
}

.area-detail__section-title {
  font-family: var(--font-text);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  margin: 0 0 8px;
  letter-spacing: 0.15rem;
  text-transform: uppercase;
}

/* ── 标签列表 ── */
.area-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-detail__tag {
  font-size: var(--font-size-caption);
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  line-height: 1.2;
}

/* 怪物标签 - 普通类型 */
.area-detail__tag--monster.area-detail__tag--normal {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

/* 怪物标签 - 精英类型 */
.area-detail__tag--monster.area-detail__tag--elite {
  background: rgba(175, 82, 222, 0.12);
  color: #af52de;
}

/* 怪物标签 - Boss 类型 */
.area-detail__tag--monster.area-detail__tag--boss {
  background: rgba(255, 149, 0, 0.12);
  color: var(--accent-gold);
}

/* 掉落标签 - 稀有 */
.area-detail__tag--drop.area-detail__tag--Rare {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

/* 掉落标签 - 史诗 */
.area-detail__tag--drop.area-detail__tag--Epic {
  background: rgba(175, 82, 222, 0.12);
  color: #af52de;
}

/* 掉落标签 - 传说 */
.area-detail__tag--drop.area-detail__tag--Legendary {
  background: rgba(255, 149, 0, 0.12);
  color: var(--accent-gold);
}

/* ── 操作按钮 ── */
.area-detail__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.area-detail__btn {
  padding: 8px 18px;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.1s;
}

.area-detail__btn:hover {
  filter: brightness(1.1);
}

.area-detail__btn:active {
  transform: scale(0.98);
}

.area-detail__btn--explore {
  background: var(--accent-blue);
  color: var(--button-text);
}

.area-detail__btn--dungeon {
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

/* ── 展开动画 ── */
.area-detail-enter-active,
.area-detail-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.area-detail-enter-from,
.area-detail-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.area-detail-enter-to,
.area-detail-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* ── Toast 提示 ── */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 980px;
  font-size: var(--font-size-small);
  font-weight: 500;
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-elevated);
  z-index: 1000;
  white-space: nowrap;
}

.toast--success {
  background: rgba(52, 199, 89, 0.15);
  color: var(--accent-green);
}

.toast--error {
  background: rgba(255, 59, 48, 0.15);
  color: var(--accent-red);
}

.toast--info {
  background: rgba(0, 113, 227, 0.15);
  color: var(--accent-blue);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

/* ── 响应式 ── */
@media (max-width: 720px) {
  .map-page {
    padding: 12px;
  }

  .area-card__inner {
    padding: 12px;
  }

  .area-detail__inner {
    padding: 12px;
  }

  .area-detail__actions {
    flex-direction: column;
  }

  .area-detail__btn {
    width: 100%;
  }
}
</style>
