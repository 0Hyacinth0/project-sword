<!--
  CharacterEquipmentGrid.vue
  装备概览网格组件
  显示6个装备槽位及其装备信息
-->
<template>
  <div class="equip-overview">
    <div class="equip-overview__grid">
      <div
        v-for="slot in slotList"
        :key="slot"
        class="equip-slot"
        :class="{
          'equip-slot--empty': !getEquipment(slot),
          'equip-slot--filled': !!getEquipment(slot)
        }"
        @click="$emit('clickSlot', slot)"
      >
        <!-- 有装备 -->
        <template v-if="getEquipment(slot)">
          <div
            class="equip-slot__rarity-bar"
            :style="{ background: rarityColor(getEquipment(slot)!.rarity) }"
          />
          <div class="equip-slot__content">
            <component
              :is="getSlotConfig(slot).icon"
              :size="18"
              class="equip-slot__icon"
              :style="{ color: rarityColor(getEquipment(slot)!.rarity) }"
            />
            <span class="equip-slot__name">{{ getEquipment(slot)!.name }}</span>
          </div>
          <!-- 悬浮详情 -->
          <div class="equip-slot__tooltip">
            <div class="equip-slot__tooltip-name" :style="{ color: rarityColor(getEquipment(slot)!.rarity) }">
              {{ getEquipment(slot)!.name }}
            </div>
            <div class="equip-slot__tooltip-rarity">
              {{ rarityLabel(getEquipment(slot)!.rarity) }}
            </div>
            <div class="equip-slot__tooltip-stats">
              <div v-for="(value, key) in getEquipment(slot)!.stats" :key="key" class="equip-slot__tooltip-stat">
                <span class="equip-slot__tooltip-stat-label">{{ statLabel(key as string) }}</span>
                <span class="equip-slot__tooltip-stat-value">+{{ value }}</span>
              </div>
            </div>
            <div v-if="getEquipment(slot)!.setName" class="equip-slot__tooltip-set">
              {{ getEquipment(slot)!.setName }}
            </div>
          </div>
        </template>

        <!-- 空槽位 -->
        <template v-else>
          <div class="equip-slot__content">
            <component
              :is="getSlotConfig(slot).icon"
              :size="18"
              class="equip-slot__icon equip-slot__icon--empty"
            />
            <span class="equip-slot__label">{{ getSlotConfig(slot).label }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 套装效果 -->
    <div v-if="setBonuses.length > 0" class="equip-overview__sets">
      <div v-for="bonus in setBonuses" :key="bonus.setId" class="equip-set">
        <div class="equip-set__header">
          <span class="equip-set__name">{{ bonus.setName }}</span>
          <span class="equip-set__count">{{ bonus.equippedCount }}/{{ bonus.totalCount }}</span>
        </div>
        <div class="equip-set__progress">
          <div
            class="equip-set__progress-fill"
            :style="{ width: (bonus.equippedCount / bonus.totalCount * 100) + '%' }"
          />
        </div>
        <div class="equip-set__bonuses">
          <div
            v-for="(b, i) in bonus.bonuses"
            :key="i"
            class="equip-set__bonus"
            :class="{ 'equip-set__bonus--active': bonus.equippedCount >= b.requiredCount }"
          >
            {{ b.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EquipmentSlots, EquipmentSlotType, EquipmentRarity, SetBonus } from '../../types/equipment'
import { SLOT_LIST, getSlotConfig, RARITY_COLORS, RARITY_LABELS } from '../../config/equipment_config'

/**
 * 装备概览网格组件
 * @param equipment - 六槽位装备数据
 * @param setBonuses - 套装效果列表（可选）
 * @emits clickSlot - 点击装备槽位
 */

interface Props {
  equipment: EquipmentSlots
  setBonuses?: SetBonus[]
}

interface Emits {
  (e: 'clickSlot', slot: EquipmentSlotType): void
}

const props = withDefaults(defineProps<Props>(), {
  setBonuses: () => []
})

defineEmits<Emits>()

/** 槽位列表 */
const slotList = SLOT_LIST

/**
 * 获取指定槽位的装备
 */
function getEquipment(slot: EquipmentSlotType) {
  return props.equipment[slot]
}

/**
 * 获取稀有度颜色
 */
function rarityColor(rarity: EquipmentRarity): string {
  return RARITY_COLORS[rarity]?.light || '#6e6e73'
}

/**
 * 获取稀有度标签
 */
function rarityLabel(rarity: EquipmentRarity): string {
  return RARITY_LABELS[rarity] || '普通'
}

/** 属性名称映射 */
const STAT_LABELS: Record<string, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  hp: '生命',
  mp: '魔力',
  criticalRate: '暴击',
  dodgeRate: '闪避',
  strength: '力量',
  intelligence: '智力',
  agility: '敏捷'
}

/**
 * 获取属性中文名
 */
function statLabel(key: string): string {
  return STAT_LABELS[key] || key
}
</script>

<style scoped>
.equip-overview {
  padding: 12px 0;
}

.equip-overview__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.equip-slot {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
}

.equip-slot:hover {
  transform: translateY(-1px);
}

.equip-slot:active {
  transform: scale(0.98);
}

/* 空槽位 */
.equip-slot--empty {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
}

/* 已装备 */
.equip-slot--filled {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.equip-slot__rarity-bar {
  height: 2px;
}

.equip-slot__content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}

.equip-slot__icon {
  flex-shrink: 0;
}

.equip-slot__icon--empty {
  color: var(--text-muted, rgba(0, 0, 0, 0.36));
}

.equip-slot__name {
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equip-slot__label {
  font-size: var(--font-size-small, 14px);
  color: var(--text-muted, rgba(0, 0, 0, 0.36));
}

/* 悬浮提示 */
.equip-slot__tooltip {
  display: none;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  z-index: 100;
  min-width: 140px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(16px);
  color: #fff;
  font-size: var(--font-size-xs, 12px);
  pointer-events: none;
}

.equip-slot--filled:hover .equip-slot__tooltip {
  display: block;
}

.equip-slot__tooltip-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.equip-slot__tooltip-rarity {
  font-size: var(--font-size-caption, 11px);
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.equip-slot__tooltip-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.equip-slot__tooltip-stat {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.equip-slot__tooltip-stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.equip-slot__tooltip-stat-value {
  color: var(--accent-green, #34c759);
  font-weight: 500;
}

.equip-slot__tooltip-set {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--accent-gold, #f59e0b);
}

/* 套装效果 */
.equip-overview__sets {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equip-set {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.08);
}

.equip-set__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.equip-set__name {
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  color: var(--accent-gold, #f59e0b);
}

.equip-set__count {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  font-variant-numeric: tabular-nums;
}

.equip-set__progress {
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 4px;
}

.equip-set__progress-fill {
  height: 100%;
  background: var(--accent-gold, #f59e0b);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.equip-set__bonuses {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.equip-set__bonus {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.4));
}

.equip-set__bonus--active {
  color: var(--accent-green, #34c759);
}
</style>