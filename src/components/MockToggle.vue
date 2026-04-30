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

<style scoped>
.mock-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-label, 13px);
  font-family: var(--font-text, -apple-system, BlinkMacSystemFont, sans-serif);
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.mock-toggle:hover {
  background: rgba(0, 0, 0, 0.65);
  transform: scale(1.05);
}

.mock-toggle.active {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.4);
  color: var(--accent-green, #34c759);
}

.mock-toggle.active:hover {
  background: rgba(52, 199, 89, 0.3);
}

.mock-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.25s ease;
}

.mock-toggle.active .mock-toggle__dot {
  background: var(--accent-green, #34c759);
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.6);
}

.mock-toggle__label {
  font-weight: 500;
  letter-spacing: 0.3px;
}
</style>
