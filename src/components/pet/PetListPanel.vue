<!--
  PetListPanel.vue
  战宠主页面 - 3 卡片槽位 + 出战标签
  展示所有战宠（最多3只），标记出战的战宠，支持切换出战
-->
<template>
  <div class="pet-list">
    <div class="pet-list__header">
      <span class="pet-list__title">战宠</span>
      <div class="pet-list__header-right">
        <button class="pet-list__tab-btn" :class="{ 'pet-list__tab-btn--active': !showCollection }" @click="showCollection = false">我的</button>
        <button class="pet-list__tab-btn" :class="{ 'pet-list__tab-btn--active': showCollection }" @click="showCollection = true">图鉴</button>
        <span v-if="!showCollection" class="pet-list__count">{{ pets.length }}/{{ capacity.max }}</span>
      </div>
    </div>

    <!-- 图鉴模式 -->
    <PetCollectionPanel v-if="showCollection" :owned-type-ids="ownedTypeIds" />

    <!-- 我的战宠模式 -->
    <template v-else>

    <!-- 3 卡片槽位 -->
    <div class="pet-list__slots">
      <!-- 已有战宠的槽位 -->
      <div
        v-for="pet in pets"
        :key="pet.id"
        class="pet-slot"
        :class="{
          'pet-slot--active': pet.isActive,
          'pet-slot--selected': selectedPetId === pet.id
        }"
        @click="handleClickPet(pet)"
      >
        <!-- 出战标签 -->
        <div v-if="pet.isActive" class="pet-slot__active-tag">出战中</div>

        <!-- 品质边框头像 -->
        <div
          class="pet-slot__avatar"
          :style="{ borderColor: getRarityColor(pet.rarity), background: getRarityBg(pet.rarity) }"
        >
          <Flame :size="22" :style="{ color: getRarityColor(pet.rarity) }" />
        </div>

        <!-- 昵称 + 等级 -->
        <div class="pet-slot__name">{{ pet.nickname }}</div>
        <div class="pet-slot__meta">
          <span class="pet-slot__level">Lv.{{ pet.level }}</span>
          <span
            class="pet-slot__rarity"
            :style="{ color: getRarityColor(pet.rarity) }"
          >
            {{ getRarityLabel(pet.rarity) }}
          </span>
        </div>

        <!-- 经验条 -->
        <div class="pet-slot__exp">
          <div class="pet-slot__exp-track">
            <div class="pet-slot__exp-fill" :style="{ width: getExpPercent(pet) + '%' }" />
          </div>
        </div>
      </div>

      <!-- 空槽位 -->
      <div
        v-for="i in emptySlots"
        :key="'empty-' + i"
        class="pet-slot pet-slot--empty"
      >
        <Plus :size="20" class="pet-slot__empty-icon" />
        <span class="pet-slot__empty-text">空槽位</span>
      </div>
    </div>

    <!-- 选中战宠的操作栏 + 详情面板 -->
    <Transition name="detail-fade">
      <div v-if="selectedPet" class="pet-selected">
        <!-- 操作栏 -->
        <div class="pet-selected__actions">
          <button
            v-if="!selectedPet.isActive"
            class="pet-selected__btn pet-selected__btn--active"
            :disabled="loading"
            @click="handleSetActive"
          >
            设为出战
          </button>
          <div v-else class="pet-selected__active-hint">当前出战战宠</div>
        </div>

        <!-- 详情标签面板 -->
        <PetDetailPanel
          :pet="selectedPet"
          :exp-items="expItems"
          :equip-items="equipItems"
          :loading="loading"
          @feed="handleFeed"
          @evolve="handleEvolve"
          @rename="handleRename"
          @equip-skill="handleEquipSkill"
          @unequip-skill="handleUnequipSkill"
          @equip-item="handleEquipItem"
          @unequip-item="handleUnequipItem"
        />
      </div>
    </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Flame, Plus } from 'lucide-vue-next'
