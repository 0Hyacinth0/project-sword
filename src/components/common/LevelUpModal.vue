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
import { calculateBaseStats } from '../../utils/attributeCalculator'

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
  const oldDerived = calculateBaseStats(props.baseAttrs, props.profession)

  // 假设每级升级时基础属性不自动增长，由玩家手动分配属性点
  // 衍生属性变化来自于职业加成系数下的等级间接影响
  // 这里展示的是属性点带来的潜在变化
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

<style scoped>
/* 遮罩 */
.levelup-modal {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 20px;
}

/* 卡片 */
.levelup-modal__card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-glass, rgba(255, 255, 255, 0.72));
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.3));
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* 标题 */
.levelup-modal__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: var(--font-size-large, 18px);
  font-weight: 600;
  color: var(--accent-gold, #f59e0b);
}

.levelup-modal__icon {
  animation: iconSpin 2s linear infinite;
}

@keyframes iconSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 等级变化 */
.levelup-modal__level {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
  font-weight: 700;
}

.levelup-modal__level-old {
  font-size: var(--font-size-large, 18px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.levelup-modal__arrow {
  color: var(--accent-gold, #f59e0b);
}

.levelup-modal__level-new {
  font-size: 28px;
  color: var(--accent-gold, #f59e0b);
  text-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
}

.levelup-modal__multi {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  font-weight: 400;
}

/* 奖励区域 */
.levelup-modal__rewards {
  padding: 12px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.06);
  margin: 12px 0;
}

.levelup-modal__reward-title {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  margin-bottom: 8px;
}

.levelup-modal__reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
}

.levelup-modal__reward-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.levelup-modal__reward-icon--points {
  background: rgba(52, 199, 89, 0.15);
  color: var(--accent-green, #34c759);
}

/* 衍生属性 */
.levelup-modal__derived {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
}

.levelup-modal__derived-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs, 12px);
}

.levelup-modal__derived-label {
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.levelup-modal__derived-value {
  font-weight: 600;
  color: var(--accent-green, #34c759);
}

/* 技能解锁 */
.levelup-modal__skills {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.levelup-modal__skill-title {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  color: var(--accent-gold, #f59e0b);
  margin-bottom: 8px;
}

.levelup-modal__skill {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  color: var(--accent-gold, #f59e0b);
}

.levelup-modal__skill-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.levelup-modal__skill-name {
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  color: var(--text-primary, #1d1d1f);
}

.levelup-modal__skill-desc {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
  line-height: 1.4;
}

/* 确认按钮 */
.levelup-modal__btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: var(--accent-gold, #f59e0b);
  color: #fff;
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
  margin-top: 4px;
}

.levelup-modal__btn:hover {
  filter: brightness(1.1);
}

/* 过渡动画 */
.modal-enter-active {
  animation: modalIn 0.4s ease;
}

.modal-leave-active {
  animation: modalOut 0.25s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .levelup-modal__derived {
    border-top-color: rgba(255, 255, 255, 0.08);
  }

  .levelup-modal__skills {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}
</style>