<template>
  <div class="mock-toggle" :class="{ active: mockEnabled }" @click="handleToggle">
    <span class="mock-toggle__dot" />
    <span class="mock-toggle__label">Mock {{ mockEnabled ? 'ON' : 'OFF' }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Mock 模式浮动开关组件
 * 悬浮在页面右下角，点击即可切换全局 Mock 模式
 * 开启时所有 API 请求走本地 Mock 数据，无需后端服务
 */
import { useMockRef, toggleMock } from '../utils/mockConfig'

const mockEnabled = useMockRef()

/** 切换 Mock 模式并提示 */
function handleToggle() {
  toggleMock()
}
</script>
