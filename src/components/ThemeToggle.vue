<!-- 主题切换按钮组件 -->
<template>
  <div class="theme-toggle">
    <button
      id="theme-toggle-btn"
      class="theme-toggle__btn"
      :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
      @click="toggleTheme"
    >
      <transition name="theme-icon" mode="out-in">
        <Sun v-if="isDark" key="sun" :size="18" :stroke-width="1.8" />
        <Moon v-else key="moon" :size="18" :stroke-width="1.8" />
      </transition>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const isDark = ref(false)

/** 切换亮/暗模式 */
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
}

/** 应用主题到 HTML 根元素 */
function applyTheme() {
  const html = document.documentElement
  if (isDark.value) {
    html.setAttribute('data-theme', 'dark')
  } else {
    html.removeAttribute('data-theme')
  }
  // 持久化用户偏好
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

/** 初始化时读取用户偏好 */
onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
  } else if (!saved) {
    // 跟随系统偏好
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})
</script>

<style scoped>
/* 图标切换动画 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
