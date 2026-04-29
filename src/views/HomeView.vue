<!-- 首页占位组件 -->
<template>
  <div class="home-page">
    <div class="home-card">
      <h1 class="home-card__title">
        <Swords :size="32" :stroke-width="1.5" class="home-card__icon" />
        剑之传说
      </h1>
      <p class="home-card__subtitle">欢迎回来，{{ auth.user?.username }}！</p>
      <p class="home-card__desc">游戏内容正在开发中...</p>
      <button
        id="logout-btn"
        class="home-card__logout"
        @click="handleLogout"
      >
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Swords } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.home-card {
  text-align: center;
  max-width: 480px;
  width: 100%;
  padding: 48px 32px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  box-shadow: var(--shadow-card);
}

.home-card__title {
  font-size: var(--font-size-heading);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.home-card__icon {
  color: var(--accent-blue);
}

.home-card__subtitle {
  font-size: var(--font-size-section);
  color: var(--text-primary);
  margin-bottom: 12px;
}

.home-card__desc {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin-bottom: 28px;
}

.home-card__logout {
  padding: 10px 24px;
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--accent-red);
  background: rgba(255, 59, 48, 0.08);
  border: 1px solid rgba(255, 59, 48, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-card__logout:hover {
  background: rgba(255, 59, 48, 0.15);
}

.home-card__logout:active {
  transform: scale(0.98);
}
</style>
