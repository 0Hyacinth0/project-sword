<!-- 角色创建页 -->
<template>
  <div class="char-create">
    <ThemeToggle />

    <!-- 顶部导航 -->
    <div class="char-create__nav">
      <UiButton class="char-create__back" variant="ghost" @click="router.push({ name: 'characters' })">
        <template #icon><ArrowLeft :size="16" :stroke-width="1.8" /></template>
        返回
      </UiButton>
      <h1 class="char-create__page-title">创建角色</h1>
      <span class="char-create__nav-spacer" aria-hidden="true" />
    </div>

    <!-- 消息提示 -->
    <UiToastHost :toasts="createToasts" @dismiss="message.text = ''" />

    <!-- 主内容 -->
    <div class="char-create__content">
      <!-- 左侧：雷达图 + 技能 -->
      <UiPanel class="char-create__preview" padding="lg" elevated>
        <div class="char-create__radar-wrap">
          <v-chart :option="radarOption" autoresize />
        </div>

        <p class="char-create__job-desc">{{ currentJob.description }}</p>

        <div class="char-create__skills-title">代表技能</div>
        <div class="char-create__skills">
          <div v-for="skill in currentJob.skills" :key="skill.name" class="skill-item">
            <div class="skill-item__icon" :style="{ background: currentJob.color }">
              <component :is="getSkillIcon(skill.icon)" :size="20" :stroke-width="1.5" />
            </div>
            <div class="skill-item__info">
              <div class="skill-item__name">{{ skill.name }}</div>
              <div class="skill-item__desc">{{ skill.description }}</div>
            </div>
            <span class="skill-item__level">Lv.{{ skill.level }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- 右侧：表单 -->
      <UiPanel class="char-create__form-panel" padding="lg" elevated stretch>
        <!-- 职业切换 -->
        <div class="job-switcher">
          <UiButton
            v-for="job in JOB_LIST"
            :key="job"
            class="job-switcher__btn"
            :class="{ 'job-switcher__btn--active': selectedJob === job }"
            variant="secondary"
            size="sm"
            @click="selectedJob = job"
          >
            <template #icon>
              <span class="job-switcher__icon" :style="{ background: JOB_CONFIGS[job].color }">
              <component :is="getJobLucideIcon(job)" :size="18" :stroke-width="1.5" />
              </span>
            </template>
            <span class="job-switcher__name">{{ JOB_CONFIGS[job].name }}</span>
          </UiButton>
        </div>

        <!-- 角色名 -->
        <div class="char-create__name-group">
          <label class="char-create__name-label" for="char-name">角色名</label>
          <div class="char-create__name-row">
            <input
              id="char-name"
              v-model.trim="charName"
              class="char-create__name-input"
              type="text"
              placeholder="2-12 个字符"
              maxlength="12"
              @input="onNameInput"
            />
            <UiIconButton
              label="随机取名"
              variant="secondary"
              @click="handleRandomName"
            >
              <Dices :size="20" :stroke-width="1.5" />
            </UiIconButton>
          </div>
          <!-- 名称检测状态 -->
          <div
            v-if="nameCheckStatus !== 'idle'"
            class="char-create__name-status"
            :class="`char-create__name-status--${nameCheckStatus}`"
          >
            <Loader2 v-if="nameCheckStatus === 'checking'" :size="14" class="char-create__name-spinner" />
            <CircleCheck v-else-if="nameCheckStatus === 'available'" :size="14" />
            <CircleX v-else-if="nameCheckStatus === 'taken'" :size="14" />
            <span>{{ nameCheckMessage }}</span>
          </div>
          <div v-if="nameError" class="char-create__name-status char-create__name-status--error">
            <CircleX :size="14" />
            <span>{{ nameError }}</span>
          </div>
        </div>

        <!-- 属性面板 -->
        <div class="char-create__stats">
          <div class="char-create__stats-title">初始属性</div>
          <div class="stat-row">
            <span class="stat-row__label">
              <Swords :size="16" :stroke-width="1.5" />
              力量 (STR)
            </span>
            <span class="stat-row__value">{{ currentJob.baseStr }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">
              <Sparkles :size="16" :stroke-width="1.5" />
              智力 (INT)
            </span>
            <span class="stat-row__value">{{ currentJob.baseInt }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">
              <Zap :size="16" :stroke-width="1.5" />
              敏捷 (AGI)
            </span>
            <span class="stat-row__value">{{ currentJob.baseAgi }}</span>
          </div>
        </div>

        <!-- 创建按钮 -->
        <UiButton
          class="char-create__submit"
          block
          size="lg"
          :disabled="!canSubmit || charStore.loading"
          :loading="charStore.loading"
          @click="handleCreate"
        >
          <template #icon><Rocket :size="18" :stroke-width="1.5" /></template>
          {{ charStore.loading ? '创建中...' : '开始冒险' }}
        </UiButton>
      </UiPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { checkCharacterNameApi } from '../api'
import { JOB_CONFIGS, JOB_LIST, generateRandomName, jobTypeToProfession } from '../config/job_config'
import type { JobType } from '../config/job_config'
import ThemeToggle from '../components/ThemeToggle.vue'
import { UiButton, UiIconButton, UiPanel, UiToastHost, type UiToastItem } from '../components/ui'

/* ECharts */
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([RadarChart, TooltipComponent, LegendComponent, CanvasRenderer])

/* Lucide 图标 */
import {
  ArrowLeft, Swords, Sword, Sparkles, Target, Zap, Rocket, Dices,
  Loader2, CircleCheck, CircleX, Shield, Flame, Clock, Crosshair, Eye
} from 'lucide-vue-next'

const router = useRouter()
const charStore = useCharacterStore()

// ── 状态 ──
const selectedJob = ref<JobType>('WARRIOR')
const charName = ref('')
const nameError = ref('')
const nameCheckStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const nameCheckMessage = ref('')
let nameCheckTimer: ReturnType<typeof setTimeout> | null = null

const message = ref({ text: '', type: 'success' as 'success' | 'error' })

/** 当前角色创建页 Toast 列表。 */
const createToasts = computed<UiToastItem[]>(() =>
  message.value.text
    ? [{ id: 'character-create-message', message: message.value.text, type: message.value.type }]
    : []
)

// ── 计算属性 ──
const currentJob = computed(() => JOB_CONFIGS[selectedJob.value])

const canSubmit = computed(() => {
  return charName.value.length >= 2 &&
    charName.value.length <= 12 &&
    nameCheckStatus.value !== 'taken' &&
    nameCheckStatus.value !== 'checking' &&
    !nameError.value
})

// ── 雷达图配置 ──
const radarOption = computed(() => {
  const job = currentJob.value
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  return {
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    radar: {
      indicator: [
        { name: '生存', max: 5 },
        { name: '攻击', max: 5 },
        { name: '速度', max: 5 }
      ],
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
        fontSize: 13,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: isDark
            ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)']
            : ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)']
        }
      },
      axisLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [job.radar.survival, job.radar.attack, job.radar.speed],
        name: job.name,
        areaStyle: {
          color: job.color,
          opacity: 0.2
        },
        lineStyle: {
          color: job.color,
          width: 2
        },
        itemStyle: {
          color: job.color,
          borderColor: '#fff',
          borderWidth: 2
        },
        symbol: 'circle',
        symbolSize: 8
      }]
    }]
  }
})

