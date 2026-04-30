<!--
  CharacterStats.vue
  角色属性面板组件
  显示 HP/MP/经验条、基础属性和衍生属性
  包含属性加点功能
-->
<template>
  <div class="char-stats">
    <!-- HP 条 -->
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__label" style="color: var(--accent-green)">HP</span>
        <span class="stat-bar__value">{{ character.hp }} / {{ character.maxHp }}</span>
      </div>
      <div class="stat-bar__track">
        <div
          class="stat-bar__fill stat-bar__fill--hp"
          :class="{
            'low': hpPercent < 25,
            'warning': hpPercent >= 25 && hpPercent < 50
          }"
          :style="{ width: hpPercent + '%' }"
        />
      </div>
    </div>

    <!-- MP 条 -->
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__label" style="color: var(--accent-blue)">MP</span>
        <span class="stat-bar__value">{{ character.mp }} / {{ character.maxMp }}</span>
      </div>
      <div class="stat-bar__track">
        <div
          class="stat-bar__fill stat-bar__fill--mp"
          :style="{ width: mpPercent + '%' }"
        />
      </div>
    </div>

    <!-- 经验条 -->
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__label" style="color: var(--accent-gold)">EXP</span>
        <span class="stat-bar__value">{{ character.experience }} / {{ character.nextLevelExp }}</span>
      </div>
      <div class="stat-bar__track">
        <div
          class="stat-bar__fill stat-bar__fill--exp"
          :style="{ width: expPercent + '%' }"
        />
      </div>
    </div>

    <!-- 基础属性区域 -->
    <div class="char-stats__section">
      <div class="char-stats__title">基础属性</div>

      <!-- 属性加点模式 -->
      <CharacterAttributePoint
        v-if="character.availablePoints > 0 && isAllocating"
        :available-points="character.availablePoints"
        :strength="character.strength"
        :intelligence="character.intelligence"
        :agility="character.agility"
        @confirm="handleConfirm"
        @cancel="isAllocating = false"
      />

      <!-- 正常显示模式 -->
      <div v-else class="char-stats__grid">
        <CharacterStatItem
          label="力量"
          :value="character.strength"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('strength')"
        />
        <CharacterStatItem
          label="智力"
          :value="character.intelligence"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('intelligence')"
        />
        <CharacterStatItem
          label="敏捷"
          :value="character.agility"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('agility')"
        />
      </div>

      <!-- 可用点数提示 -->
      <div v-if="character.availablePoints > 0 && !isAllocating" class="char-stats__points-tip">
        <Sparkles :size="14" style="color: var(--accent-gold)" />
        <span>有 {{ character.availablePoints }} 点属性点可分配</span>
      </div>
    </div>

    <!-- 衍生属性区域 -->
    <div class="char-stats__section">
      <div class="char-stats__title">衍生属性</div>
      <div class="char-stats__grid">
        <CharacterStatItem label="物攻" :value="character.physicalAttack" />
        <CharacterStatItem label="魔攻" :value="character.magicAttack" />
        <CharacterStatItem label="防御" :value="character.defense" />
        <CharacterStatItem label="闪避" :value="character.dodgeRate" :show-percent="true" />
        <CharacterStatItem label="暴击" :value="character.criticalRate" :show-percent="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import type { CharacterInfo } from '../../api/character'
import CharacterStatItem from './CharacterStatItem.vue'
import CharacterAttributePoint from './CharacterAttributePoint.vue'

/**
 * 角色属性面板组件
 * @param character - 角色完整数据
 * @emits refresh - 加点后需要刷新数据
 */

interface Props {
  character: CharacterInfo
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 是否处于加点模式 */
const isAllocating = ref(false)

/** HP百分比 */
const hpPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.character.hp / props.character.maxHp) * 100))
})

/** MP百分比 */
const mpPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.character.mp / props.character.maxMp) * 100))
})

/** 经验百分比 */
const expPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.character.experience / props.character.nextLevelExp) * 100))
})

/**
 * 开始加点流程
 */
function startAllocating(attr: 'strength' | 'intelligence' | 'agility') {
  isAllocating.value = true
}

/**
 * 确认加点
 */
function handleConfirm(points: { str: number; int: number; agi: number }) {
  // 加点逻辑由父组件 CharacterPanel 处理
  emit('refresh')
  isAllocating.value = false
}
</script>

<style scoped>
.char-stats {
  padding: 12px 0;
}

/* 进度条样式 */
.stat-bar {
  margin-bottom: 8px;
}

.stat-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: var(--font-size-xs, 12px);
}

.stat-bar__label {
  font-weight: 600;
}

.stat-bar__value {
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  font-variant-numeric: tabular-nums;
}

.stat-bar__track {
  height: 10px;
  border-radius: 5px;
  background: var(--bg-body, #f5f5f7);
  overflow: hidden;
}

.stat-bar__fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.stat-bar__fill--hp {
  background: linear-gradient(90deg, #34c759, #32d74b);
}

.stat-bar__fill--hp.low {
  background: linear-gradient(90deg, #ff3b30, #ff453a);
}

.stat-bar__fill--hp.warning {
  background: linear-gradient(90deg, #f59e0b, #ffd60a);
}

.stat-bar__fill--mp {
  background: linear-gradient(90deg, #0071e3, #0a84ff);
}

.stat-bar__fill--exp {
  background: linear-gradient(90deg, #f59e0b, #ffd60a);
}

/* 属性区域 */
.char-stats__section {
  margin-top: 12px;
}

.char-stats__title {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  margin-bottom: 8px;
}

.char-stats__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
}

.char-stats__points-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.1);
  font-size: var(--font-size-xs, 12px);
  color: var(--accent-gold, #f59e0b);
}
</style>