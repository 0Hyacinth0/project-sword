<!-- 测试套件运行器页面 - 集成侧边栏、用例面板、日志面板三栏布局 -->
<template>
  <div class="test-page">
    <!-- 顶部标题栏 -->
    <header class="test-header">
      <h1 class="test-header__title">Test Suite Runner</h1>
      <div class="test-header__controls">
        <label>后端地址:</label>
        <input
          v-model="baseURL"
          placeholder="http://192.168.0.228:8080"
          class="test-header__input"
        />
        <button class="test-header__btn" @click="applyBaseURL">应用</button>
        <span class="test-header__status" :class="statusClass">●</span>
      </div>
    </header>

    <!-- 三栏主体区域 -->
    <div class="test-body">
      <TestSidebar
        :suites="suites"
        :results="resultsMap"
        :activeModule="activeModule"
        @select="selectModule"
      />
      <TestPanel
        :suiteResult="activeResult"
        :isRunning="isRunning"
        @run-all="runAll"
        @run-module="runModule"
        @stop="stop"
      />
      <TestLog :logs="logs" @clear="clearLogs" />
    </div>

    <!-- 底部进度条 -->
    <footer class="test-footer">
      <div class="test-footer__progress">
        <div
          class="test-footer__progress-bar"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="test-footer__text">{{ progressText }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { TestSuite, SuiteResult, TestEvent, LogEntry } from '../testing/core/types'
import { testRunner, registerAllSuites } from '../testing/registry'
import { updateBaseURL, resetTestContext, clearAuthState, installLogInterceptor, removeLogInterceptor } from '../testing/utils/testHelper'
import TestSidebar from '../components/test/TestSidebar.vue'
import TestPanel from '../components/test/TestPanel.vue'
import TestLog from '../components/test/TestLog.vue'
import '../assets/styles/test.css'

/** 所有已注册的测试套件 */
const suites = ref<TestSuite[]>([])
/** 各模块执行结果映射（模块名 → 套件结果） */
const resultsMap = ref(new Map<string, SuiteResult>())
/** 当前选中的模块名称 */
const activeModule = ref('')
/** 日志条目列表 */
const logs = ref<LogEntry[]>([])
/** 全局统计摘要 */
const summary = ref({ total: 0, passed: 0, failed: 0, skipped: 0 })
/** 是否正在执行测试 */
const isRunning = ref(false)
/** 当前测试运行结束后是否需要清理认证状态。 */
const clearAuthAfterRun = ref(false)
/** 后端基础 URL */
const baseURL = ref('http://192.168.0.228:8080')

/** 事件监听器取消函数 */
let offListener: (() => void) | null = null

/**
 * 当前选中模块的执行结果
 * 从 resultsMap 中获取对应模块的 SuiteResult
 */
const activeResult = computed<SuiteResult | null>(() => {
  return resultsMap.value.get(activeModule.value) ?? null
})

/**
 * 进度百分比
 * 已完成用例数 / 总用例数 * 100
 */
const progressPercent = computed(() => {
  const { total, passed, failed, skipped } = summary.value
  if (total === 0) return 0
  return Math.round(((passed + failed + skipped) / total) * 100)
})

/**
 * 进度文本描述
 * 显示当前通过/失败/跳过/总计状态
 */
const progressText = computed(() => {
  const { passed, failed, skipped, total } = summary.value
  if (total === 0) return isRunning.value ? '正在执行...' : '就绪'
  return `通过 ${passed} | 失败 ${failed} | 跳过 ${skipped} | 总计 ${total}`
})

/**
 * 状态指示灯样式类
 * running 状态显示蓝色，空闲状态显示绿色
 */
const statusClass = computed(() => {
  return isRunning.value ? 'test-header__status--running' : 'test-header__status--online'
})

/**
 * 选中某个测试模块
 * @param module - 模块名称
 */
function selectModule(module: string): void {
  activeModule.value = module
}

/**
 * 结束当前测试运行并清理运行期副作用
 * @param clearAuth - 是否在结束运行后清理认证状态
 * @returns 无返回值
 */
function finishRun(clearAuth: boolean): void {
  isRunning.value = false
  removeLogInterceptor()
  if (clearAuth) {
    clearAuthState()
  }
}

/**
 * 执行全部测试
 * 安装日志拦截器，重置日志和统计，标记运行状态，调用引擎执行
 */
async function runAll(): Promise<void> {
  logs.value = []
  summary.value = { total: 0, passed: 0, failed: 0, skipped: 0 }
  resetTestContext()
  clearAuthState()

  // 安装日志拦截器：捕获 axios 请求/响应，通过事件推送到日志面板
  installLogInterceptor((entry) => {
    logs.value = [...logs.value, entry]
  })

  clearAuthAfterRun.value = true
  isRunning.value = true
  testRunner.reset()
  try {
    await testRunner.run()
  } finally {
    if (isRunning.value) {
      finishRun(true)
    }
  }
}

/**
 * 执行当前选中模块的测试
 * @returns 无返回值
 */
async function runModule(): Promise<void> {
  if (!activeModule.value) return
  logs.value = []
  summary.value = { total: 0, passed: 0, failed: 0, skipped: 0 }

  installLogInterceptor((entry) => {
    logs.value = [...logs.value, entry]
  })

  clearAuthAfterRun.value = false
  isRunning.value = true
  try {
    await testRunner.run(activeModule.value)
  } finally {
    if (isRunning.value) {
      finishRun(false)
    }
  }
}

/**
 * 停止当前正在执行的测试
 * @returns 无返回值
 */
function stop(): void {
  testRunner.abort()
  finishRun(false)
}

/**
 * 清空日志列表
 */
function clearLogs(): void {
  logs.value = []
}

/**
 * 应用后端地址配置
 * 更新 Axios 实例的 baseURL 和测试上下文
 */
function applyBaseURL(): void {
  updateBaseURL(baseURL.value)
}

/**
 * 处理测试引擎事件
 * 根据事件类型更新响应式状态
 * @param event - 测试引擎派发的事件
 */
function handleEvent(event: TestEvent): void {
  switch (event.type) {
    case 'suite-start': {
      const newMap = new Map(resultsMap.value)
      newMap.set(event.module, {
        module: event.module,
        status: 'running',
        results: []
      })
      resultsMap.value = newMap
      break
    }
    case 'case-start': {
      const newMap = new Map(resultsMap.value)
      const existing = newMap.get(event.module)
      if (existing) {
        const updated: SuiteResult = {
          ...existing,
          results: [
            ...existing.results,
            {
              caseName: event.caseName,
              status: 'running',
              duration: 0,
              logs: []
            }
          ]
        }
        newMap.set(event.module, updated)
      }
      resultsMap.value = newMap
      break
    }
    case 'case-result': {
      const newMap = new Map(resultsMap.value)
      const existing = newMap.get(event.module)
      if (existing) {
        const results = existing.results.map(r =>
          r.caseName === event.result.caseName ? event.result : r
        )
        newMap.set(event.module, { ...existing, results })
      }
      resultsMap.value = newMap
      break
    }
    case 'suite-result': {
      const newMap = new Map(resultsMap.value)
      newMap.set(event.module, event.result)
      resultsMap.value = newMap
      break
    }
    case 'all-done': {
      summary.value = event.summary
      finishRun(clearAuthAfterRun.value)
      break
    }
    case 'log': {
      logs.value = [...logs.value, event.entry]
      break
    }
  }
}

/**
 * 组件挂载时初始化
 * 注册所有测试套件，获取套件列表，设置事件监听
 */
onMounted(() => {
  registerAllSuites()
  suites.value = testRunner.getSuites()
  // 默认选中第一个模块
  if (suites.value.length > 0) {
    activeModule.value = suites.value[0].module
  }
  // 设置事件监听
  offListener = testRunner.on(handleEvent)
})

/**
 * 组件卸载时清理
 * 取消事件监听器，避免内存泄漏
 */
onUnmounted(() => {
  if (offListener) {
    offListener()
    offListener = null
  }
  removeLogInterceptor()
})
</script>

<style scoped>
.test-header__input {
  padding: 4px 10px;
  font-size: var(--font-size-small);
  color: var(--text-primary);
  background: var(--bg-panel-light);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  outline: none;
  width: 240px;
  transition: border-color 0.2s ease;
}

.test-header__input:focus {
  border-color: var(--accent-blue);
}

.test-header__label {
  font-size: var(--font-size-small);
  color: var(--text-muted);
}

.test-header__status {
  font-size: 12px;
  margin-left: 4px;
}

.test-header__status--online {
  color: var(--accent-green);
}

.test-header__status--running {
  color: var(--accent-blue);
  animation: test-pulse-glow 2s ease-in-out infinite;
}
</style>
