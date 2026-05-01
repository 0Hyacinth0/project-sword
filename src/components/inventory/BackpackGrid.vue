<!--
  BackpackGrid.vue
  背包物品网格组件
  渲染物品格子：图标 + 稀有度边框 + 品质底纹 + 数量角标 + 悬浮提示
-->
<template>
  <div class="backpack-grid">
    <!-- 有物品的格子 -->
    <div
      v-for="entry in items"
      :key="entry.id"
      class="backpack-wrapper"
      @click="$emit('clickItem', entry)"
    >
      <!-- 悬浮提示（在外层，不受 overflow 影响） -->
      <div class="backpack-cell__tooltip">
        <span class="backpack-cell__tooltip-name" :style="{ color: getRarityColor(entry.item.rarity) }">
          {{ entry.item.name }}
        </span>
        <span class="backpack-cell__tooltip-rarity">
          {{ getRarityLabel(entry.item.rarity) }} · {{ getCategoryLabel(entry.item.category) }}
        </span>
      </div>
      <!-- 格子本体（内层，overflow: hidden 裁剪光效） -->
      <div
        class="backpack-cell backpack-cell--item"
        :style="cellStyle(entry.item.rarity)"
      >
        <span class="backpack-cell__icon">
          <component
            :is="getCategoryIcon(entry.item.category)"
            :size="22"
            :style="{ color: getRarityColor(entry.item.rarity) }"
          />
        </span>
        <span v-if="entry.quantity > 1" class="backpack-cell__count">
          {{ entry.quantity > 99 ? '99+' : entry.quantity }}
        </span>
      </div>
    </div>

    <!-- 空格子补齐 -->
    <div
      v-for="i in emptySlots"
      :key="'empty-' + i"
      class="backpack-cell backpack-cell--empty"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryItem, ItemRarity } from '../../types/item'
import { getRarityColor, getRarityLabel, getCategoryIcon, getCategoryLabel, RARITY_COLORS } from '../../config/item_config'

/**
 * 背包物品网格组件
 * @param items - 当前过滤后的背包物品列表
 * @emits clickItem - 点击物品格子
 */

interface Props {
  items: InventoryItem[]
}

interface Emits {
  (e: 'clickItem', item: InventoryItem): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const TOTAL_SLOTS = 50

const emptySlots = computed(() => Math.max(0, TOTAL_SLOTS - props.items.length))

/**
 * 根据稀有度生成格子样式
 */
function cellStyle(rarity: ItemRarity) {
  const color = RARITY_COLORS[rarity]?.light || '#6e6e73'
  return {
    borderColor: color,
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    '--glow-color': color
  } as Record<string, string>
}
</script>

<style scoped>
.backpack-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  flex: 1;
  align-content: start;
}

/* ── 格子包裹层（定位 tooltip）── */
.backpack-wrapper {
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
}

.backpack-wrapper:hover .backpack-cell {
  transform: scale(1.08);
}

.backpack-wrapper:active .backpack-cell {
  transform: scale(0.95);
}

/* ── 格子本体 ── */
.backpack-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s ease;
}

/* ── 空格子 ── */
.backpack-cell--empty {
  border: 1px solid var(--border-light, rgba(0, 0, 0, 0.06));
  opacity: 0.3;
  cursor: default;
  aspect-ratio: 1;
  border-radius: 8px;
}

/* ── 物品格子（overflow: hidden 裁剪光效）── */
.backpack-cell--item {
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
}

/* 图标层（在光效之上） */
.backpack-cell__icon {
  position: relative;
  z-index: 2;
}

/* ── 品质扫光效果 ── */
.backpack-cell--item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
  transform: skewX(-15deg);
}

.backpack-wrapper:hover .backpack-cell--item::after {
  animation: sweep-glow 1.2s ease-in-out;
}

/* ── 数量角标 ── */
.backpack-cell__count {
  position: absolute;
  right: 3px;
  bottom: 2px;
  font-size: var(--font-size-caption, 11px);
  font-weight: 600;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-variant-numeric: tabular-nums;
  z-index: 3;
}

[data-theme='dark'] .backpack-cell__count {
  background: rgba(255, 255, 255, 0.5);
  color: #000;
}

/* ── 悬浮提示（在外层，不受 overflow 影响）── */
.backpack-cell__tooltip {
  display: none;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  z-index: 100;
  min-width: 100px;
  max-width: 200px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(12px);
  color: #fff;
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
}

.backpack-wrapper:hover .backpack-cell__tooltip {
  display: block;
}

.backpack-cell__tooltip-name {
  display: block;
  font-size: var(--font-size-label, 13px);
  font-weight: 600;
  margin-bottom: 2px;
}

.backpack-cell__tooltip-rarity {
  display: block;
  font-size: var(--font-size-caption, 11px);
  color: rgba(255, 255, 255, 0.6);
}

/* ── 扫光动画：从右上划到左下 ── */
@keyframes sweep-glow {
  0% {
    left: -100%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: 160%;
    opacity: 0;
  }
}
</style>