import type { PetInfo, PetRarity, PetCapacity } from '../../types/pet'
import type { InventoryItem } from '../../types/item'
import { PET_RARITY_LABEL, PET_RARITY_COLORS } from '../../types/pet'
import PetDetailPanel from './PetDetailPanel.vue'
import PetCollectionPanel from './PetCollectionPanel.vue'

/**
 * 战宠列表面板组件
 * @param pets - 角色拥有的战宠列表
 * @param capacity - 战宠容量信息
 * @param expItems - 经验道具列表（喂食用）
 * @param loading - 操作进行中
 * @emits setActive - 设置出战战宠 (petId)
 * @emits feed - 喂食战宠 (petId, inventoryId, quantity)
 * @emits evolve - 进化战宠 (petId)
 * @emits rename - 重命名战宠 (petId, nickname)
 */

interface Props {
  pets: PetInfo[]
  capacity: PetCapacity
  expItems?: InventoryItem[]
  equipItems?: InventoryItem[]
  loading?: boolean
}

interface Emits {
  (e: 'setActive', petId: string): void
  (e: 'feed', petId: string, inventoryId: string, quantity: number): void
  (e: 'evolve', petId: string): void
  (e: 'rename', petId: string, nickname: string): void
  (e: 'equipSkill', petId: string, skillId: number, slotIndex: number): void
  (e: 'unequipSkill', petId: string, slotIndex: number): void
  (e: 'equipItem', petId: string, inventoryId: string, slotType: 'armor' | 'accessory'): void
  (e: 'unequipItem', petId: string, slotType: 'armor' | 'accessory'): void
}

const props = withDefaults(defineProps<Props>(), {
  expItems: () => [],
  equipItems: () => [],
  loading: false
})
const emit = defineEmits<Emits>()

/** 当前选中的战宠 ID */
const selectedPetId = ref<string | null>(null)

/** 是否显示图鉴模式 */
const showCollection = ref(false)

/** 已拥有的战宠类型 ID 列表（去重） */
const ownedTypeIds = computed(() => [...new Set(props.pets.map(p => p.petTypeId))])

/** 当前选中的战宠对象 */
const selectedPet = computed(() =>
  selectedPetId.value ? props.pets.find(p => p.id === selectedPetId.value) || null : null
)

/** 空槽位数量 */
const emptySlots = computed(() => Math.max(0, props.capacity.max - props.pets.length))

/**
 * 获取稀有度颜色
 */
function getRarityColor(rarity: PetRarity): string {
  return PET_RARITY_COLORS[rarity]?.light || '#8e6e73'
}

/**
 * 获取稀有度背景色
 */
function getRarityBg(rarity: PetRarity): string {
  const color = getRarityColor(rarity)
  return `${color}14`
}

/**
 * 获取稀有度标签
 */
function getRarityLabel(rarity: PetRarity): string {
  return PET_RARITY_LABEL[rarity] || 'N'
}

/**
 * 计算经验百分比
 */
function getExpPercent(pet: PetInfo): number {
  return Math.max(0, Math.min(100, (pet.exp / pet.maxExp) * 100))
}

/**
 * 点击战宠卡片
 */
function handleClickPet(pet: PetInfo) {
  selectedPetId.value = selectedPetId.value === pet.id ? null : pet.id
}

/**
 * 设置出战
 */
function handleSetActive() {
  if (!selectedPet.value) return
  emit('setActive', selectedPet.value.id)
}

/**
 * 喂食战宠
 */
function handleFeed(inventoryId: string, quantity: number) {
  if (!selectedPet.value) return
  emit('feed', selectedPet.value.id, inventoryId, quantity)
}

/**
 * 进化战宠
 */
function handleEvolve() {
  if (!selectedPet.value) return
  emit('evolve', selectedPet.value.id)
}

/**
 * 重命名战宠
 */
