<!-- 测试用例面板组件 - 展示选中模块的测试用例列表及执行结果 -->
<template>
  <section class="test-panel">
    <div class="test-panel__toolbar">
      <span class="test-panel__toolbar-title">{{ suiteResult?.module || '测试用例' }}</span>
      <button
        class="test-panel__toolbar-btn test-panel__toolbar-btn--primary"
        @click="$emit('run-all')"
        :disabled="isRunning"
      >
        ▶ 执行全部
      </button>
      <button
        class="test-panel__toolbar-btn"
        @click="$emit('run-module')"
        :disabled="isRunning || !suiteResult"
      >
        ▶ 执行选中
      </button>
      <button
        class="test-panel__toolbar-btn"
        @click="$emit('stop')"
        :disabled="!isRunning"
      >
        ⏹ 停止
      </button>
    </div>
    <div class="test-panel__list">
      <template v-for="result in suiteResult?.results" :key="result.caseName">
        <div class="test-panel__case" :class="caseClass(result)">
          <span class="test-panel__case-icon">{{ caseIcon(result) }}</span>
          <span class="test-panel__case-name">{{ result.caseName }}</span>
          <span class="test-panel__case-time">{{ result.duration }}ms</span>
        </div>
        <!-- 失败用例展开错误详情 -->
        <div
          v-if="result.status === 'failed' && result.error"
          class="test-panel__error"
        >
          <div class="test-panel__error-msg">{{ result.error.message }}</div>
          <pre v-if="result.error.stack" class="test-panel__error-stack">{{ result.error.stack }}</pre>
        </div>
      </template>
      <!-- 无结果时显示空状态 -->
      <div v-if="!suiteResult || suiteResult.results.length === 0" class="test-panel__empty">
        <span>暂无测试结果</span>
      </div>
    </div>
    <div
      v-if="suiteResult && suiteResult.status === 'done'"
      class="test-panel__summary"
    >
      <span class="test-panel__summary-item test-panel__summary-pass">
        ✓ {{ suiteResult.results.filter(r => r.status === 'passed').length }} 通过
      </span>
      <span class="test-panel__summary-item test-panel__summary-fail">
        ✗ {{ suiteResult.results.filter(r => r.status === 'failed').length }} 失败
      </span>
      <span class="test-panel__summary-item test-panel__summary-skip">
        ○ {{ suiteResult.results.filter(r => r.status === 'skipped').length }} 跳过
      </span>
      <span class="test-panel__summary-item">
        耗时: {{ suiteResult.endTime && suiteResult.startTime ? suiteResult.endTime - suiteResult.startTime : 0 }}ms
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TestResult, SuiteResult } from '../../testing/core/types'

/** 组件属性定义 */
defineProps<{
  /** 当前选中的套件执行结果 */
  suiteResult: SuiteResult | null
  /** 是否正在执行测试 */
  isRunning: boolean
}>()

/** 组件事件定义 */
defineEmits<{
  /** 执行全部测试 */
  'run-all': []
  /** 执行选中模块测试 */
  'run-module': []
  /** 停止测试执行 */
  stop: []
}>()

/**
 * 获取用例行的样式类
 * 根据用例执行状态返回对应修饰类
 * @param result - 用例执行结果
 * @returns 样式类字符串
 */
function caseClass(result: TestResult): string {
  const statusMap: Record<TestResult['status'], string> = {
    passed: 'test-panel__case--pass',
    failed: 'test-panel__case--fail',
    running: 'test-panel__case--running',
    skipped: 'test-panel__case--skipped'
  }
  return statusMap[result.status]
}

/**
 * 获取用例状态图标
 * 根据用例执行状态返回对应图标字符
 * @param result - 用例执行结果
 * @returns 状态图标字符
 */
function caseIcon(result: TestResult): string {
  const iconMap: Record<TestResult['status'], string> = {
    passed: '✓',
    failed: '✗',
    running: '⟳',
    skipped: '○'
  }
  return iconMap[result.status]
}
</script>

<style scoped>
.test-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: var(--font-size-small);
}
</style>