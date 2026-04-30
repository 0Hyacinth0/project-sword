<!--
  CharacterStats.vue
  角色属性面板组件
  显示 HP/MP/经验条、基础属性和衍生属性
  包含属性加点、经验条动画和升级动效
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
        <span class="stat-bar__label" style="color: var(--accent-gold)">
          EXP
          <span v-if="character.level >= 100" class="stat-bar__max-tag">MAX</span>
        </span>
        <span class="stat-bar__value">
          {{ character.level >= 100 ? '已满级' : `${character.experience} / ${character.nextLevelExp}` }}
        </span>
      </div>
      <div class="stat-bar__track">
        <!-- 正常填充 -->
        <div
          class="stat-bar__fill stat-bar__fill--exp"
          :class="{ 'stat-bar__fill--exp-flash': isExpFlashing }"
          :style="{ width: displayedExpPercent + '%' }"
        />
        <!-- 升级闪光效果 -->
        <div
          v-if="isExpFlashing"
          class="stat-bar__flash"
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
        :profession="character.profession"
        :loading="isSubmitting"
        :error-msg="errorMsg"
        @confirm="handleConfirm"
        @cancel="handleCancel"
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

    <!-- 升级庆祝动效 -->
    <LevelUpEffect
      :visible="showLevelUpEffect"
      :old-level="levelUpData.oldLevel"
      :new-level="levelUpData.newLevel"
      @close="handleEffectEnd"
    />

    <!-- 升级结果弹窗 -->
    <LevelUpModal
      :visible="showLevelUpModal"
      :result="levelUpData"
      :base-attrs="{ strength: character.strength, intelligence: character.intelligence, agility: character.agility }"
      :profession="character.profession"
      :skills="jobSkills"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import type { CharacterInfo } from '../../api/character'
import type { LevelUpResult } from '../../utils/levelConfig'
import type { UpdateAttributesParams } from '../../api/character'
import { getJobConfigByProfession } from '../../config/job_config'
import { useCharacterStore } from '../../stores/character'
import CharacterStatItem from './CharacterStatItem.vue'
import CharacterAttributePoint from './CharacterAttributePoint.vue'
import LevelUpEffect from '../common/LevelUpEffect.vue'
import LevelUpModal from '../common/LevelUpModal.vue'

/**
 * 角色属性面板组件
 * @param character - 角色完整数据
 * @param levelUpResult - 升级结果（如有升级）
 * @emits refresh - 加点/升级后需要刷新数据（已弃用，现由 store 直接更新）
 */

interface Props {
  character: CharacterInfo
  levelUpResult?: LevelUpResult | null
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const characterStore = useCharacterStore()

/** 是否处于加点模式 */
const isAllocating = ref(false)

/** 加点处理中 */
const isSubmitting = ref(false)

/** 加点错误信息 */
const errorMsg = ref<string | null>(null)

/** 经验条闪烁状态（升级时触发） */
const isExpFlashing = ref(false)

/** 用于动画的经验百分比（先填满再归零） */
const displayedExpPercent = computed(() => {
  if (props.character.level >= 100) return 100
  if (isExpFlashing.value) return 100
  return Math.max(0, Math.min(100, (props.character.experience / props.character.nextLevelExp) * 100))
})

/** 升级动效显示状态 */
const showLevelUpEffect = ref(false)

/** 升级弹窗显示状态 */
const showLevelUpModal = ref(false)

/** 升级数据 */
const levelUpData = ref<LevelUpResult>({
  oldLevel: 1,
  newLevel: 1,
  levelsGained: 0,
  pointsGained: 0,
  overflowExp: 0,
  isNewMaxLevel: false
})

/** 当前职业技能列表 */
const jobSkills = computed(() => {
  const config = getJobConfigByProfession(props.character.profession)
  return config?.skills ?? []
})

/** HP百分比 */
const hpPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.character.hp / props.character.maxHp) * 100))
})

/** MP百分比 */
const mpPercent = computed(() => {
  return Math.max(0, Math.min(100, (props.character.mp / props.character.maxMp) * 100))
})

/**
 * 监听升级结果，触发动画流程
 * 流程：经验条填满闪光 → 升级庆祝动效 → 升级弹窗
 */
watch(() => props.levelUpResult, (result) => {
  if (!result || result.levelsGained <= 0) return

  levelUpData.value = result

  // 第一阶段：经验条填满 + 闪光
  isExpFlashing.value = true

  // 第二阶段：闪光结束后播放升级动效
  setTimeout(() => {
    isExpFlashing.value = false
    showLevelUpEffect.value = true
  }, 600)
}, { immediate: true })

/**
 * 升级动效结束，显示弹窗
 */
function handleEffectEnd() {
  showLevelUpEffect.value = false
  showLevelUpModal.value = true
}

/**
 * 关闭升级弹窗
 */
function handleModalClose() {
  showLevelUpModal.value = false
}

/**
 * 开始加点流程
 */
function startAllocating(_attr: 'strength' | 'intelligence' | 'agility') {
  isAllocating.value = true
  errorMsg.value = null
}

/**
 * 取消加点
 */
function handleCancel() {
  isAllocating.value = false
  errorMsg.value = null
}

/**
 * 确认加点
 * 调用 store 的 updateAttributes 发起 API 请求
 */
async function handleConfirm(points: { str: number; int: number; agi: number }) {
  const params: UpdateAttributesParams = {
    characterId: props.character.id,
    str: points.str,
    int: points.int,
    agi: points.agi
  }

  isSubmitting.value = true
  errorMsg.value = null

  const { success, message } = await characterStore.updateAttributes(params)

  isSubmitting.value = false

  if (success) {
    isAllocating.value = false
    emit('refresh')
  } else {
    errorMsg.value = message
    // 3 秒后自动清除错误
    setTimeout(() => {
      if (errorMsg.value === message) errorMsg.value = null
    }, 3000)
  }
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-bar__max-tag {
  font-size: var(--font-size-caption, 11px);
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--accent-gold, #f59e0b);
  color: #fff;
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
  position: relative;
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

/* 经验条升级闪光 */
.stat-bar__fill--exp-flash {
  animation: expFlash 0.5s ease;
}

@keyframes expFlash {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.8); box-shadow: 0 0 12px rgba(245, 158, 11, 0.6); }
  100% { filter: brightness(1.3); }
}

/* 经验条溢出光效 */
.stat-bar__flash {
  position: absolute;
  inset: 0;
  border-radius: 5px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: flashSweep 0.5s ease;
}

@keyframes flashSweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
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