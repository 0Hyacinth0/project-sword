<template>
  <main class="battle-route-shell"><BattleConsole @return-view="goHome" /></main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BattleConsole from '../components/battle/BattleConsole.vue'

const router = useRouter()

/**
 * 从兼容战斗路由返回首页。
 * @returns 无返回值
 */
function goHome(): void {
  router.push({ name: 'home' })
}
</script>

<style scoped>
.battle-route-shell {
  min-height: 100vh;
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 28px 40px;
}

@media (max-width: 720px) {
  .battle-route-shell {
    padding: 16px 12px 28px;
  }
}
</style>