// ── 技能图标映射 ──
const skillIconMap: Record<string, unknown> = {
  Swords, Shield, Flame, Clock, Crosshair, Eye
}

function getSkillIcon(iconName: string) {
  return skillIconMap[iconName] || Swords
}

/** 获取职业对应的 Lucide 图标组件 */
function getJobLucideIcon(jobType: JobType) {
  const iconMap = { WARRIOR: Sword, MAGE: Sparkles, HUNTER: Target }
  return iconMap[jobType]
}

// ── 角色名检测 ──
function onNameInput() {
  nameError.value = ''
  if (nameCheckTimer) clearTimeout(nameCheckTimer)

  const name = charName.value
  if (!name || name.length < 2) {
    nameCheckStatus.value = 'idle'
    nameCheckMessage.value = ''
    return
  }

  if (name.length > 12) {
    nameError.value = '角色名最多 12 个字符'
    return
  }

  nameCheckStatus.value = 'checking'
  nameCheckMessage.value = '检测中...'
  nameCheckTimer = setTimeout(async () => {
    try {
      const res = await checkCharacterNameApi(name)
      if (charName.value !== name) return
      if (res.data.available) {
        nameCheckStatus.value = 'available'
        nameCheckMessage.value = '角色名可用'
      } else {
        nameCheckStatus.value = 'taken'
        nameCheckMessage.value = '该角色名已被使用'
      }
    } catch {
      nameCheckStatus.value = 'idle'
      nameCheckMessage.value = ''
    }
  }, 500)
}

/** 随机取名 */
function handleRandomName() {
  charName.value = generateRandomName()
  onNameInput()
}

/** 显示消息 */
function showMessage(text: string, type: 'success' | 'error') {
  message.value = { text, type }
  setTimeout(() => { message.value.text = '' }, 5000)
}

/** 创建角色 */
async function handleCreate() {
  nameError.value = ''

  if (!charName.value || charName.value.length < 2) {
    nameError.value = '请输入至少 2 个字符的角色名'
    return
  }

  if (nameCheckStatus.value === 'taken') {
    nameError.value = '该角色名已被使用'
    return
  }

  const result = await charStore.createCharacter({
    characterName: charName.value,
    profession: jobTypeToProfession(selectedJob.value)
  })

  if (result.success) {
    showMessage(result.message, 'success')
    setTimeout(() => {
      router.push({ name: 'characters' })
    }, 1000)
  } else {
    showMessage(result.message, 'error')
  }
}

