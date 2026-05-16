<!-- 测试日志面板组件 - 展示测试执行期间的请求/响应/错误/信息日志 -->
<template>
  <aside class="test-log">
    <div class="test-log__header">
      <span class="test-log__header-title">日志</span>
      <div class="test-log__header-actions">
        <button class="test-log__header-btn" @click="$emit('clear')">清空</button>
        <button class="test-log__header-btn" @click="copyLogs">复制</button>
      </div>
    </div>
    <div class="test-log__list" ref="logListRef">
      <div
        v-for="(log, index) in logs"
        :key="index"
        class="test-log__entry"
        :class="'test-log__entry--' + log.direction"
      >
        <span class="test-log__entry-time">{{ formatTime(log.timestamp) }}</span>
        <span class="test-log__entry-direction">{{ dirSymbol(log.direction) }}</span>
        <span>{{ log.content }}</span>
      </div>
      <!-- 无日志时显示空状态 -->
      <div v-if="logs.length === 0" class="test-log__empty">
        <span>暂无日志</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { LogEntry } from '../../testing/core/types'

/** 组件属性定义 */
const props = defineProps<{
  /** 日志条目列表 */
  logs: LogEntry[]
}>()

/** 组件事件定义 */
defineEmits<{
  /** 清空日志 */
  clear: []
}>()

/** 日志列表容器引用，用于自动滚动 */
const logListRef = ref<HTMLElement | null>(null)

/**
 * 格式化时间戳为 HH:MM:SS 格式
 * @param ts - 毫秒时间戳
 * @returns 格式化的时间字符串
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * 获取日志方向对应的符号
 * request -> →, response -> ←, error -> ✗, info -> i
 * @param direction - 日志方向类型
 * @returns 方向符号字符
 */
function dirSymbol(direction: LogEntry['direction']): string {
  const symbolMap: Record<LogEntry['direction'], string> = {
    request: '→',
    response: '←',
    error: '✗',
    info: 'i'
  }
  return symbolMap[direction]
}

/**
 * 复制所有日志内容到剪贴板
 * 格式：[HH:MM:SS] 方向 内容
 */
async function copyLogs(): Promise<void> {
  const text = props.logs
    .map(log => `[${formatTime(log.timestamp)}] ${dirSymbol(log.direction)} ${log.content}`)
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 剪贴板 API 不可用时静默失败
  }
}

/**
 * 监听日志列表长度变化，自动滚动到底部
 */
watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (logListRef.value) {
        logListRef.value.scrollTop = logListRef.value.scrollHeight
      }
    })
  }
)
</script>

<style scoped>
.test-log__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}
</style>