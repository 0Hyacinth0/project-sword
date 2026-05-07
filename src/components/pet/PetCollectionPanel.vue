<!--
  PetCollectionPanel.vue
  战宠图鉴 - 网格展示、收集进度、筛选
  点击战宠卡片可展开详情弹窗
-->
<template>
  <div class="pet-collection">
    <!-- 顶部：标题 + 收集进度 -->
    <div class="pet-collection__header">
      <span class="pet-collection__title">战宠图鉴</span>
      <span class="pet-collection__progress">
        已收集 <span class="pet-collection__count">{{ ownedTypeIds.length }}</span>/{{ allTypes.length }}
      </span>
    </div>

    <!-- 元素筛选 -->
    <div class="pet-collection__filters">
      <button
        class="pet-collection__filter"
        :class="{ 'pet-collection__filter--active': elementFilter === 0 }"
        @click="elementFilter = 0"
      >
        全部
      </button>
      <button
        v-for="(el, key) in ELEMENT_LABELS"
        :key="key"
        class="pet-collection__filter"
        :class="{ 'pet-collection__filter--active': elementFilter === Number(key) }"
        :style="elementFilter === Number(key) ? { background: el.color + '20', color: el.color, borderColor: el.color } : {}"
        @click="elementFilter = Number(key)"
      >
        {{ el.name }}
      </button>
    </div>

    <!-- 网格展示 -->
    <div class="pet-collection__grid">
      <div
        v-for="type in filteredTypes"
        :key="type.petTypeId"
        class="pet-collection__card"
        :class="{ 'pet-collection__card--owned': isOwned(type.petTypeId) }"
        @click="handleClickCard(type)"
      >
        <!-- 已拥有 -->
        <template v-if="isOwned(type.petTypeId)">
          <div
            class="pet-collection__card-avatar"
            :style="{ borderColor: getRarityColor(type.rarity), background: getRarityColor(type.rarity) + '14' }"
          >
            <Flame :size="20" :style="{ color: getRarityColor(type.rarity) }" />
          </div>
          <div class="pet-collection__card-name" :style="{ color: getRarityColor(type.rarity) }">{{ type.name }}</div>
          <div class="pet-collection__card-meta">
            <span :style="{ color: ELEMENT_LABELS[type.element]?.color }">{{ ELEMENT_LABELS[type.element]?.name }}</span>
            <span>{{ PET_RARITY_LABEL[type.rarity as PetRarity] }}</span>
          </div>
        </template>
        <!-- 未拥有：剪影 -->
        <template v-else>
          <div class="pet-collection__card-avatar pet-collection__card-avatar--unknown">
            <EyeOff :size="20" />
          </div>
          <div class="pet-collection__card-name pet-collection__card-name--unknown">???</div>
          <div class="pet-collection__card-meta pet-collection__card-meta--unknown">
            <span :style="{ color: ELEMENT_LABELS[type.element]?.color }">{{ ELEMENT_LABELS[type.element]?.name }}</span>
            <span>{{ PET_RARITY_LABEL[type.rarity as PetRarity] }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Transition name="modal-fade">
      <div v-if="selectedType" class="pet-collection__modal">
        <div class="pet-collection__modal-header">
          <span class="pet-collection__modal-name" :style="{ color: getRarityColor(selectedType.rarity) }">{{ selectedType.name }}</span>
          <button class="pet-collection__modal-close" @click="selectedType = null">
            <X :size="16" />
          </button>
        </div>

        <!-- 属性雷达图 -->
        <div class="pet-collection__radar">
          <div class="pet-collection__radar-label">属性分布</div>
          <div class="pet-collection__radar-bars">
            <div v-for="dim in radarDims" :key="dim.key" class="pet-collection__radar-bar">
              <span class="pet-collection__radar-dim">{{ dim.label }}</span>
              <div class="pet-collection__radar-track">
                <div class="pet-collection__radar-fill" :style="{ width: getRadarPercent(selectedType, dim.key) + '%', background: dim.color }" />
              </div>
              <span class="pet-collection__radar-value">{{ getStatValue(selectedType, dim.key) }}</span>
            </div>
          </div>
        </div>

        <!-- 进化链 -->
        <div v-if="evolveChain.length > 1" class="pet-collection__evolve-chain">
          <div class="pet-collection__evolve-title">进化链</div>
          <div class="pet-collection__evolve-steps">
            <div v-for="(step, idx) in evolveChain" :key="step.petTypeId" class="pet-collection__evolve-step">
              <span :style="{ color: getRarityColor(step.rarity) }">{{ step.name }}</span>
              <span class="pet-collection__evolve-rarity">{{ PET_RARITY_LABEL[step.rarity as PetRarity] }}</span>
              <span v-if="idx < evolveChain.length - 1" class="pet-collection__evolve-arrow">→</span>
            </div>
          </div>
        </div>

        <!-- 技能列表 -->
        <div class="pet-collection__skills">
          <div class="pet-collection__skills-title">技能（{{ selectedType.skills.length }}）</div>
          <div v-for="skill in selectedType.skills" :key="skill.id" class="pet-collection__skill">
            <span class="pet-collection__skill-name">{{ skill.name }}</span>
            <span class="pet-collection__skill-type">{{ SKILL_TYPE_LABELS[skill.type] || skill.type }}</span>
            <span v-if="skill.power" class="pet-collection__skill-power">{{ skill.power }}%</span>
          </div>
        </div>

        <!-- 描述 -->
        <div class="pet-collection__desc">{{ selectedType.description }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Flame, EyeOff, X } from 'lucide-vue-next'
import type { PetRarity } from '../../types/pet'
import { PET_RARITY_LABEL, PET_RARITY_COLORS } from '../../types/pet'
import { ELEMENT_LABELS, SKILL_TYPE_LABELS, getAllPetTypes, getEvolveChain } from '../../config/pet_config'
import type { PetTypeConfig } from '../../config/pet_config'

/**
 * 战宠图鉴面板组件
 * @param ownedTypeIds - 角色已拥有的战宠类型 ID 列表
 */

interface Props {
  ownedTypeIds: number[]
}

const props = defineProps<Props>()

/** 所有战宠类型 */
const allTypes = computed(() => getAllPetTypes())

/** 元素筛选 */
const elementFilter = ref(0)

/** 筛选后的类型列表 */
const filteredTypes = computed(() => {
  if (elementFilter.value === 0) return allTypes.value
  return allTypes.value.filter(t => t.element === elementFilter.value)
})

/** 是否已拥有 */
function isOwned(petTypeId: number): boolean {
  return props.ownedTypeIds.includes(petTypeId)
}

/** 稀有度颜色 */
function getRarityColor(rarity: number): string {
  return PET_RARITY_COLORS[rarity as PetRarity]?.light || '#8e8e93'
}

/** 选中的战宠类型 */
const selectedType = ref<PetTypeConfig | null>(null)

/** 进化链 */
const evolveChain = computed(() => {
  if (!selectedType.value) return []
  return getEvolveChain(selectedType.value.petTypeId)
})

/** 雷达图维度 */
const radarDims = [
  { key: 'baseHp', label: '生命', color: '#34c759', max: 200 },
  { key: 'baseAttack', label: '攻击', color: '#ff3b30', max: 40 },
  { key: 'baseDefense', label: '防御', color: '#0071e3', max: 20 },
  { key: 'baseSpeed', label: '速度', color: '#f59e0b', max: 30 }
]

/** 雷达百分比 */
function getRadarPercent(type: PetTypeConfig, key: string): number {
  const dim = radarDims.find(d => d.key === key)
  if (!dim) return 0
  const value = (type as unknown as Record<string, number>)[key] || 0
  return Math.min(100, Math.round((value / dim.max) * 100))
}

/** 属性值 */
function getStatValue(type: PetTypeConfig, key: string): number {
  return (type as unknown as Record<string, number>)[key] || 0
}

/** 点击卡片 */
function handleClickCard(type: PetTypeConfig) {
  selectedType.value = type
}
</script>

<style scoped>
.pet-collection {
  display: flex;
  flex-direction: column;
}

.pet-collection__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pet-collection__title {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  color: var(--text-primary);
}

.pet-collection__progress {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
}

.pet-collection__count {
  color: var(--accent-gold, #f59e0b);
  font-weight: 600;
}

/* 元素筛选 */
.pet-collection__filters {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.pet-collection__filter {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.06);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.5));
  cursor: pointer;
  transition: all 0.15s ease;
}

