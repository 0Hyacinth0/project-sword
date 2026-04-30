<!--
  CharacterPetCard.vue
  战宠概览卡片组件
  显示出战战宠的基本信息和给主人的属性加成
-->
<template>
  <div class="pet-card" @click="$emit('click')">
    <!-- 有出战战宠 -->
    <template v-if="pet">
      <div class="pet-card__header">
        <div
          class="pet-card__avatar"
          :style="{ borderColor: rarityColor }"
        >
          <Flame :size="20" :style="{ color: rarityColor }" />
        </div>
        <div class="pet-card__info">
          <div class="pet-card__name">{{ pet.nickname }}</div>
          <div class="pet-card__meta">
            <span class="pet-card__level">Lv.{{ pet.level }}</span>
            <span
              class="pet-card__rarity-tag"
              :style="{
                background: rarityBgColor,
                color: rarityColor
              }"
            >
              {{ rarityLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- 经验条 -->
      <div class="pet-card__exp">
        <div class="pet-card__exp-track">
          <div
            class="pet-card__exp-fill"
            :style="{ width: expPercent + '%' }"
          />
        </div>
        <span class="pet-card__exp-text">{{ pet.exp }}/{{ pet.maxExp }}</span>
      </div>

      <!-- 属性概览 -->
      <div class="pet-card__stats">
        <div class="pet-card__stat">
          <Heart :size="12" style="color: var(--accent-green)" />
          <span>{{ pet.stats.hp }}</span>
        </div>
        <div class="pet-card__stat">
          <Swords :size="12" style="color: var(--accent-red)" />
          <span>{{ pet.stats.attack }}</span>
        </div>
        <div class="pet-card__stat">
          <Shield :size="12" style="color: var(--accent-blue)" />
          <span>{{ pet.stats.defense }}</span>
        </div>
        <div class="pet-card__stat">
          <Zap :size="12" style="color: var(--accent-gold)" />
          <span>{{ pet.stats.speed }}</span>
        </div>
      </div>

      <!-- 给主人的加成 -->
      <div v-if="hasBonus" class="pet-card__bonus">
        <div class="pet-card__bonus-title">主人加成</div>
        <div class="pet-card__bonus-list">
          <span v-if="pet.bonusToOwner.hp">生命 +{{ pet.bonusToOwner.hp }}</span>
          <span v-if="pet.bonusToOwner.attack">攻击 +{{ pet.bonusToOwner.attack }}</span>
          <span v-if="pet.bonusToOwner.defense">防御 +{{ pet.bonusToOwner.defense }}</span>
          <span v-if="pet.bonusToOwner.criticalRate">暴击 +{{ (pet.bonusToOwner.criticalRate * 100).toFixed(1) }}%</span>
          <span v-if="pet.bonusToOwner.dodgeRate">闪避 +{{ (pet.bonusToOwner.dodgeRate * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </template>

    <!-- 无出战战宠 -->
    <template v-else>
      <div class="pet-card__empty">
        <PawPrint :size="24" class="pet-card__empty-icon" />
        <span class="pet-card__empty-text">未设置出战战宠</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Heart, Swords, Shield, Zap, PawPrint } from 'lucide-vue-next'
import type { PetInfo } from '../../types/pet'
import { PET_RARITY_LABEL, PET_RARITY_COLORS } from '../../types/pet'

/**
 * 战宠概览卡片组件
 * @param pet - 战宠数据（null 表示无出战战宠）
 * @emits click - 点击卡片
 */

interface Props {
  pet: PetInfo | null
}

interface Emits {
  (e: 'click'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

/** 稀有度颜色 */
const rarityColor = computed(() => {
  if (!props.pet) return '#8e8e93'
  return PET_RARITY_COLORS[props.pet.rarity]?.light || '#8e8e93'
})

/** 稀有度背景色 */
const rarityBgColor = computed(() => {
  if (!props.pet) return 'rgba(142, 142, 147, 0.1)'
  const color = rarityColor.value
  return `${color}15`
})

/** 稀有度标签 */
const rarityLabel = computed(() => {
  if (!props.pet) return ''
  return PET_RARITY_LABEL[props.pet.rarity] || 'N'
})

/** 经验百分比 */
const expPercent = computed(() => {
  if (!props.pet) return 0
  return Math.max(0, Math.min(100, (props.pet.exp / props.pet.maxExp) * 100))
})

/** 是否有属性加成 */
const hasBonus = computed(() => {
  if (!props.pet) return false
  const b = props.pet.bonusToOwner
  return !!(b.hp || b.attack || b.defense || b.criticalRate || b.dodgeRate)
})
</script>

<style scoped>
.pet-card {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: transform 0.1s ease, background 0.2s ease;
}

.pet-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.pet-card:active {
  transform: scale(0.98);
}

.pet-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pet-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid;
  background: rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.pet-card__info {
  flex: 1;
  min-width: 0;
}

.pet-card__name {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pet-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.pet-card__level {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.pet-card__rarity-tag {
  font-size: var(--font-size-caption, 11px);
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}

/* 经验条 */
.pet-card__exp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.pet-card__exp-track {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-body, #f5f5f7);
  overflow: hidden;
}

.pet-card__exp-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #f59e0b, #ffd60a);
  transition: width 0.3s ease;
}

.pet-card__exp-text {
  font-size: var(--font-size-caption, 11px);
  color: var(--text-muted, rgba(0, 0, 0, 0.4));
  font-variant-numeric: tabular-nums;
}

/* 属性概览 */
.pet-card__stats {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.pet-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  color: var(--text-primary, #1d1d1f);
}

/* 主人加成 */
.pet-card__bonus {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pet-card__bonus-title {
  font-size: var(--font-size-caption, 11px);
  color: var(--text-muted, rgba(0, 0, 0, 0.4));
  margin-bottom: 4px;
}

.pet-card__bonus-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: var(--font-size-caption, 11px);
  color: var(--accent-green, #34c759);
  font-weight: 500;
}

/* 空状态 */
.pet-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.pet-card__empty-icon {
  color: var(--text-muted, rgba(0, 0, 0, 0.2));
}

.pet-card__empty-text {
  font-size: var(--font-size-small, 14px);
  color: var(--text-muted, rgba(0, 0, 0, 0.36));
}
</style>