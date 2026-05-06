<!--
  BackpackGrid.vue
  背包物品网格组件
  渲染物品格子：图标 + 稀有度边框 + 品质底纹 + 品质角标 + 数量角标 + 悬浮提示
  史诗/传说品质有呼吸/脉动外发光效果
-->
<template>
  <div class="backpack-grid">
    <!-- 有物品的格子 -->
    <div
      v-for="entry in items"
      :key="entry.id"
      class="backpack-wrapper"
      :class="getWrapperGlowClass(entry.item.rarity)"
      @click="$emit('clickItem', entry)"
    >
      <!-- 悬浮提示（在外层，不受 overflow 影响） -->
      <div class="backpack-cell__tooltip">
        <span class="backpack-cell__tooltip-name" :style="{ color: getRarityColorVar(entry.item.rarity) }">
          {{ entry.item.name }}
        </span>
        <span class="backpack-cell__tooltip-rarity">
          {{ getRarityLabel(entry.item.rarity) }} · {{ getCategoryLabel(entry.item.category) }}
        </span>
      </div>
      <!-- 格子本体（内层，overflow: hidden 裁剪扫光） -->
      <div
        class="backpack-cell backpack-cell--item"
        :class="getRarityGlowClass(entry.item.rarity)"
        :style="cellStyle(entry.item.rarity)"
      >
        <span class="backpack-cell__icon">
          <component
            :is="getCategoryIcon(entry.item.category)"
            :size="22"
            :style="{ color: getRarityColorVar(entry.item.rarity) }"
          />
        </span>
        <!-- 品质角标 -->
        <span class="backpack-cell__rarity-tag" :style="{ background: getRarityColorVar(entry.item.rarity) }">
          {{ getRarityLabel(entry.item.rarity) }}
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
import { getRarityColorVar, getRarityLabel, getCategoryIcon, getCategoryLabel, RARITY_COLORS, RARITY_LEVEL } from '../../config/item_config'

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
 * 根据稀有度生成格子样式（使用 CSS 变量，自动适配暗色模式）
 */
function cellStyle(rarity: ItemRarity) {
  const cssVar = `var(${getRarityCSSVar(rarity)})`
  const color = RARITY_COLORS[rarity].light
  return {
    borderColor: cssVar,
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    '--glow-color': cssVar
  } as Record<string, string>
}

/**
 * 获取稀有度对应的 CSS 变量名
 */
function getRarityCSSVar(rarity: ItemRarity): string {
  const map: Record<ItemRarity, string> = {
    Normal: '--rarity-normal',
    Rare: '--rarity-rare',
    Epic: '--rarity-epic',
    Legendary: '--rarity-legendary'
  }
  return map[rarity]
}

/**
 * 根据稀有度等级返回格子内层光效 CSS 类名
 */
function getRarityGlowClass(rarity: ItemRarity): Record<string, boolean> {
  const level = RARITY_LEVEL[rarity]
  return {
    'backpack-cell--epic': level === 2,
    'backpack-cell--legendary': level === 3
  }
}

/**
 * 根据稀有度等级返回外层 wrapper 光效 CSS 类名（不受 overflow 裁剪）
 */
function getWrapperGlowClass(rarity: ItemRarity): Record<string, boolean> {
  const level = RARITY_LEVEL[rarity]
  return {
    'backpack-wrapper--epic': level === 2,
    'backpack-wrapper--legendary': level === 3
  }
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

/* ── 格子包裹层（定位 tooltip，承载外发光）── */
.backpack-wrapper {
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  border-radius: 10px;
}

.backpack-wrapper:hover .backpack-cell {
  transform: scale(1.08);
}

.backpack-wrapper:active .backpack-cell {
  transform: scale(0.95);
}

/* ── 史诗 wrapper：呼吸外发光 ── */
.backpack-wrapper--epic {
  animation: glow-breathe-epic 3s ease-in-out infinite;
}

[data-theme='dark'] .backpack-wrapper--epic {
  animation: glow-breathe-epic-dark 3s ease-in-out infinite;
}

/* ── 传说 wrapper：脉动外发光 ── */
.backpack-wrapper--legendary {
  animation: glow-pulse-legendary 2.5s ease-in-out infinite;
}

[data-theme='dark'] .backpack-wrapper--legendary {
  animation: glow-pulse-legendary-dark 2.5s ease-in-out infinite;
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

/* ── 物品格子（overflow: hidden 裁剪扫光）── */
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

/* ── 品质角标 ── */
.backpack-cell__rarity-tag {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 3;
  padding: 0 5px;
  line-height: 16px;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  border-radius: 0 0 6px 0;
  letter-spacing: 0.02em;
  opacity: 0.85;
}

/* ── 品质扫光效果（普通/稀有，hover 触发）── */
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

/* ── 史诗品质格子：加强扫光 + 内发光 ── */
.backpack-cell--epic {
  box-shadow: inset 0 0 12px rgba(175, 82, 222, 0.15);
}

.backpack-cell--epic::after {
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.08) 75%,
    transparent 100%
  );
}

/* ── 传说品质格子：强烈扫光 + 内发光 ── */
.backpack-cell--legendary {
  box-shadow: inset 0 0 16px rgba(255, 149, 0, 0.2);
}

.backpack-cell--legendary::after {
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.1) 80%,
    transparent 100%
  );
}

.backpack-wrapper:hover .backpack-cell--legendary::after {
  animation: sweep-glow 0.8s ease-in-out;
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

/* ── 史诗呼吸外发光（亮色模式）── */
@keyframes glow-breathe-epic {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(175, 82, 222, 0.2);
  }
  50% {
    box-shadow: 0 0 10px 3px rgba(175, 82, 222, 0.45);
  }
}

/* ── 史诗呼吸外发光（暗色模式）── */
@keyframes glow-breathe-epic-dark {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(194, 130, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 10px 3px rgba(194, 130, 255, 0.45);
  }
}

/* ── 传说脉动外发光（亮色模式）── */
@keyframes glow-pulse-legendary {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(255, 149, 0, 0.25);
  }
  50% {
    box-shadow: 0 0 14px 4px rgba(255, 149, 0, 0.55);
  }
}

/* ── 传说脉动外发光（暗色模式）── */
@keyframes glow-pulse-legendary-dark {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(255, 155, 82, 0.25);
  }
  50% {
    box-shadow: 0 0 14px 4px rgba(255, 155, 82, 0.55);
  }
}
</style>