<template>
  <div class="world-map-panel">
    <!-- 标题栏 -->
    <header class="map-header">
      <UiButton class="map-header__back" variant="ghost" size="sm" @click="emit('back')">
        <template #icon><ChevronLeft :size="18" :stroke-width="1.8" /></template>
        返回
      </UiButton>
      <h1 class="map-header__title">世界地图</h1>
      <UiBadge class="map-header__level-badge" tone="warning" size="sm">Lv.{{ characterLevel }}</UiBadge>
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
          <UiBadge class="area-card__status" :tone="areaStatusTone(getAreaStatus(area))" size="sm">
            {{ statusLabel(getAreaStatus(area)) }}
          </UiBadge>
        </div>

        <!-- 展开详情面板 -->
        <Transition name="area-detail">
          <div
            v-show="mapStore.expandedAreaId === area.id"
            class="area-detail"
          >
            <div class="area-detail__inner">
              <p class="area-detail__desc">{{ area.description }}</p>

              <!-- 怪物列表 -->
              <div class="area-detail__section">
                <h4 class="area-detail__section-title">怪物</h4>
                <div class="area-detail__tags">
                  <UiBadge
                    v-for="monster in area.monsters"
                    :key="monster.id"
                    class="area-detail__tag"
                    :tone="monsterBadgeTone(monster.type)"
                    size="sm"
                  >
                    {{ monster.name }} Lv.{{ monster.level }}
                  </UiBadge>
                </div>
              </div>

              <!-- 掉落列表 -->
              <div v-if="area.drops.length" class="area-detail__section">
                <h4 class="area-detail__section-title">掉落</h4>
                <div class="area-detail__tags">
                  <UiBadge
                    v-for="drop in area.drops"
                    :key="drop.itemId"
                    class="area-detail__tag"
                    :tone="rarityBadgeTone(drop.rarity)"
                    size="sm"
                  >
                    {{ drop.name }}
                  </UiBadge>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="area-detail__actions">
                <UiButton class="area-detail__btn" size="sm" @click.stop="handleEnterArea(area)">
                  进入探索
                </UiButton>
                <UiButton class="area-detail__btn" variant="secondary" size="sm" @click.stop="handleDungeon(area)">
                  副本
                </UiButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMapStore } from '../../stores/map'
import { useCharacterStore } from '../../stores/character'
import { useBattleStore } from '../../stores/battle'
import { createWildMonsterCombatant } from '../../api/map'
import { getActiveBattleSkills } from '../../config/skill_config'
import { calculateFullStats } from '../../utils/attributeCalculator'
import { professionToJobType } from '../../config/job_config'
import type { MapArea, AreaStatus } from '../../types/map'
import { ChevronLeft } from 'lucide-vue-next'
import { UiBadge, UiButton, type BadgeTone } from '../ui'

const emit = defineEmits<{
  /** 返回上一级 */
  back: []
  /** 打开副本面板 */
  openDungeon: [areaId: string]
}>()

const router = useRouter()
const mapStore = useMapStore()
const characterStore = useCharacterStore()
const battleStore = useBattleStore()

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
 * 获取地图区域状态对应的徽标色调。
 * @param status - 区域解锁状态
 * @returns 通用徽标色调
 */
function areaStatusTone(status: AreaStatus): BadgeTone {
  const tones: Record<AreaStatus, BadgeTone> = {
    current: 'warning',
    unlocked: 'success',
    locked: 'neutral',
    undiscovered: 'neutral'
  }
  return tones[status]
}

/**
 * 获取怪物类型对应的徽标色调。
 * @param type - 怪物类型
 * @returns 通用徽标色调
 */
function monsterBadgeTone(type: string): BadgeTone {
  if (type === 'elite') return 'epic'
  if (type === 'boss') return 'warning'
  return 'primary'
}

/**
 * 获取掉落品质对应的徽标色调。
 * @param rarity - 掉落品质
 * @returns 通用徽标色调
 */
function rarityBadgeTone(rarity: string): BadgeTone {
  const tones: Record<string, BadgeTone> = {
    Rare: 'rare',
    Epic: 'epic',
    Legendary: 'legendary'
  }
  return tones[rarity] ?? 'neutral'
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
 * 随机遭遇区域怪物并启动战斗
 * @param area - 目标区域
 */
async function handleEnterArea(area: MapArea): Promise<void> {
  const characterId = characterStore.selectedCharacterId
  const charDetail = characterStore.characterDetail
  if (!characterId || !charDetail) {
    showToast('请先选择角色', 'error')
    return
  }

  // 随机选择一只区域怪物
  const monsters = area.monsters
  const chosen = monsters[Math.floor(Math.random() * monsters.length)]
  const enemy = createWildMonsterCombatant(chosen)

  // 获取角色技能
  const jobType = professionToJobType(charDetail.profession)
  const skills = getActiveBattleSkills(jobType, charDetail.level)

  // 构造角色完整属性
  const attrs = {
    strength: charDetail.strength,
    intelligence: charDetail.intelligence,
    agility: charDetail.agility
  }
  const statsBreakdown = calculateFullStats(
    attrs,
    charDetail.profession,
    charDetail.equipment,
    null
  )

  const result = await battleStore.startWildBattle(
    characterId,
    charDetail.characterName,
    statsBreakdown,
    skills,
    enemy
  )

  if (result.success) {
    router.push({ name: 'battle' })
  } else {
    showToast(result.message, 'error')
  }
}

/**
 * 处理"副本"按钮点击
 * @param area - 目标区域
 */
function handleDungeon(area: MapArea): void {
  emit('openDungeon', area.id)
}
</script>

<style scoped>
/* ── 面板容器 ── */
.world-map-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── 标题栏 ── */
.map-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.map-header__back {
  color: var(--accent-blue);
}

.map-header__title {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.015em;
  margin: 0;
}

.map-header__level-badge {
  letter-spacing: 0.02em;
}

/* ── 区域列表 ── */
.map-area-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}

.map-area-list::-webkit-scrollbar {
  width: 4px;
}

.map-area-list::-webkit-scrollbar-track {
  background: transparent;
}

.map-area-list::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 2px;
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
  flex-shrink: 0;
}

.area-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

/* ── 卡片状态：当前区域 ── */
.area-card--current {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-elevated);
  cursor: pointer;
}

.area-card--current:hover {
  box-shadow: var(--shadow-float);
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
  border-color: var(--border-light);
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
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
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

/* ── 展开详情面板 ── */
.area-detail {
  border-top: 1px solid var(--border-light);
}

.area-detail__inner {
  padding: 14px 16px 16px;
}

.area-detail__desc {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

/* ── 详情分节 ── */
.area-detail__section {
  margin-bottom: 12px;
}

.area-detail__section-title {
  font-family: var(--font-text);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  margin: 0 0 6px;
  letter-spacing: 0.15rem;
  text-transform: uppercase;
}

/* ── 标签列表 ── */
.area-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.area-detail__tag {
  line-height: 1.2;
}

/* ── 操作按钮 ── */
.area-detail__actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.area-detail__btn {
  min-width: 96px;
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

/* ── 响应式 ── */
@media (max-width: 720px) {
  .area-card__inner {
    padding: 10px 12px;
  }

  .area-detail__inner {
    padding: 10px 12px;
  }

  .area-detail__actions {
    flex-direction: column;
  }

  .area-detail__btn {
    width: 100%;
  }
}
</style>
