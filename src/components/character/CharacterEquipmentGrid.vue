<!--
  CharacterEquipmentGrid.vue
  装备概览 - 纸娃娃布局
  角色立绘居中，小方格装备槽位围绕角色排列
  点击槽位后下方显示装备详情卡片
-->
<template>
  <div class="equip-doll">
    <!-- 纸娃娃主体：左列装备 + 中间立绘 + 右列装备 -->
    <div class="equip-doll__body">
      <!-- 左列：头盔、胸甲、武器 -->
      <div class="equip-doll__column equip-doll__column--left">
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.helmet,
            'equip-slot--selected': selectedSlot === 'helmet'
          }"
          :style="equipment.helmet ? slotStyle(equipment.helmet.rarity) : {}"
          @click="handleSlotClick('helmet')"
        >
          <component
            :is="getSlotConfig('helmet').icon"
            :size="20"
            :style="equipment.helmet ? { color: rarityColor(equipment.helmet.rarity) } : {}"
          />
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.chest,
            'equip-slot--selected': selectedSlot === 'chest'
          }"
          :style="equipment.chest ? slotStyle(equipment.chest.rarity) : {}"
          @click="handleSlotClick('chest')"
        >
          <component
            :is="getSlotConfig('chest').icon"
            :size="20"
            :style="equipment.chest ? { color: rarityColor(equipment.chest.rarity) } : {}"
          />
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.weapon,
            'equip-slot--selected': selectedSlot === 'weapon'
          }"
          :style="equipment.weapon ? slotStyle(equipment.weapon.rarity) : {}"
          @click="handleSlotClick('weapon')"
        >
          <component
            :is="getSlotConfig('weapon').icon"
            :size="20"
            :style="equipment.weapon ? { color: rarityColor(equipment.weapon.rarity) } : {}"
          />
        </div>
      </div>

      <!-- 中间：角色立绘 -->
      <div class="equip-doll__portrait" :style="{ background: jobConfig.colorLight }">
        <img
          v-if="portraitUrl"
          :src="portraitUrl"
          :alt="'角色立绘'"
          class="equip-doll__portrait-img"
        />
        <div v-else class="equip-doll__portrait-placeholder">
          <component :is="jobIcon" :size="48" :stroke-width="1.2" :style="{ color: jobConfig.color }" />
        </div>
      </div>

      <!-- 右列：饰品1、饰品2、护腿 -->
      <div class="equip-doll__column equip-doll__column--right">
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.accessory1,
            'equip-slot--selected': selectedSlot === 'accessory1'
          }"
          :style="equipment.accessory1 ? slotStyle(equipment.accessory1.rarity) : {}"
          @click="handleSlotClick('accessory1')"
        >
          <component
            :is="getSlotConfig('accessory1').icon"
            :size="20"
            :style="equipment.accessory1 ? { color: rarityColor(equipment.accessory1.rarity) } : {}"
          />
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.accessory2,
            'equip-slot--selected': selectedSlot === 'accessory2'
          }"
          :style="equipment.accessory2 ? slotStyle(equipment.accessory2.rarity) : {}"
          @click="handleSlotClick('accessory2')"
        >
          <component
            :is="getSlotConfig('accessory2').icon"
            :size="20"
            :style="equipment.accessory2 ? { color: rarityColor(equipment.accessory2.rarity) } : {}"
          />
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.legs,
            'equip-slot--selected': selectedSlot === 'legs'
          }"
          :style="equipment.legs ? slotStyle(equipment.legs.rarity) : {}"
          @click="handleSlotClick('legs')"
        >
          <component
            :is="getSlotConfig('legs').icon"
            :size="20"
            :style="equipment.legs ? { color: rarityColor(equipment.legs.rarity) } : {}"
          />
        </div>
      </div>
    </div>

    <!-- 选中装备详情卡片 -->
    <Transition name="detail-fade">
      <div v-if="selectedEquipment" class="equip-detail">
        <div class="equip-detail__header">
          <span class="equip-detail__name" :style="{ color: rarityColor(selectedEquipment.rarity) }">
            {{ selectedEquipment.name }}
          </span>
          <span class="equip-detail__rarity">{{ rarityLabel(selectedEquipment.rarity) }}</span>
        </div>
        <div class="equip-detail__stats">
          <div v-for="(value, key) in selectedEquipment.stats" :key="key" class="equip-detail__stat">
            <span class="equip-detail__stat-label">{{ statLabel(key as string) }}</span>
            <span class="equip-detail__stat-value">+{{ value }}</span>
          </div>
        </div>
        <div v-if="selectedEquipment.setName" class="equip-detail__set">
          {{ selectedEquipment.setName }}
        </div>
        <div v-if="selectedEquipment.description" class="equip-detail__desc">
          {{ selectedEquipment.description }}
        </div>
      </div>
    </Transition>

    <!-- 空槽位提示（选中空槽时） -->
    <Transition name="detail-fade">
      <div v-if="selectedSlot && !selectedEquipment" class="equip-detail equip-detail--empty">
        <span class="equip-detail__empty-text">{{ getSlotConfig(selectedSlot).label }}槽位空闲</span>
      </div>
    </Transition>

    <!-- 套装效果 -->
    <div v-if="setBonuses.length > 0" class="equip-doll__sets">
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
import { ref, computed, type Component } from 'vue'
import { Sword, Sparkles, Target } from 'lucide-vue-next'
import type { EquipmentSlots, EquipmentSlotType, EquipmentRarity, SetBonus } from '../../types/equipment'
import { getSlotConfig, RARITY_COLORS, RARITY_LABELS } from '../../config/equipment_config'
import { getJobConfigByProfession } from '../../config/job_config'

