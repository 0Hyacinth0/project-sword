<!--
  CharacterPanel.vue
  角色详情主面板容器组件
  顶部基本信息 + 标签页切换 + 内容区域
-->
<template>
  <div class="char-panel">
    <!-- 基本信息 -->
    <div class="char-panel__header">
      <div class="char-panel__name">{{ character.characterName }}</div>
      <div class="char-panel__meta">
        <span class="char-panel__level">Lv.{{ character.level }}</span>
        <span
          class="char-panel__job-tag"
          :style="{
            background: jobConfig.colorLight,
            color: jobConfig.color
          }"
        >
          {{ jobConfig.name }}
        </span>
      </div>
    </div>

    <!-- 标签页切换 -->
    <UiTabs
      class="char-panel__tabs"
      size="sm"
      :model-value="activeTab"
      :items="tabs"
      @update:model-value="handleTabChange"
    />

    <!-- 内容区域 -->
    <div class="char-panel__content">
      <!-- 属性面板 -->
      <CharacterStats
        v-if="activeTab === 'stats'"
        :character="character"
        :active-pet="activePet"
        :level-up-result="levelUpResult"
        @refresh="handleRefresh"
      />

      <!-- 装备概览（纸娃娃布局） -->
      <CharacterEquipmentGrid
        v-if="activeTab === 'equipment'"
        :equipment="character.equipment ?? undefined"
        :portrait-url="character.portraitUrl"
        :profession="character.profession"
        :set-bonuses="setBonuses"
        :skins="skins"
        :inventory-items="inventoryItems"
        @click-slot="handleClickSlot"
        @unequip="handleUnequip"
        @enhance="handleEnhance"
        @equip-skin="handleEquipSkin"
      />

      <!-- 战宠列表 -->
      <PetListPanel
        v-if="activeTab === 'pet'"
        :pets="petList"
        :capacity="petCapacity"
        :exp-items="expItems"
        :equip-items="equipItems"
        :loading="petLoading"
        @set-active="handleSetActivePet"
        @feed="handleFeedPet"
        @evolve="handleEvolvePet"
        @rename="handleRenamePet"
        @equip-skill="handleEquipSkill"
        @unequip-skill="handleUnequipSkill"
        @equip-item="handleEquipItem"
        @unequip-item="handleUnequipItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { Activity, Shirt, PawPrint } from 'lucide-vue-next'
import { UiTabs, type UiTabItem } from '../ui'
import CharacterStats from './CharacterStats.vue'
import CharacterEquipmentGrid from './CharacterEquipmentGrid.vue'
import PetListPanel from '../pet/PetListPanel.vue'
import type { CharacterInfo } from '../../api/character'
import type { EquipmentSlotType, SetBonus } from '../../types/equipment'
import type { PetInfo, PetCapacity } from '../../types/pet'
import type { InventoryItem } from '../../types/item'
import type { CharacterSkin } from '../../types/shop'
import type { LevelUpResult } from '../../utils/levelConfig'
import { getJobConfigByProfession } from '../../config/job_config'

/**
 * 角色详情主面板容器组件
 * @param character - 角色完整数据
 * @param setBonuses - 套装效果列表（可选）
 * @param levelUpResult - 升级结果（可选，触发升级动画）
 * @emits refresh - 需要刷新角色数据
 * @emits clickSlot - 点击装备槽位
 * @emits clickPet - 点击战宠卡片
 */

interface Props {
  character: CharacterInfo
  setBonuses?: SetBonus[]
  petList?: PetInfo[]
  petCapacity?: PetCapacity
  petLoading?: boolean
  expItems?: InventoryItem[]
  equipItems?: InventoryItem[]
  inventoryItems?: InventoryItem[]
  skins?: CharacterSkin[]
  levelUpResult?: LevelUpResult | null
}

