<!-- 测试模块侧边栏组件 - 展示所有已注册的测试套件列表及执行状态 -->
<template>
  <aside class="test-sidebar">
    <div class="test-sidebar__header">
      <h3>测试模块</h3>
    </div>
    <div class="test-sidebar__list">
      <div
        v-for="suite in suites"
        :key="suite.module"
        class="test-sidebar__item"
        :class="itemClass(suite)"
        @click="$emit('select', suite.module)"
      >
        <span class="test-sidebar__item-icon">{{ suite.icon }}</span>
        <span class="test-sidebar__item-name">{{ suite.module }}</span>
        <span class="test-sidebar__item-count">{{ statsText(suite) }}</span>
      </div>
    </div>
    <div class="test-sidebar__stats">
      <span class="test-sidebar__stats-pass">{{ totalSummary.passed }} 通过</span>
      <span class="test-sidebar__stats-fail">{{ totalSummary.failed }} 失败</span>
      <span>{{ totalSummary.total }} 总计</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TestSuite, SuiteResult } from '../../testing/core/types'

/** 组件属性定义 */
const props = defineProps<{
  /** 所有已注册的测试套件 */
  suites: TestSuite[]
  /** 各模块执行结果映射 */
  results: Map<string, SuiteResult>
  /** 当前选中的模块名称 */
  activeModule: string
}>()

/** 组件事件定义 */
defineEmits<{
  /** 选中某个模块时触发 */
  select: [module: string]
}>()

/**
 * 获取模块行的样式类
 * 根据执行状态和选中状态返回对应修饰类
 * @param suite - 测试套件
 * @returns 样式类对象
 */
function itemClass(suite: TestSuite): Record<string, boolean> {
  const result = props.results.get(suite.module)
  const isActive = suite.module === props.activeModule
  return {
    'test-sidebar__item--active': isActive,
    'test-sidebar__item--pass': !isActive && result?.status === 'done' && result.results.every(r => r.status === 'passed' || r.status === 'skipped'),
    'test-sidebar__item--fail': !isActive && result?.status === 'done' && result.results.some(r => r.status === 'failed'),
    'test-sidebar__item--running': result?.status === 'running'
  }
}

/**
 * 生成模块统计文本
 * 格式根据状态不同而变化：
 * - 全部通过：✓7/7
 * - 有失败：✓3 ✗4 /7
 * - 全部跳过：○7/7
 * @param suite - 测试套件
 * @returns 格式化的统计文本
 */
function statsText(suite: TestSuite): string {
  const result = props.results.get(suite.module)
  if (!result || result.results.length === 0) return ''
  const passed = result.results.filter(r => r.status === 'passed').length
  const failed = result.results.filter(r => r.status === 'failed').length
  const skipped = result.results.filter(r => r.status === 'skipped').length
  const total = result.results.length

  if (failed === 0 && skipped === 0) return `✓${passed}/${total}`
  if (passed === 0 && failed === 0) return `○${skipped}/${total}`
  const parts: string[] = []
  if (passed > 0) parts.push(`✓${passed}`)
  if (failed > 0) parts.push(`✗${failed}`)
  if (skipped > 0) parts.push(`○${skipped}`)
  return `${parts.join(' ')} /${total}`
}

/**
 * 全局统计汇总
 * 聚合所有模块的通过、失败、总计数量
 */
const totalSummary = computed(() => {
  let passed = 0
  let failed = 0
  let total = 0
  for (const [, result] of props.results) {
    passed += result.results.filter(r => r.status === 'passed').length
    failed += result.results.filter(r => r.status === 'failed').length
    total += result.results.length
  }
  return { passed, failed, total }
})
</script>
