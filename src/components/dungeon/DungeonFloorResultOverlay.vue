<template>
  <UiModal
    :model-value="visible"
    :title="overlayTitle"
    :variant="outcome === 'defeat' ? 'danger' : 'default'"
    :close-on-backdrop="false"
  >
    <template #icon>
      <div class="floor-overlay__badges">
        <UiBadge :tone="overlayBadgeTone">{{ overlayBadgeLabel }}</UiBadge>
        <UiBadge v-if="isElite" tone="epic">精英</UiBadge>
      </div>
    </template>

    <!-- 战败提示 -->
    <div class="floor-overlay__defeat-msg" v-if="outcome === 'defeat'">
      <p>很遗憾，战斗失败了</p>
      <p class="defeat-sub">已累积的奖励将保留</p>
    </div>

    <!-- 本层奖励（仅胜利时显示） -->
    <div class="floor-overlay__section" v-if="outcome === 'victory' && floorRewards">
      <h3 class="floor-overlay__section-title">本层奖励</h3>
      <div class="floor-overlay__rewards">
        <UiBadge class="reward-item" tone="success" size="sm">+{{ floorRewards.exp }} EXP</UiBadge>
        <UiBadge class="reward-item" tone="warning" size="sm">+{{ floorRewards.gold }} G</UiBadge>
        <UiBadge
          v-for="item in floorRewards.items"
          :key="item.itemId"
          class="reward-item"
          :class="{ 'reward-item--pet-egg': item.itemType === 'pet_egg' }"
          :tone="item.itemType === 'pet_egg' ? 'warning' : rewardItemTone(item.quality)"
          size="sm"
        >
          {{ item.itemType === 'pet_egg' ? '蛋 ' : '' }}{{ item.name }} ×{{ item.quantity }}
        </UiBadge>
      </div>
    </div>

    <!-- 累积奖励 -->
    <div class="floor-overlay__section" v-if="accumulatedRewards && (accumulatedRewards.exp > 0 || accumulatedRewards.gold > 0 || accumulatedRewards.items.length > 0)">
      <h3 class="floor-overlay__section-title">累计奖励</h3>
      <div class="floor-overlay__rewards">
        <UiBadge class="reward-item" tone="success" size="sm">{{ accumulatedRewards.exp }} EXP</UiBadge>
        <UiBadge class="reward-item" tone="warning" size="sm">{{ accumulatedRewards.gold }} G</UiBadge>
        <UiBadge class="reward-item" size="sm">{{ accumulatedRewards.items.length }} 件物品</UiBadge>
      </div>
    </div>

    <!-- 多人副本成员掉落分配 -->
    <div class="floor-overlay__section" v-if="memberDrops && memberDrops.length > 0">
      <h3 class="floor-overlay__section-title">团队成员掉落</h3>
      <div class="member-drops">
        <div v-for="member in memberDrops" :key="member.characterId" class="member-drop-row">
          <span class="member-drop-name">{{ member.characterName }}</span>
          <div class="member-drop-items" v-if="member.drops.length > 0">
            <UiBadge
              v-for="item in member.drops"
              :key="item.itemId"
              class="reward-item"
              :tone="rewardItemTone(item.quality)"
              size="sm"
            >
              {{ item.name }} ×{{ item.quantity }}
            </UiBadge>
          </div>
          <span v-else class="member-drop-empty">未获得物品</span>
        </div>
      </div>
    </div>

    <template #footer>
      <!-- 战败：只有领取奖励按钮 -->
      <template v-if="outcome === 'defeat'">
        <UiButton variant="danger" block @click="emit('retreat')">领取奖励并退出</UiButton>
      </template>
      <!-- 通关最后一层：领取奖励 -->
      <template v-else-if="isLastFloor">
        <UiButton block @click="emit('retreat')">领取奖励</UiButton>
      </template>
      <!-- 楼层胜利：继续或撤退 -->
      <template v-else>
        <UiButton block @click="emit('continue')">继续下一层</UiButton>
        <UiButton variant="secondary" block @click="emit('retreat')">撤退</UiButton>
      </template>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BattleRewards, BattleRewardItem } from '../../types/battle'
