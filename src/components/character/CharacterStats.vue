<!--
  CharacterStats.vue
  角色属性面板组件
  显示 HP/MP/经验条、基础属性和衍生属性
  包含属性加点、经验条动画和升级动效
-->
<template>
  <div class="char-stats">
    <UiStatBar
      label="气血"
      :value="character.hp"
      :max="character.maxHp"
      :tone="hpTone"
    />

    <UiStatBar
      label="内力"
      :value="character.mp"
      :max="character.maxMp"
      tone="mp"
    />

    <UiStatBar
      label="EXP"
      :value="displayedExpPercent"
      :max="100"
      tone="exp"
      :tag="character.level >= 100 ? 'MAX' : ''"
      :value-text="expValueText"
      :flash="isExpFlashing"
    />

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
          label="臂力"
          :value="character.strength"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('strength')"
        />
        <CharacterStatItem
          label="根骨"
          :value="character.intelligence"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('intelligence')"
        />
        <CharacterStatItem
          label="身法"
          :value="character.agility"
          :show-add-button="character.availablePoints > 0"
          :add-button-visible="character.availablePoints > 0"
          @add="startAllocating('agility')"
        />
      </div>

      <!-- 可用点数提示 -->
      <div v-if="character.availablePoints > 0 && !isAllocating" class="char-stats__points-tip">
        <Sparkles :size="14" class="char-stats__points-icon" />
        <span>有 {{ character.availablePoints }} 点属性点可分配</span>
      </div>
    </div>

    <!-- 衍生属性区域 -->
    <div class="char-stats__section">
      <div class="char-stats__title">衍生属性</div>
      <div class="char-stats__grid">
        <CharacterStatItem label="外功" :value="statsBreakdown.total.physicalAttack" />
        <CharacterStatItem label="内功" :value="statsBreakdown.total.magicAttack" />
        <CharacterStatItem label="防御" :value="statsBreakdown.total.defense" />
        <CharacterStatItem label="闪避" :value="statsBreakdown.total.dodgeRate" :show-percent="true" />
        <CharacterStatItem label="暴击" :value="statsBreakdown.total.criticalRate" :show-percent="true" />
      </div>

      <!-- 属性加成明细 -->
      <div class="char-stats__breakdown">
        <div class="char-stats__breakdown-row">
          <span class="char-stats__breakdown-label">基础</span>
          <span class="char-stats__breakdown-value">外功 {{ statsBreakdown.base.physicalAttack }} · 内功 {{ statsBreakdown.base.magicAttack }} · 防御 {{ statsBreakdown.base.defense }}</span>
        </div>
        <div class="char-stats__breakdown-row">
          <span class="char-stats__breakdown-label">装备</span>
          <span class="char-stats__breakdown-value char-stats__breakdown-value--equip">外功 +{{ statsBreakdown.equipment.physicalAttack }} · 防御 +{{ statsBreakdown.equipment.defense }}</span>
        </div>
        <div v-if="hasPetBonus" class="char-stats__breakdown-row">
          <span class="char-stats__breakdown-label">战宠</span>
          <span class="char-stats__breakdown-value char-stats__breakdown-value--pet">
            <template v-if="statsBreakdown.pet.hp">气血 +{{ statsBreakdown.pet.hp }}</template>
            <template v-if="statsBreakdown.pet.attack">攻击 +{{ statsBreakdown.pet.attack }}</template>
            <template v-if="statsBreakdown.pet.defense">防御 +{{ statsBreakdown.pet.defense }}</template>
            <template v-if="statsBreakdown.pet.criticalRate">暴击 +{{ (statsBreakdown.pet.criticalRate * 100).toFixed(1) }}%</template>
            <template v-if="statsBreakdown.pet.dodgeRate">闪避 +{{ (statsBreakdown.pet.dodgeRate * 100).toFixed(1) }}%</template>
          </span>
        </div>
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
import type { PetInfo } from '../../types/pet'
import { getJobConfigByProfession } from '../../config/job_config'
import { calculateFullStats } from '../../utils/attributeCalculator'
import { useCharacterStore } from '../../stores/character'
import CharacterStatItem from './CharacterStatItem.vue'
import CharacterAttributePoint from './CharacterAttributePoint.vue'
import LevelUpEffect from '../common/LevelUpEffect.vue'
import LevelUpModal from '../common/LevelUpModal.vue'
import { UiStatBar, type StatTone } from '../ui'

/**
 * 角色属性面板组件
 * @param character - 角色完整数据
 * @param levelUpResult - 升级结果（如有升级）
 * @emits refresh - 加点/升级后需要刷新数据（已弃用，现由 store 直接更新）
 */

interface Props {
  character: CharacterInfo
  activePet?: PetInfo | null
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

/**
 * 根据血量百分比返回状态条色调。
 * @returns HP 状态条使用的视觉语义
 */
const hpTone = computed<StatTone>(() => {
  if (hpPercent.value < 25) return 'danger'
  if (hpPercent.value < 50) return 'warning'
  return 'hp'
})

/**
 * 格式化经验值展示文案。
 * @returns 满级提示或当前经验进度
 */
const expValueText = computed(() =>
  props.character.level >= 100
    ? '已满级'
    : `${props.character.experience} / ${props.character.nextLevelExp}`
)

/** 属性加成明细（基础 + 装备 + 战宠） */
const statsBreakdown = computed(() => {
  return calculateFullStats(
    { strength: props.character.strength, intelligence: props.character.intelligence, agility: props.character.agility },
    props.character.profession,
    props.character.equipment,
    props.activePet?.bonusToOwner ?? null
  )
})

/** 战宠加成是否有值 */
const hasPetBonus = computed(() => {
  const p = statsBreakdown.value.pet
  return !!(p.hp || p.attack || p.defense || p.criticalRate || p.dodgeRate)
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
