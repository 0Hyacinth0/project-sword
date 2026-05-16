<!-- 角色选择页 -->
<template>
  <div class="char-select">
    <ThemeToggle />

    <div class="char-select__header">
      <h1 class="char-select__title">
        <Swords :size="28" :stroke-width="1.5" class="char-select__title-icon" />
        选择你的角色
      </h1>
      <p class="char-select__subtitle">最多可创建 3 个角色</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="charStore.loading && !deleteConfirm.visible" class="char-select__loading">
      <Loader2 :size="32" class="char-select__loading-spinner" />
      <span>正在加载角色列表...</span>
    </div>

    <!-- 角色槽位 -->
    <div v-else class="char-select__slots">
      <!-- 已有角色 -->
      <div
        v-for="char in charStore.characters"
        :key="char.id"
        class="char-card"
        @click="handleSelect(char.id)"
      >
        <!-- 删除按钮 -->
        <UiIconButton
          class="char-card__delete"
          label="删除角色"
          variant="ghost"
          size="sm"
          @click.stop="showDeleteConfirm(char)"
        >
          <Trash2 :size="14" :stroke-width="1.8" />
        </UiIconButton>

        <div
          class="char-card__job-icon"
          :style="{ background: getJobCfg(char.profession).color }"
        >
          <component :is="getJobLucideIcon(char.profession)" :size="28" :stroke-width="1.5" />
        </div>
        <div class="char-card__info">
          <div class="char-card__name">{{ char.characterName }}</div>
          <span
            class="char-card__job-tag"
            :style="{
              background: getJobCfg(char.profession).colorLight,
              color: getJobCfg(char.profession).color
            }"
          >
            {{ getJobCfg(char.profession).name }}
          </span>
          <div class="char-card__level">Lv.{{ char.level }}</div>
        </div>
      </div>

      <!-- 空槽位 -->
      <div
        v-for="i in charStore.emptySlots"
        :key="'empty-' + i"
        class="char-card char-card--empty"
        @click="router.push({ name: 'character-create' })"
      >
        <div class="char-card__add-icon">
          <Plus :size="28" :stroke-width="1.8" />
        </div>
        <span class="char-card__add-text">创建角色</span>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="char-select__footer">
      <UiButton class="char-select__logout" variant="ghost" @click="handleLogout">
        <template #icon><LogOut :size="16" :stroke-width="1.8" /></template>
        退出登录
      </UiButton>
    </div>

    <!-- Toast 提示 -->
    <UiToastHost :toasts="selectToasts" @dismiss="hideToast" />

    <!-- 删除确认弹窗 -->
    <UiModal v-model="deleteConfirm.visible" title="确认删除角色" variant="danger" @close="cancelDelete">
      <template #icon>
        <AlertTriangle :size="28" :stroke-width="1.5" />
      </template>
      <p class="char-select__modal-desc">
        你确定要删除角色
        <strong>「{{ deleteConfirm.character?.characterName }}」</strong>
        吗？此操作无法撤销。
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="cancelDelete">取消</UiButton>
        <UiButton
          variant="danger"
          :loading="charStore.loading"
          :disabled="charStore.loading"
          @click="confirmDelete"
        >
          {{ charStore.loading ? '删除中...' : '确认删除' }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCharacterStore } from '../stores/character'
import { getJobConfigByProfession } from '../config/job_config'
import type { CharacterInfo } from '../api'
import ThemeToggle from '../components/ThemeToggle.vue'
import { UiButton, UiIconButton, UiModal, UiToastHost, type UiToastItem } from '../components/ui'
import {
  Swords, Sword, Sparkles, Target, Plus, LogOut, Loader2,
  Trash2, AlertTriangle
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const charStore = useCharacterStore()

type ToastType = 'success' | 'error'

const toast = reactive({
  visible: false,
  type: 'success' as ToastType,
  message: ''
})

const deleteConfirm = reactive({
  visible: false,
  character: null as CharacterInfo | null
})

/** 当前角色选择页 Toast 列表。 */
const selectToasts = computed<UiToastItem[]>(() =>
  toast.visible
    ? [{ id: 'character-select-toast', message: toast.message, type: toast.type }]
    : []
)

/**
 * 显示角色选择页 Toast。
 * @param type - Toast 类型
 * @param message - 展示文案
 * @returns 无返回值
 */
function showToast(type: ToastType, message: string): void {
  toast.type = type
  toast.message = message
  toast.visible = true

  setTimeout(() => {
    toast.visible = false
  }, 3000)
}

/**
 * 隐藏当前 Toast。
 * @returns 无返回值
 */
function hideToast(): void {
  toast.visible = false
}

/**
 * 获取职业展示配置。
 * @param profession - 职业数值标识
 * @returns 职业配置
 */
function getJobCfg(profession: number) {
  return getJobConfigByProfession(profession)
}

/**
 * 获取职业对应的 lucide 图标。
 * @param profession - 职业数值标识
 * @returns 图标组件
 */
function getJobLucideIcon(profession: number) {
  const iconMap: Record<number, unknown> = { 1: Sword, 2: Sparkles, 3: Target }
  return iconMap[profession] || Sword
}

/**
 * 选择角色并进入游戏主页。
 * @param characterId - 角色 ID
 * @returns 无返回值
 */
function handleSelect(characterId: string): void {
  charStore.selectCharacter(characterId)
  router.push({ name: 'home' })
}

/**
 * 打开删除角色确认弹窗。
 * @param char - 待删除角色
 * @returns 无返回值
 */
function showDeleteConfirm(char: CharacterInfo): void {
  deleteConfirm.character = char
  deleteConfirm.visible = true
}

/**
 * 关闭删除确认弹窗并清空目标角色。
 * @returns 无返回值
 */
function cancelDelete(): void {
  deleteConfirm.visible = false
  deleteConfirm.character = null
}

/**
 * 确认删除当前选中的角色。
 * @returns Promise，无业务返回值
 */
async function confirmDelete(): Promise<void> {
  if (!deleteConfirm.character) return

  const result = await charStore.deleteCharacter(deleteConfirm.character.id)
  if (result.success) {
    cancelDelete()
    showToast('success', '角色已成功删除')
  } else {
    showToast('error', result.message)
  }
}

/**
 * 退出登录并回到登录页。
 * @returns Promise，无业务返回值
 */
async function handleLogout(): Promise<void> {
  await auth.logout()
  charStore.clear()
  router.push({ name: 'login' })
}

onMounted(() => {
  charStore.fetchCharacters()
})
</script>

<style scoped>
/* ── Dark Mode Overrides ── */

/* 退出登录按钮悬浮 — 暗色适配 */
[data-theme='dark'] .char-select__logout:hover {
  border-color: rgba(255, 69, 58, 0.3);
  background: rgba(255, 69, 58, 0.08);
}

/* 删除按钮悬浮 */
[data-theme='dark'] .char-card__delete:hover {
  background: rgba(255, 69, 58, 0.12);
}

/* 空角色卡片悬浮 */
[data-theme='dark'] .char-card--empty:hover {
  border-color: var(--accent-blue);
  background: var(--bg-panel);
}

/* 加载状态 */
[data-theme='dark'] .char-select__loading {
  color: var(--text-muted);
}

/* 弹窗描述文字 */
[data-theme='dark'] .char-select__modal-desc {
  color: var(--text-muted);
}

[data-theme='dark'] .char-select__modal-desc strong {
  color: var(--text-primary);
}
</style>
