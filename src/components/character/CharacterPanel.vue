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
        v-if="activeTab === 'stats'"
        :character="character"
        :level-up-result="levelUpResult"
        @refresh="handleRefresh"
      />

      <!-- 装备概览（纸娃娃布局） -->
      <CharacterEquipmentGrid
        v-if="activeTab === 'equipment'"
        :equipment="character.equipment"
        :portrait-url="character.portraitUrl"
        :profession="character.profession"
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
import { ref, computed, type Component } from 'vue'
import { Activity, Shirt, PawPrint } from 'lucide-vue-next'
import CharacterStats from './CharacterStats.vue'
import CharacterEquipmentGrid from './CharacterEquipmentGrid.vue'
import CharacterPetCard from './CharacterPetCard.vue'
import type { CharacterInfo } from '../../api/character'
import type { EquipmentSlotType, SetBonus } from '../../types/equipment'
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
  levelUpResult?: LevelUpResult | null
}

interface Emits {
  (e: 'refresh'): void
  (e: 'clickSlot', slot: EquipmentSlotType): void
  (e: 'clickPet'): void
  (e: 'levelUpHandled'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 当前激活的标签页 */
const activeTab = ref<'stats' | 'equipment' | 'pet'>('stats')

/** 标签页配置 */
const tabs: Array<{ key: 'stats' | 'equipment' | 'pet'; label: string; icon: Component }> = [
  { key: 'stats', label: '属性', icon: Activity },
  { key: 'equipment', label: '装备', icon: Shirt },
  { key: 'pet', label: '战宠', icon: PawPrint }
]

/** 职业配置（用于名称和颜色） */
const jobConfig = computed(() => {
  return getJobConfigByProfession(props.character.profession)
})

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
  min-height: 0;
}

/* 基本信息 */
.char-panel__header {
  margin-bottom: 8px;
}

.char-panel__name {
  font-size: var(--font-size-large, 18px);
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.char-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.char-panel__level {
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.char-panel__job-tag {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 标签页 */
.char-panel__tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .char-panel__tabs {
    background: rgba(255, 255, 255, 0.06);
  }

  .char-panel__tab--active {
    background: rgba(255, 255, 255, 0.12);
  }
}
</style>