function handleRename(nickname: string) {
  if (!selectedPet.value) return
  emit('rename', selectedPet.value.id, nickname)
}

/**
 * 装备技能
 */
function handleEquipSkill(skillId: number, slotIndex: number) {
  if (!selectedPet.value) return
  emit('equipSkill', selectedPet.value.id, skillId, slotIndex)
}

/**
 * 卸下技能
 */
function handleUnequipSkill(slotIndex: number) {
  if (!selectedPet.value) return
  emit('unequipSkill', selectedPet.value.id, slotIndex)
}

/**
 * 穿戴装备
 */
function handleEquipItem(inventoryId: string, slotType: 'armor' | 'accessory') {
  if (!selectedPet.value) return
  emit('equipItem', selectedPet.value.id, inventoryId, slotType)
}

/**
 * 卸下装备
 */
function handleUnequipItem(slotType: 'armor' | 'accessory') {
  if (!selectedPet.value) return
  emit('unequipItem', selectedPet.value.id, slotType)
}
</script>

<style scoped>
.pet-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pet-list__title {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  color: var(--text-primary);
}

.pet-list__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pet-list__tab-btn {
  padding: 2px 8px;
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.06);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
  cursor: pointer;
  transition: all 0.15s ease;
}

.pet-list__tab-btn--active {
  background: var(--accent-blue, #0071e3);
  color: #fff;
  border-color: var(--accent-blue, #0071e3);
}

.pet-list__count {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  font-variant-numeric: tabular-nums;
}

/* ── 3 卡片槽位 ── */
.pet-list__slots {
  display: flex;
  gap: 8px;
}

.pet-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.pet-slot:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.pet-slot:active {
  transform: scale(0.97);
}

.pet-slot--active {
  border-color: var(--accent-blue, #0071e3);
  box-shadow: 0 0 8px rgba(0, 113, 227, 0.2);
}

.pet-slot--selected {
  border-color: var(--accent-gold, #f59e0b);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

/* 出战标签 */
.pet-slot__active-tag {
  position: absolute;
  top: -1px;
  left: -1px;
  padding: 1px 8px;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  background: var(--accent-green, #34c759);
  border-radius: 8px 0 6px 0;
  line-height: 16px;
}

/* 头像 */
.pet-slot__avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.pet-slot__name {
  font-size: var(--font-size-xs, 12px);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.pet-slot__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.pet-slot__level {
  font-size: 10px;
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
}

.pet-slot__rarity {
  font-size: 10px;
  font-weight: 600;
}

/* 经验条 */
.pet-slot__exp {
  width: 100%;
  margin-top: 6px;
}

.pet-slot__exp-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(128, 128, 128, 0.15);
  overflow: hidden;
}

.pet-slot__exp-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #f59e0b, #ffd60a);
  transition: width 0.3s ease;
}

/* 空槽位 */
.pet-slot--empty {
  cursor: default;
  opacity: 0.5;
}

.pet-slot--empty:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: none;
}

.pet-slot__empty-icon {
  color: var(--text-muted, rgba(0, 0, 0, 0.2));
  margin-bottom: 6px;
}

.pet-slot__empty-text {
  font-size: 10px;
  color: var(--text-muted, rgba(0, 0, 0, 0.3));
}

/* ── 选中战宠区域 ── */
.pet-selected {
  margin-top: 12px;
}

.pet-selected__actions {
  margin-bottom: 8px;
}

.pet-selected__btn {
  width: 100%;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pet-selected__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pet-selected__btn--active {
  background: var(--accent-blue, #0071e3);
  color: #fff;
}

.pet-selected__btn--active:hover:not(:disabled) {
  opacity: 0.85;
}

.pet-selected__active-hint {
  text-align: center;
  font-size: var(--font-size-xs, 12px);
  color: var(--accent-green, #34c759);
  font-weight: 500;
  padding: 4px 0;
}

/* 过渡动画 */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: all 0.2s ease;
}

.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
