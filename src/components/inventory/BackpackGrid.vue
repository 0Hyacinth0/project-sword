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