.pet-collection__filter--active {
  background: var(--accent-blue, #0071e3);
  color: #fff;
  border-color: var(--accent-blue, #0071e3);
}

/* 网格 */
.pet-collection__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pet-collection__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pet-collection__card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.pet-collection__card--owned {
  border-color: rgba(255, 255, 255, 0.12);
}

.pet-collection__card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.pet-collection__card-avatar--unknown {
  border-color: rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.06);
  color: rgba(128, 128, 128, 0.3);
}

.pet-collection__card-name {
  font-size: var(--font-size-xs, 12px);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.pet-collection__card-name--unknown {
  color: rgba(128, 128, 128, 0.3);
}

.pet-collection__card-meta {
  display: flex;
  gap: 4px;
  font-size: 10px;
  margin-top: 2px;
  color: var(--text-muted, rgba(0, 0, 0, 0.4));
}

.pet-collection__card-meta--unknown {
  color: rgba(128, 128, 128, 0.2);
}

/* 详情弹窗 */
.pet-collection__modal {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 10px;
  z-index: 10;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.pet-collection__modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pet-collection__modal-name {
  font-size: var(--font-size-base, 16px);
  font-weight: 600;
}

.pet-collection__modal-close {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 2px;
}

/* 雷达图（条形图替代） */
.pet-collection__radar {
  margin-bottom: 10px;
}

.pet-collection__radar-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.pet-collection__radar-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pet-collection__radar-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.pet-collection__radar-dim {
  width: 28px;
  color: rgba(255, 255, 255, 0.5);
}

.pet-collection__radar-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pet-collection__radar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pet-collection__radar-value {
  width: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 进化链 */
.pet-collection__evolve-chain {
  margin-bottom: 10px;
}

.pet-collection__evolve-title {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.pet-collection__evolve-steps {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs, 12px);
}

.pet-collection__evolve-step {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pet-collection__evolve-rarity {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.pet-collection__evolve-arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

/* 技能 */
.pet-collection__skills {
  margin-bottom: 10px;
}

.pet-collection__skills-title {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.pet-collection__skill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  margin-bottom: 3px;
}

.pet-collection__skill-name {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.pet-collection__skill-type {
  color: var(--accent-blue, #0071e3);
}

.pet-collection__skill-power {
  color: rgba(255, 255, 255, 0.4);
}

/* 描述 */
.pet-collection__desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

/* 弹窗过渡 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>