interface Emits {
  (e: 'refresh'): void
  (e: 'clickSlot', slot: EquipmentSlotType): void
  (e: 'unequip-slot', slotType: EquipmentSlotType): void
  (e: 'enhance-slot', slotType: EquipmentSlotType): void
  (e: 'set-active-pet', petId: string): void
  (e: 'feed-pet', petId: string, inventoryId: string, quantity: number): void
  (e: 'evolve-pet', petId: string): void
  (e: 'rename-pet', petId: string, nickname: string): void
  (e: 'equip-skill', petId: string, skillId: number, slotIndex: number): void
  (e: 'unequip-skill', petId: string, slotIndex: number): void
  (e: 'equip-item', petId: string, inventoryId: string, slotType: 'armor' | 'accessory'): void
  (e: 'unequip-item', petId: string, slotType: 'armor' | 'accessory'): void
  (e: 'equip-skin', skin: CharacterSkin): void
  (e: 'levelUpHandled'): void
}

const props = withDefaults(defineProps<Props>(), {
  setBonuses: () => [],
  petList: () => [],
  petCapacity: () => ({ max: 3, current: 0 }),
  petLoading: false,
  expItems: () => [],
  equipItems: () => [],
  inventoryItems: () => [],
  skins: () => [],
  levelUpResult: null
})
const emit = defineEmits<Emits>()

type PanelTab = 'stats' | 'equipment' | 'pet'

/** 当前激活的标签页 */
const activeTab = ref<PanelTab>('stats')

/** 标签页配置 */
const tabs: UiTabItem[] = [
  { value: 'stats', label: '属性', icon: Activity as Component },
  { value: 'equipment', label: '装备', icon: Shirt as Component },
  { value: 'pet', label: '战宠', icon: PawPrint as Component }
]

/** 职业配置（用于名称和颜色） */
const jobConfig = computed(() => {
  return getJobConfigByProfession(props.character.profession)
})

/** 出战战宠（从 petList 中找到 isActive 的那只） */
const activePet = computed(() => props.petList.find(p => p.isActive) ?? null)

/**
 * 切换角色面板标签。
 * @param value - UiTabs 派发的标签值
 * @returns 无返回值
 */
function handleTabChange(value: string | number): void {
  activeTab.value = value as PanelTab
}

/**
 * 刷新角色数据
 */
function handleRefresh() {
  emit('refresh')
}

/**
 * 点击装备槽位
 */
function handleClickSlot(slot: EquipmentSlotType) {
  emit('clickSlot', slot)
}

/**
 * 卸下装备
 */
function handleUnequip(slotType: EquipmentSlotType) {
  emit('unequip-slot', slotType)
}

/**
 * 强化装备
 */
function handleEnhance(slotType: EquipmentSlotType) {
  emit('enhance-slot', slotType)
}

/**
 * 请求启用角色皮肤。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
function handleEquipSkin(skin: CharacterSkin): void {
  emit('equip-skin', skin)
}

/**
 * 设置出战战宠
 */
function handleSetActivePet(petId: string) {
  emit('set-active-pet', petId)
}

/**
 * 喂食战宠
 */
function handleFeedPet(petId: string, inventoryId: string, quantity: number) {
  emit('feed-pet', petId, inventoryId, quantity)
}

/**
 * 进化战宠
 */
function handleEvolvePet(petId: string) {
  emit('evolve-pet', petId)
}

/**
 * 重命名战宠
 */
function handleRenamePet(petId: string, nickname: string) {
  emit('rename-pet', petId, nickname)
}

/**
 * 装备技能
 */
function handleEquipSkill(petId: string, skillId: number, slotIndex: number) {
  emit('equip-skill', petId, skillId, slotIndex)
}

/**
 * 卸下技能
 */
function handleUnequipSkill(petId: string, slotIndex: number) {
  emit('unequip-skill', petId, slotIndex)
}

/**
 * 穿戴战宠装备
 */
function handleEquipItem(petId: string, inventoryId: string, slotType: 'armor' | 'accessory') {
  emit('equip-item', petId, inventoryId, slotType)
}

/**
 * 卸下战宠装备
 */
function handleUnequipItem(petId: string, slotType: 'armor' | 'accessory') {
  emit('unequip-item', petId, slotType)
}
</script>