/**
 * 装备概览 - 纸娃娃布局组件
 * 角色立绘居中，小方格装备槽位围绕角色排列
 * @param equipment - 六槽位装备数据
 * @param portraitUrl - 角色立绘 URL（可选）
 * @param profession - 职业编号（用于占位图标和颜色）
 * @param setBonuses - 套装效果列表（可选）
 * @emits clickSlot - 点击装备槽位
 */

interface Props {
  equipment: EquipmentSlots
  portraitUrl?: string | null
  profession: number
  setBonuses?: SetBonus[]
}

interface Emits {
  (e: 'clickSlot', slot: EquipmentSlotType): void
}

const props = withDefaults(defineProps<Props>(), {
  portraitUrl: null,
  setBonuses: () => []
})

const emit = defineEmits<Emits>()

/** 当前选中的槽位 */
const selectedSlot = ref<EquipmentSlotType | null>(null)

/** 选中的装备 */
const selectedEquipment = computed(() => {
  if (!selectedSlot.value) return null
  return props.equipment[selectedSlot.value]
})

/** 职业配置 */
const jobConfig = computed(() => {
  return getJobConfigByProfession(props.profession)
})

/** 职业图标 */
const jobIcon = computed<Component>(() => {
  const iconMap: Record<number, Component> = {
    1: Sword,
    2: Sparkles,
    3: Target
  }
  return iconMap[props.profession] || Sword
})

/**
 * 获取稀有度颜色
 */
function rarityColor(rarity: EquipmentRarity): string {
  return RARITY_COLORS[rarity]?.light || '#6e6e73'
}

/**
 * 根据稀有度生成装备格子样式（边框 + 底纹 + 光效色）
 */
function slotStyle(rarity: EquipmentRarity): Record<string, string> {
  const color = RARITY_COLORS[rarity]?.light || '#6e6e73'
  return {
    borderColor: color,
    background: `linear-gradient(135deg, ${color}20 0%, ${color}0a 100%)`,
    '--glow-color': color
  }
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

/**
 * 点击槽位（选中/取消选中）
 */
function handleSlotClick(slot: EquipmentSlotType) {
  if (selectedSlot.value === slot) {
    selectedSlot.value = null
  } else {
    selectedSlot.value = slot
    emit('clickSlot', slot)
  }
}
</script>

<style scoped>
.equip-doll {
  padding: 8px 0;
}

/* ── 纸娃娃主体：三列布局 ── */
.equip-doll__body {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 10px;
}

/* ── 左右装备列：格子沿立绘高度均匀分布 ── */
.equip-doll__column--left,
.equip-doll__column--right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

/* ── 装备槽位方格 ── */
.equip-slot {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid transparent;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* 品质光效 - 斜向扫光 */
.equip-slot:not(.equip-slot--empty)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-15deg);
}

.equip-slot:not(.equip-slot--empty):hover::before {
  animation: sweep-glow 1.2s ease-in-out;
}

.equip-slot--empty {
  border: 1.5px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted, rgba(0, 0, 0, 0.36));
}

[data-theme='dark'] .equip-slot--empty {
  border-color: rgba(255, 255, 255, 0.15);
}

.equip-slot:hover {
  transform: scale(1.05);
}

.equip-slot:active {
  transform: scale(0.95);
}

.equip-slot--empty:hover {
  border-color: var(--accent-blue);
  background: rgba(0, 113, 227, 0.06);
}

.equip-slot--selected {
  background: rgba(0, 113, 227, 0.12);
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}

/* ── 角色立绘（竖向大图，约 9:16 比例）── */
.equip-doll__portrait {
  width: 200px;
  height: 320px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.equip-doll__portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equip-doll__portrait-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  opacity: 0.5;
}

/* ── 装备详情卡片 ── */
.equip-detail {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.equip-detail--empty {
  text-align: center;
  padding: 16px;
}

.equip-detail__empty-text {
  color: var(--text-muted, rgba(0, 0, 0, 0.4));
  font-size: var(--font-size-small, 14px);
}

.equip-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.equip-detail__name {
  font-size: var(--font-size-base, 16px);
  font-weight: 600;
}

.equip-detail__rarity {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
}

.equip-detail__stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.equip-detail__stat {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--font-size-small, 14px);
}

.equip-detail__stat-label {
  color: var(--text-muted, rgba(0, 0, 0, 0.6));
}

.equip-detail__stat-value {
  color: var(--accent-green, #34c759);
  font-weight: 500;
}

.equip-detail__set {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: var(--font-size-small, 14px);
  color: var(--accent-gold, #f59e0b);
}

.equip-detail__desc {
  margin-top: 8px;
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
  line-height: 1.5;
}

/* ── 详情过渡动画 ── */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: all 0.2s ease;
}

.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── 套装效果 ── */
.equip-doll__sets {
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

/* 光效动画 - 斜向扫光（右上→左下） */
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
