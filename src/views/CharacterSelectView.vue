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
        <button
          class="char-card__delete"
          title="删除角色"
          @click.stop="showDeleteConfirm(char)"
        >
          <Trash2 :size="14" :stroke-width="1.8" />
        </button>

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
      <button class="char-select__logout" @click="handleLogout">
        <LogOut :size="16" :stroke-width="1.8" />
        退出登录
      </button>
    </div>

    <!-- Toast 提示 -->
    <Teleport to="body">
      <transition name="toast-fade">
        <div v-if="toast.visible" :class="['toast', `toast--${toast.type}`]">
          <component :is="toast.icon" :size="18" :stroke-width="1.8" />
          <span>{{ toast.message }}</span>
        </div>
      </transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteConfirm.visible" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-dialog">
            <div class="modal-dialog__icon modal-dialog__icon--danger">
              <AlertTriangle :size="28" :stroke-width="1.5" />
            </div>
            <h3 class="modal-dialog__title">确认删除角色</h3>
            <p class="modal-dialog__desc">
              你确定要删除角色
              <strong>「{{ deleteConfirm.character?.characterName }}」</strong>
              吗？此操作无法撤销。
            </p>
            <div class="modal-dialog__actions">
              <button class="modal-dialog__btn modal-dialog__btn--cancel" @click="cancelDelete">
                取消
              </button>
              <button
                class="modal-dialog__btn modal-dialog__btn--danger"
                :disabled="charStore.loading"
                @click="confirmDelete"
              >
                <Loader2 v-if="charStore.loading" :size="16" class="char-select__loading-spinner" />
                {{ charStore.loading ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCharacterStore } from '../stores/character'
import { getJobConfigByProfession } from '../config/job_config'
import type { CharacterInfo } from '../api'
import ThemeToggle from '../components/ThemeToggle.vue'
import {
  Swords, Sword, Sparkles, Target, Plus, LogOut, Loader2,
  Trash2, AlertTriangle, CheckCircle, XCircle
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const charStore = useCharacterStore()

type ToastType = 'success' | 'error'

const toast = reactive({
  visible: false,
  type: 'success' as ToastType,
  message: '',
  icon: CheckCircle as Component
})

const deleteConfirm = reactive({
  visible: false,
  character: null as CharacterInfo | null
})

function showToast(type: ToastType, message: string) {
  toast.type = type
  toast.message = message
  toast.icon = type === 'success' ? CheckCircle : XCircle
  toast.visible = true

  setTimeout(() => {
    toast.visible = false
  }, 3000)
}

function getJobCfg(profession: number) {
  return getJobConfigByProfession(profession)
}

function getJobLucideIcon(profession: number) {
  const iconMap: Record<number, unknown> = { 1: Sword, 2: Sparkles, 3: Target }
  return iconMap[profession] || Sword
}

function handleSelect(characterId: string) {
  charStore.selectCharacter(characterId)
  router.push({ name: 'home' })
}

function showDeleteConfirm(char: CharacterInfo) {
  deleteConfirm.character = char
  deleteConfirm.visible = true
}

function cancelDelete() {
  deleteConfirm.visible = false
  deleteConfirm.character = null
}

async function confirmDelete() {
  if (!deleteConfirm.character) return

  const result = await charStore.deleteCharacter(deleteConfirm.character.id)
  if (result.success) {
    cancelDelete()
    showToast('success', '角色已成功删除')
  } else {
    showToast('error', result.message)
  }
}

function handleLogout() {
  auth.logout()
  charStore.clear()
  router.push({ name: 'login' })
}

onMounted(() => {
  charStore.fetchCharacters()
})
</script>
