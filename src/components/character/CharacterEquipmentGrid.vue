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
            'equip-slot--selected': selectedSlot === 'helmet',
            ...getRarityGlowClass(equipment.helmet?.rarity ?? 'Normal')
          }"
          :style="equipment.helmet ? slotStyle(equipment.helmet.rarity) : {}"
          @click="handleSlotClick('helmet')"
        >
          <component
            :is="getSlotConfig('helmet').icon"
            :size="20"
            :style="equipment.helmet ? { color: rarityColor(equipment.helmet.rarity) } : {}"
          />
          <span v-if="equipment.helmet" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.helmet.rarity) }">
            {{ rarityLabel(equipment.helmet.rarity) }}
          </span>
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.chest,
            'equip-slot--selected': selectedSlot === 'chest',
            ...getRarityGlowClass(equipment.chest?.rarity ?? 'Normal')
          }"
          :style="equipment.chest ? slotStyle(equipment.chest.rarity) : {}"
          @click="handleSlotClick('chest')"
        >
          <component
            :is="getSlotConfig('chest').icon"
            :size="20"
            :style="equipment.chest ? { color: rarityColor(equipment.chest.rarity) } : {}"
          />
          <span v-if="equipment.chest" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.chest.rarity) }">
            {{ rarityLabel(equipment.chest.rarity) }}
          </span>
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.weapon,
            'equip-slot--selected': selectedSlot === 'weapon',
            ...getRarityGlowClass(equipment.weapon?.rarity ?? 'Normal')
          }"
          :style="equipment.weapon ? slotStyle(equipment.weapon.rarity) : {}"
          @click="handleSlotClick('weapon')"
        >
          <component
            :is="getSlotConfig('weapon').icon"
            :size="20"
            :style="equipment.weapon ? { color: rarityColor(equipment.weapon.rarity) } : {}"
          />
          <span v-if="equipment.weapon" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.weapon.rarity) }">
            {{ rarityLabel(equipment.weapon.rarity) }}
          </span>
        </div>
      </div>

      <!-- 中间：角色立绘 -->
      <div class="equip-doll__portrait">
        <img
          v-if="resolvedPortraitUrl"
          :src="resolvedPortraitUrl"
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
            'equip-slot--selected': selectedSlot === 'accessory1',
            ...getRarityGlowClass(equipment.accessory1?.rarity ?? 'Normal')
          }"
          :style="equipment.accessory1 ? slotStyle(equipment.accessory1.rarity) : {}"
          @click="handleSlotClick('accessory1')"
        >
          <component
            :is="getSlotConfig('accessory1').icon"
            :size="20"
            :style="equipment.accessory1 ? { color: rarityColor(equipment.accessory1.rarity) } : {}"
          />
          <span v-if="equipment.accessory1" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.accessory1.rarity) }">
            {{ rarityLabel(equipment.accessory1.rarity) }}
          </span>
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.accessory2,
            'equip-slot--selected': selectedSlot === 'accessory2',
            ...getRarityGlowClass(equipment.accessory2?.rarity ?? 'Normal')
          }"
          :style="equipment.accessory2 ? slotStyle(equipment.accessory2.rarity) : {}"
          @click="handleSlotClick('accessory2')"
        >
          <component
            :is="getSlotConfig('accessory2').icon"
            :size="20"
            :style="equipment.accessory2 ? { color: rarityColor(equipment.accessory2.rarity) } : {}"
          />
          <span v-if="equipment.accessory2" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.accessory2.rarity) }">
            {{ rarityLabel(equipment.accessory2.rarity) }}
          </span>
        </div>
        <div
          class="equip-slot"
          :class="{
            'equip-slot--empty': !equipment.legs,
            'equip-slot--selected': selectedSlot === 'legs',
            ...getRarityGlowClass(equipment.legs?.rarity ?? 'Normal')
          }"
          :style="equipment.legs ? slotStyle(equipment.legs.rarity) : {}"
          @click="handleSlotClick('legs')"
        >
          <component
            :is="getSlotConfig('legs').icon"
            :size="20"
            :style="equipment.legs ? { color: rarityColor(equipment.legs.rarity) } : {}"
          />
          <span v-if="equipment.legs" class="equip-slot__rarity-tag" :style="{ background: rarityColor(equipment.legs.rarity) }">
            {{ rarityLabel(equipment.legs.rarity) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="availableSkins.length > 1" class="equip-skins" aria-label="角色皮肤">
      <button
        v-for="skin in availableSkins"
        :key="skin.skinId"
        class="equip-skin"
        :class="{ 'equip-skin--active': skin.enabled }"
        type="button"
        :disabled="skin.enabled"
        :aria-pressed="skin.enabled"
        @click="handleSkinClick(skin)"
      >
        <img v-if="skin.portraitUrl" :src="skin.portraitUrl" :alt="skin.name" class="equip-skin__thumb" />
        <span class="equip-skin__name">{{ skin.name }}</span>
      </button>
    </div>

    <!-- 选中装备详情卡片 -->
    <Transition name="detail-fade">
      <div v-if="selectedEquipment" class="equip-detail">
        <div class="equip-detail__header">
          <span class="equip-detail__name" :style="{ color: rarityColor(selectedEquipment.rarity) }">
            {{ selectedEquipment.name }}
            <span v-if="selectedEquipment.enhanceLevel" class="equip-detail__enhance">
              +{{ selectedEquipment.enhanceLevel }}
            </span>
          </span>
          <span class="equip-detail__rarity">{{ rarityLabel(selectedEquipment.rarity) }}</span>
        </div>
        <div class="equip-detail__stats">
          <div v-for="(value, key) in selectedEquipment.stats" :key="key" class="equip-detail__stat">
            <span class="equip-detail__stat-label">{{ statLabel(key as string) }}</span>
            <span class="equip-detail__stat-value">
              +{{ getEnhancedValue(value, selectedEquipment.enhanceLevel || 0, selectedEquipment.rarity) }}
              <span v-if="selectedEquipment.enhanceLevel" class="equip-detail__stat-base">({{ value }})</span>
            </span>
          </div>
        </div>
        <!-- 随机词条 -->
        <div v-if="selectedEquipment.extraStats?.length" class="equip-detail__affix">
          <div v-for="(affix, i) in selectedEquipment.extraStats" :key="i" class="equip-detail__stat equip-detail__stat--affix">
            <span class="equip-detail__stat-label">{{ statLabel(affix.key) }}</span>
            <span class="equip-detail__stat-value equip-detail__stat-value--affix">{{ formatAffixValue(affix.key, affix.value) }}</span>
          </div>
        </div>
        <div v-if="selectedEquipment.setName" class="equip-detail__set">
          {{ selectedEquipment.setName }}
        </div>
        <div v-if="selectedEquipment.description" class="equip-detail__desc">
          {{ selectedEquipment.description }}
        </div>
        <!-- 强化区域 -->
        <div class="equip-detail__enhance-section">
          <div class="equip-detail__enhance-info">
            <span class="equip-detail__enhance-label">强化等级</span>
            <span class="equip-detail__enhance-value">{{ selectedEquipment.enhanceLevel || 0 }}/{{ MAX_ENHANCE_LEVEL }}</span>
          </div>
          <div v-if="enhanceCostPreview" class="equip-detail__enhance-cost">
            <div v-for="(mat, materialId) in enhanceCostPreview.materialsAvailable" :key="materialId" class="equip-detail__enhance-cost-item" :class="{ 'equip-detail__enhance-cost-item--lack': !mat.enough }">
              {{ ENHANCE_MATERIAL_NAMES[Number(materialId)] || '材料' }} ×{{ mat.required }}
              <span class="equip-detail__enhance-cost-owned">(拥有 {{ mat.owned }})</span>
            </div>
            <div class="equip-detail__enhance-cost-item">{{ enhanceCostPreview.gold }} 银两</div>
            <div class="equip-detail__enhance-cost-item equip-detail__enhance-rate">
              成功率 {{ (enhanceCostPreview.successRate * 100).toFixed(0) }}%
            </div>
          </div>
          <button
            v-if="enhanceCostPreview"
            class="equip-detail__enhance-btn"
            :disabled="!enhanceCostPreview.canAfford"
            @click="handleEnhance"
          >
            强化 +{{ (selectedEquipment.enhanceLevel || 0) + 1 }}
          </button>
          <div v-else class="equip-detail__enhance-max">已达最大强化等级</div>
        </div>
        <button class="equip-detail__unequip-btn" @click="handleUnequip">
          卸下装备
        </button>
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
import type { InventoryItem } from '../../types/item'
import type { CharacterSkin } from '../../types/shop'
import { getSlotConfig, RARITY_COLORS, RARITY_LABELS, RARITY_CSS_VAR, RARITY_LEVEL } from '../../config/equipment_config'
import { formatAffixValue } from '../../config/affix_config'
import { getEnhancedValue, getEnhanceCost, ENHANCE_MATERIAL_NAMES, MAX_ENHANCE_LEVEL } from '../../config/enhance_config'
import { getJobConfigByProfession } from '../../config/job_config'

/**
 * 装备概览 - 纸娃娃布局组件
 * 角色立绘居中，小方格装备槽位围绕角色排列
 * @param equipment - 六槽位装备数据
 * @param portraitUrl - 角色立绘 URL（可选）
 * @param profession - 职业编号（用于占位图标和颜色）
 * @param setBonuses - 套装效果列表（可选）
 * @param inventoryItems - 背包物品列表（用于材料校验）
 * @emits clickSlot - 点击装备槽位
 */

interface Props {
  equipment?: EquipmentSlots
  portraitUrl?: string | null
  profession: number
  setBonuses?: SetBonus[]
  inventoryItems?: InventoryItem[]
  skins?: CharacterSkin[]
}

interface Emits {
  (e: 'clickSlot', slot: EquipmentSlotType): void
  (e: 'unequip', slotType: EquipmentSlotType): void
  (e: 'enhance', slotType: EquipmentSlotType): void
  (e: 'equip-skin', skin: CharacterSkin): void
}

const props = withDefaults(defineProps<Props>(), {
  equipment: () => ({ weapon: null, helmet: null, chest: null, legs: null, accessory1: null, accessory2: null }),
  portraitUrl: null,
  setBonuses: () => [],
  inventoryItems: () => [],
  skins: () => []
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

/** 解析立绘URL：优先使用传入的 portraitUrl，否则使用职业默认立绘 */
const resolvedPortraitUrl = computed(() => {
  return props.portraitUrl || jobConfig.value.portrait
})

/**
 * 当前职业可展示的皮肤列表。
 * @returns 当前职业已拥有的皮肤
 */
const availableSkins = computed(() =>
  props.skins.filter(skin => skin.profession === props.profession && skin.owned)
)

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
 * 获取稀有度颜色（使用 CSS 变量，自动适配暗色模式）
 */
function rarityColor(rarity: EquipmentRarity): string {
  return `var(${RARITY_CSS_VAR[rarity]})`
}

/**
 * 根据稀有度生成装备格子样式（CSS 变量边框 + hex 底纹）
 */
function slotStyle(rarity: EquipmentRarity): Record<string, string> {
  const cssVar = `var(${RARITY_CSS_VAR[rarity]})`
  const color = RARITY_COLORS[rarity].light
  return {
    borderColor: cssVar,
    background: `linear-gradient(135deg, ${color}20 0%, ${color}0a 100%)`,
    '--glow-color': cssVar,
    '--rarity-level': String(RARITY_LEVEL[rarity])
  }
}

/**
 * 根据稀有度等级返回光效 CSS 类名
 */
function getRarityGlowClass(rarity: EquipmentRarity): Record<string, boolean> {
  const level = RARITY_LEVEL[rarity]
  return {
    'equip-slot--epic': level === 2,
    'equip-slot--legendary': level === 3
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
  physicalAttack: '外功',
  magicAttack: '内功',
  defense: '防御',
  hp: '气血',
  mp: '内力',
  criticalRate: '暴击',
  dodgeRate: '闪避',
  strength: '臂力',
  intelligence: '根骨',
  agility: '身法'
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

/**
 * 卸下当前选中的装备
 */
function handleUnequip() {
  if (!selectedSlot.value) return
  emit('unequip', selectedSlot.value)
  selectedSlot.value = null
}

/**
 * 强化当前选中的装备
 */
function handleEnhance() {
  if (!selectedSlot.value) return
  emit('enhance', selectedSlot.value)
}

/**
 * 点击皮肤选项并派发启用请求。
 * @param skin - 被点击皮肤
 * @returns 无返回值
 */
function handleSkinClick(skin: CharacterSkin): void {
  if (!skin.owned || skin.enabled) return
  emit('equip-skin', skin)
}

/**
 * 获取当前装备的强化消耗预览（含材料充足校验）
 */
const enhanceCostPreview = computed(() => {
  if (!selectedEquipment.value) return null
  const level = selectedEquipment.value.enhanceLevel || 0
  if (level >= MAX_ENHANCE_LEVEL) return null
  const cost = getEnhanceCost(level)
  if (!cost) return null
  // 校验材料是否充足
  const materialsAvailable: Record<number, { required: number; owned: number; enough: boolean }> = {}
  for (const [matId, required] of Object.entries(cost.materials)) {
    const id = Number(matId)
    const owned = props.inventoryItems
      .filter(i => i.itemId === id || i.item.itemId === id)
      .reduce((sum, i) => sum + i.quantity, 0)
    materialsAvailable[id] = { required, owned, enough: owned >= required }
  }
  const canAfford = Object.values(materialsAvailable).every(m => m.enough)
  return { ...cost, materialsAvailable, canAfford }
})
</script>

<style scoped>
.equip-skins {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.equip-skin {
  min-width: 0;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-panel-light);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  letter-spacing: 0;
  cursor: pointer;
  transition: border-color 0.2s var(--ease-smooth), box-shadow 0.2s var(--ease-smooth), transform 0.1s ease;
}

.equip-skin:hover:not(:disabled) {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-subtle);
}

.equip-skin:active:not(:disabled) {
  transform: scale(0.98);
}

.equip-skin:disabled {
  cursor: default;
}

.equip-skin--active {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px var(--accent-blue-glow);
}

.equip-skin__thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.equip-skin__name {
  min-width: 0;
  overflow: hidden;
  color: inherit;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .equip-skins {
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  }
}
</style>
