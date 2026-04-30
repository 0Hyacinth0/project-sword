<!--
  CharacterPanel.vue
  角色详情主面板容器组件
  通过标签页切换属性、装备、战宠三个模块
-->
<template>
  <div class="char-panel">
    <!-- 基本信息区域（始终显示） -->
    <CharacterBasicInfo
      v-if="character"
      :character="character"
    />

    <!-- 标签页切换 -->
    <div class="char-panel__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="char-panel__tab"
        :class="{ 'char-panel__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="14" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="char-panel__content">
      <!-- 属性面板 -->
      <CharacterStats
        v-if="activeTab === 'stats' && character"
        :character="character"
        @refresh="handleRefresh"
      />

      <!-- 装备概览 -->
      <CharacterEquipmentGrid
        v-if="activeTab === 'equipment' && character"
        :equipment="character.equipment"
        :set-bonuses="setBonuses"
        @click-slot="handleClickSlot"
      />

      <!-- 战宠概览 -->
      <CharacterPetCard
        v-if="activeTab === 'pet'"
        :pet="character?.activePet ?? null"
        @click="handlePetClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue'
import { Activity, Shirt, PawPrint } from 'lucide-vue-next'
import CharacterBasicInfo from './CharacterBasicInfo.vue'
import CharacterStats from './CharacterStats.vue'
import CharacterEquipmentGrid from './CharacterEquipmentGrid.vue'
import CharacterPetCard from './CharacterPetCard.vue'
import type { CharacterInfo } from '../../api/character'
import type { EquipmentSlotType, SetBonus } from '../../types/equipment'

/**
 * 角色详情主面板容器组件
 * @param character - 角色完整数据
 * @param setBonuses - 套装效果列表（可选）
 * @emits refresh - 需要刷新角色数据
 * @emits clickSlot - 点击装备槽位
 * @emits clickPet - 点击战宠卡片
 */

interface Props {
  character: CharacterInfo | null
  setBonuses?: SetBonus[]
}

interface Emits {
  (e: 'refresh'): void
  (e: 'clickSlot', slot: EquipmentSlotType): void
  (e: 'clickPet'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

/** 当前激活的标签页 */
const activeTab = ref<'stats' | 'equipment' | 'pet'>('stats')

/** 标签页配置 */
const tabs: Array<{ key: 'stats' | 'equipment' | 'pet'; label: string; icon: Component }> = [
  { key: 'stats', label: '属性', icon: Activity },
  { key: 'equipment', label: '装备', icon: Shirt },
  { key: 'pet', label: '战宠', icon: PawPrint }
]

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
 * 点击战宠卡片
 */
function handlePetClick() {
  emit('clickPet')
}
</script>

<style scoped>
.char-panel {
  display: flex;
  flex-direction: column;
}

/* 标签页 */
.char-panel__tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-top: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
}

.char-panel__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.char-panel__tab:hover {
  color: var(--text-primary, #1d1d1f);
}

.char-panel__tab--active {
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-primary, #1d1d1f);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 内容区域 */
.char-panel__content {
  margin-top: 8px;
}
</style>