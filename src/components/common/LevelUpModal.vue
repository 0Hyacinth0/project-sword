<!--
  LevelUpModal.vue
  升级结果弹窗组件
  显示等级变化、属性点奖励、新解锁技能
-->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="levelup-modal" @click.self="handleClose">
        <div class="levelup-modal__card">
          <!-- 标题 -->
          <div class="levelup-modal__header">
            <Sparkles :size="20" class="levelup-modal__icon" />
            <span>恭喜升级</span>
          </div>

          <!-- 等级变化 -->
          <div class="levelup-modal__level">
            <span class="levelup-modal__level-old">Lv.{{ result.oldLevel }}</span>
            <ChevronRight :size="18" class="levelup-modal__arrow" />
            <span class="levelup-modal__level-new">Lv.{{ result.newLevel }}</span>
            <span v-if="result.levelsGained > 1" class="levelup-modal__multi">
              (+{{ result.levelsGained }} 级)
            </span>
          </div>

          <!-- 奖励列表 -->
          <div class="levelup-modal__rewards">
            <div class="levelup-modal__reward-title">获得奖励</div>

            <!-- 属性点 -->
            <div class="levelup-modal__reward-item">
              <div class="levelup-modal__reward-icon levelup-modal__reward-icon--points">
                <Plus :size="14" />
              </div>
              <span>自由属性点 ×{{ result.pointsGained }}</span>
            </div>

            <!-- 衍生属性变化 -->
            <div v-if="derivedChanges" class="levelup-modal__derived">
              <div v-for="change in derivedChanges" :key="change.label" class="levelup-modal__derived-item">
                <span class="levelup-modal__derived-label">{{ change.label }}</span>
                <span class="levelup-modal__derived-value">+{{ change.value }}</span>
              </div>
            </div>

            <!-- 新解锁技能 -->
            <div v-if="unlockedSkills.length > 0" class="levelup-modal__skills">
              <div class="levelup-modal__skill-title">新技能解锁</div>
              <div
                v-for="skill in unlockedSkills"
                :key="skill.name"
                class="levelup-modal__skill"
              >
                <component :is="getSkillIcon(skill.icon)" :size="16" />
                <div class="levelup-modal__skill-info">
                  <span class="levelup-modal__skill-name">{{ skill.name }}</span>
                  <span class="levelup-modal__skill-desc">{{ skill.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 确认按钮 -->
          <button class="levelup-modal__btn" @click="handleClose">
            太棒了
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Sparkles, ChevronRight, Plus,
  Swords, Shield, Flame, Crosshair, Clock, Eye
} from 'lucide-vue-next'
import type { LevelUpResult } from '../../utils/levelConfig'
import type { SkillInfo } from '../../config/job_config'

/**
 * 升级结果弹窗组件
 * @param visible - 是否显示
 * @param result - 升级结果数据
 * @param baseAttrs - 升级前的基础属性
 * @param profession - 职业编号
 * @param skills - 当前职业技能列表
 * @emits close - 关闭弹窗
 */

interface Props {
  visible: boolean
  result: LevelUpResult
  baseAttrs: { strength: number; intelligence: number; agility: number }
  profession: number
  skills: SkillInfo[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 衍生属性变化 */
const derivedChanges = computed(() => {
  if (props.result.levelsGained === 0) return null

  const pointsPerLevel = 3
  const totalPoints = props.result.levelsGained * pointsPerLevel

  // 展示属性点可用于带来的预期提升
  if (totalPoints === 0) return null

  return [
    { label: '可分配属性点', value: `${totalPoints} 点` }
  ]
})

/** 新解锁的技能 */
const unlockedSkills = computed(() => {
  const oldLevel = props.result.oldLevel
  const newLevel = props.result.newLevel
  return props.skills.filter(s => s.level > oldLevel && s.level <= newLevel)
})

/**
 * 获取技能图标组件
 */
function getSkillIcon(iconName: string) {
  const iconMap: Record<string, ReturnType<typeof Swords>> = {
    Swords, Shield, Flame, Crosshair, Clock, Eye
  }
  return iconMap[iconName] || Swords
}

/**
 * 关闭弹窗
 */
function handleClose() {
  emit('close')
}
</script>