import type { MemberDropDistribution } from '../../types/dungeon'
import { UiBadge, UiButton, UiModal, type BadgeTone } from '../ui'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 当前楼层 */
  floorNumber: number
  /** 总层数 */
  totalFloors: number
  /** 是否为最后一层 */
  isLastFloor: boolean
  /** 本层战斗结果 */
  outcome: 'victory' | 'defeat'
  /** 本层奖励 */
  floorRewards: BattleRewards | null
  /** 累积奖励 */
  accumulatedRewards: BattleRewards | null
  /** 是否为精英副本 */
  isElite?: boolean
  /** 多人副本成员掉落分配 */
  memberDrops?: MemberDropDistribution[]
}>()

const emit = defineEmits<{
  /** 继续下一层 */
  continue: []
  /** 撤退/领取奖励 */
  retreat: []
}>()

/** 弹窗标题文本 */
const overlayTitle = computed(() => {
  if (props.outcome === 'defeat') return `第 ${props.floorNumber} 层战败`
  if (props.isLastFloor) return '副本通关！'
  return `第 ${props.floorNumber}/${props.totalFloors} 层完成`
})

/** 当前结果徽标文本 */
const overlayBadgeLabel = computed(() => {
  if (props.outcome === 'defeat') return '失败'
  if (props.isLastFloor) return '通关'
  return `第 ${props.floorNumber} 层`
})

/** 当前结果徽标色调 */
const overlayBadgeTone = computed<BadgeTone>(() => {
  if (props.outcome === 'defeat') return 'danger'
  if (props.isLastFloor) return 'warning'
  return 'primary'
})

/**
 * 获取奖励物品对应的徽标色调。
 * @param quality - 奖励品质
 * @returns 通用徽标色调
 */
function rewardItemTone(quality: BattleRewardItem['quality']): BadgeTone {
  const tones: Record<string, BadgeTone> = {
    rare: 'rare',
    epic: 'epic',
    legendary: 'legendary'
  }
  return quality ? tones[quality] ?? 'neutral' : 'neutral'
}
</script>

<style scoped>
.floor-overlay__badges {
  display: inline-flex;
  gap: 6px;
}

/* ── 战败提示 ── */
.floor-overlay__defeat-msg {
  margin-bottom: 16px;
  color: var(--text-muted);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

.floor-overlay__defeat-msg p {
  margin: 0;
}

.defeat-sub {
  opacity: 0.7;
  font-size: var(--font-size-caption);
}

/* ── 分节 ── */
.floor-overlay__section {
  margin-bottom: 16px;
  text-align: left;
}

.floor-overlay__section-title {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 6px;
}

.floor-overlay__rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* ── 奖励标签 ── */
.reward-item {
  font-weight: 500;
}

.reward-item--pet-egg {
  border: 1px solid currentColor;
  font-weight: 600;
}

/* ── 多人掉落分配 ── */
.member-drops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-drop-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--bg-panel-light);
}

.member-drop-name {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-primary);
}

.member-drop-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.member-drop-empty {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  opacity: 0.6;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .floor-overlay__rewards { gap: 4px; }
  .member-drop-row { padding: 4px 6px; }
}

@media (max-width: 375px) {
  .floor-overlay__badges { gap: 4px; }
  .floor-overlay__defeat-msg { margin-bottom: 10px; font-size: var(--font-size-caption); }
  .defeat-sub { font-size: 10px; }
  .floor-overlay__section { margin-bottom: 10px; }
  .floor-overlay__section-title { font-size: 10px; margin-bottom: 4px; }
  .floor-overlay__rewards { gap: 3px; }
  .reward-item { font-size: 11px; }
  .member-drops { gap: 6px; }
  .member-drop-row { padding: 3px 4px; border-radius: 6px; }
  .member-drop-name { font-size: 10px; }
  .member-drop-items { gap: 3px; }
  .member-drop-empty { font-size: 10px; }
}
</style>