// 切换职业时重置名称检测状态
watch(selectedJob, () => {
  // 保留名称，仅触发视觉更新
})
</script>

<style scoped>
/* ── Dark Mode Overrides ── */

/* 返回按钮悬浮 */
[data-theme='dark'] .char-create__back:hover {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
}

/* 职业切换按钮悬浮 */
[data-theme='dark'] .job-switcher__btn:hover {
  background: var(--bg-panel-light);
}

/* 职业切换按钮激活态 */
[data-theme='dark'] .job-switcher__btn--active {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-subtle);
}

/* 技能卡片悬浮 */
[data-theme='dark'] .skill-item:hover {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-subtle);
}

/* 角色名输入框占位符 */
[data-theme='dark'] .char-create__name-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

/* 属性行悬浮 */
[data-theme='dark'] .stat-row:hover {
  background: var(--bg-panel-light);
}

/* 提交按钮悬浮 */
[data-theme='dark'] .char-create__submit:hover:not(:disabled) {
  box-shadow: var(--shadow-elevated);
}

/* 名称检测状态文字 */
[data-theme='dark'] .char-create__name-status--checking {
  color: var(--text-muted);
}

[data-theme='dark'] .char-create__name-status--available {
  color: var(--accent-green);
}

[data-theme='dark'] .char-create__name-status--taken {
  color: var(--accent-red);
}

[data-theme='dark'] .char-create__name-status--error {
  color: var(--accent-red);
}

/* ═══ 响应式断点 ═══ */

/* ── Tablet (≤1024px) ── */
@media (max-width: 1024px) {
  .char-create__content {
    gap: 20px;
  }

  .char-create__radar-wrap {
    max-height: 260px;
  }

  .job-switcher__btn {
    padding: 12px 6px;
  }

  .job-switcher__icon {
    width: 32px;
    height: 32px;
  }

  .skill-item {
    padding: 10px;
  }

  .skill-item__icon {
    width: 36px;
    height: 36px;
  }
}

/* ── Mobile landscape (≤768px) ── */
@media (max-width: 768px) {
  .char-create {
    padding: 16px 12px max(16px, env(safe-area-inset-bottom));
  }

  .char-create__nav {
    --char-create-nav-side: 72px;
    margin-bottom: 18px;
  }

  .char-create__content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .char-create__radar-wrap {
    max-height: 240px;
  }

  .char-create__page-title {
    font-size: var(--font-size-small);
  }

  .char-create__preview,
  .char-create__form-panel {
    border-radius: 16px;
  }

  .job-switcher {
    gap: 8px;
    margin-bottom: 24px;
  }

  .char-create__name-group {
    margin-bottom: 20px;
  }

  .char-create__stats {
    margin-bottom: 22px;
  }
}

/* ── Small phone (≤375px) ── */
@media (max-width: 375px) {
  .char-create {
    padding: 12px 8px max(12px, env(safe-area-inset-bottom));
  }

  .char-create__nav {
    --char-create-nav-side: 56px;
    margin-bottom: 14px;
  }

  .char-create__page-title {
    font-size: var(--font-size-xs);
  }

  .char-create__content {
    gap: 12px;
  }

  .char-create__preview,
  .char-create__form-panel {
    padding: 14px 10px;
    border-radius: 14px;
  }

  .char-create__radar-wrap {
    max-height: 200px;
    margin-bottom: 14px;
  }

  .char-create__job-desc {
    font-size: var(--font-size-xs);
    margin-bottom: 14px;
  }

  .job-switcher {
    gap: 6px;
    margin-bottom: 18px;
  }

  .job-switcher__btn {
    padding: 8px 4px;
    gap: 4px;
  }

  .job-switcher__icon {
    width: 28px;
    height: 28px;
  }

  .job-switcher__name {
    font-size: 10px;
  }

  .skill-item {
    padding: 8px;
    gap: 8px;
    border-radius: 10px;
  }

  .skill-item__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .skill-item__name {
    font-size: var(--font-size-xs);
  }

  .skill-item__desc {
    font-size: 10px;
  }

  .char-create__name-group {
    margin-bottom: 16px;
  }

  .char-create__name-input {
    padding: 10px 12px;
    font-size: var(--font-size-xs);
  }

  .stat-row {
    padding: 8px 10px;
    margin-bottom: 4px;
  }

  .stat-row__label {
    font-size: var(--font-size-xs);
  }

  .stat-row__value {
    font-size: var(--font-size-small);
  }
}
</style>
