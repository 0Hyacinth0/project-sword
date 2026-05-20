/**
 * 测试运行引擎
 * 负责注册测试套件、串行执行用例、管理生命周期钩子、
 * 收集结果并通过事件机制通知外部监听器
 */

import type { TestSuite, TestCase, TestResult, SuiteResult, TestEvent, TestEventListener } from './types'
import { AssertionError } from './Assertions'
import { testContext } from '../utils/testHelper'

/** 默认用例超时时间（毫秒） */
const DEFAULT_TIMEOUT = 10_000

/** 套件间延迟时间（毫秒），用于 UI 视觉反馈 */
const SUITE_DELAY = 50

/**
 * 测试运行引擎类
 * 管理测试套件的注册、执行、结果收集和事件派发
 */
class TestRunner {
  /** 已注册的测试套件列表 */
  private suites: TestSuite[] = []
  /** 事件监听器列表 */
  private listeners: TestEventListener[] = []
  /** 各套件执行结果（模块名 → 套件结果） */
  private results: Map<string, SuiteResult> = new Map()
  /** 是否已触发中止标志 */
  private aborted = false

  /**
   * 注册一个测试套件
   * @param suite - 待注册的测试套件
   */
  register(suite: TestSuite): void {
    this.suites.push(suite)
  }

  /**
   * 添加事件监听器
   * @param listener - 事件回调函数
   * @returns 取消监听的函数
   */
  on(listener: TestEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取所有套件的执行结果
   * @returns 模块名到套件结果的映射
   */
  getResults(): Map<string, SuiteResult> {
    return this.results
  }

  /**
   * 获取已注册的测试套件列表
   * @returns 测试套件数组
   */
  getSuites(): TestSuite[] {
    return this.suites
  }

  /**
   * 中止当前正在运行的测试
   * 已开始的用例会执行完毕，未开始的用例将被跳过
   */
  abort(): void {
    this.aborted = true
  }

  /**
   * 重置所有套件的执行结果为空闲状态
   */
  reset(): void {
    this.aborted = false
    for (const [key, result] of this.results) {
      this.results.set(key, {
        module: result.module,
        status: 'idle',
        results: []
      })
    }
  }

  /**
   * 执行测试套件
   * 串行执行所有已注册套件（或指定模块的套件）
   * @param moduleName - 可选，指定只运行某个模块的测试
   */
  async run(moduleName?: string): Promise<void> {
    this.aborted = false

    // 筛选待执行的套件
    const targetSuites = moduleName
      ? this.suites.filter(s => s.module === moduleName)
      : this.suites

    let totalPassed = 0
    let totalFailed = 0
    let totalSkipped = 0

    // 逐个套件串行执行
    for (const suite of targetSuites) {
      if (this.aborted) break

      // 套件间短暂延迟，让 UI 有时间渲染中间状态
      await new Promise(resolve => setTimeout(resolve, SUITE_DELAY))

      const suiteResult = await this.runSuite(suite)
      this.results.set(suite.module, suiteResult)

      // 统计结果
      for (const caseResult of suiteResult.results) {
        if (caseResult.status === 'passed') totalPassed++
        else if (caseResult.status === 'failed') totalFailed++
        else if (caseResult.status === 'skipped') totalSkipped++
      }
    }

    // 派发全部完成事件
    this.emit({
      type: 'all-done',
      summary: {
        total: totalPassed + totalFailed + totalSkipped,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped
      }
    })
  }

  /**
   * 执行单个测试套件
   * @param suite - 待执行的测试套件
   * @returns 套件执行结果
   */
  private async runSuite(suite: TestSuite): Promise<SuiteResult> {
    const suiteResult: SuiteResult = {
      module: suite.module,
      status: 'running',
      results: [],
      startTime: Date.now()
    }

    // 派发套件开始事件
    this.emit({ type: 'suite-start', module: suite.module })

    // 依赖检查：非认证模块需要 token，若无则跳过整个模块
    if (suite.module !== '认证系统' && !testContext.token) {
      for (const testCase of suite.cases) {
        const skippedResult: TestResult = {
          caseName: testCase.name,
          status: 'skipped',
          duration: 0,
          error: { message: '⚠ 依赖失败：认证模块未成功登录，跳过此模块' },
          logs: []
        }
        suiteResult.results.push(skippedResult)
        // 派发用例开始和结果事件，让 UI 能正确显示
        this.emit({ type: 'case-start', module: suite.module, caseName: testCase.name })
        this.emit({ type: 'case-result', module: suite.module, result: skippedResult })
      }
      suiteResult.status = 'done'
      suiteResult.endTime = Date.now()
      this.emit({ type: 'suite-result', module: suite.module, result: suiteResult })
      return suiteResult
    }

    // 标记跳过（显式跳过）的用例
    for (const testCase of suite.cases) {
      if (testCase.skip) {
        suiteResult.results.push({
          caseName: testCase.name,
          status: 'skipped',
          duration: 0,
          logs: []
        })
      }
    }

    // 执行 beforeAll 钩子
    let beforeAllFailed = false
    if (suite.beforeAll) {
      try {
        await this.withTimeout(suite.beforeAll(), DEFAULT_TIMEOUT)
      } catch (e) {
        beforeAllFailed = true
        // beforeAll 失败时，所有非显式跳过的用例标记为跳过
        for (const testCase of suite.cases) {
          if (!testCase.skip) {
            const skippedResult: TestResult = {
              caseName: testCase.name,
              status: 'skipped',
              duration: 0,
              error: {
                message: `beforeAll 钩子失败: ${e instanceof Error ? e.message : String(e)}`
              },
              logs: []
            }
            this.updateCaseResult(suiteResult, skippedResult)
          }
        }
      }
    }

    // beforeAll 成功时，逐个执行用例
    if (!beforeAllFailed) {
      for (const testCase of suite.cases) {
        // 已显式跳过的用例不执行
        if (testCase.skip) continue
        // 中止标志生效时，跳过剩余用例
        if (this.aborted) {
          this.updateCaseResult(suiteResult, {
            caseName: testCase.name,
            status: 'skipped',
            duration: 0,
            error: { message: '测试已被中止' },
            logs: []
          })
          continue
        }

        // 执行单个用例
        const result = await this.runCase(suite, testCase)
        this.updateCaseResult(suiteResult, result)
        this.emit({ type: 'case-result', module: suite.module, result })
      }
    }

    // 执行 afterAll 钩子（即使 beforeAll 失败也尝试执行）
    if (suite.afterAll) {
      try {
        await this.withTimeout(suite.afterAll(), DEFAULT_TIMEOUT)
      } catch {
        // afterAll 失败不影响已收集的结果，仅静默处理
      }
    }

    // 标记套件完成
    suiteResult.status = 'done'
    suiteResult.endTime = Date.now()
    this.emit({ type: 'suite-result', module: suite.module, result: suiteResult })

    return suiteResult
  }

  /**
   * 执行单个测试用例（含生命周期钩子）
   * @param suite - 所属测试套件
   * @param testCase - 待执行的测试用例
   * @returns 用例执行结果
   */
  private async runCase(suite: TestSuite, testCase: TestCase): Promise<TestResult> {
    const caseResult: TestResult = {
      caseName: testCase.name,
      status: 'running',
      duration: 0,
      logs: []
    }

    // 派发用例开始事件
    this.emit({ type: 'case-start', module: suite.module, caseName: testCase.name })

    const startTime = Date.now()
    const timeout = testCase.timeout ?? DEFAULT_TIMEOUT

    try {
      // 执行 beforeEach 钩子
      if (suite.beforeEach) {
        await this.withTimeout(suite.beforeEach(), timeout)
      }

      // 执行测试用例本体
      await this.withTimeout(testCase.fn(), timeout)

      caseResult.status = 'passed'
    } catch (e) {
      caseResult.status = 'failed'
      if (e instanceof AssertionError) {
        caseResult.error = {
          message: e.message,
          stack: e.stack
        }
      } else if (e instanceof Error) {
        // 区分超时错误和普通错误
        caseResult.error = {
          message: e.message,
          stack: e.stack
        }
      } else {
        caseResult.error = {
          message: String(e)
        }
      }
    } finally {
      // 执行 afterEach 钩子
      if (suite.afterEach) {
        try {
          await this.withTimeout(suite.afterEach(), timeout)
        } catch {
          // afterEach 失败不影响用例结果
        }
      }
    }

    caseResult.duration = Date.now() - startTime
    return caseResult
  }

  /**
   * 更新套件结果中的用例记录
   * 查找同名用例并替换，或追加新记录
   * @param suiteResult - 套件执行结果
   * @param result - 用例执行结果
   */
  private updateCaseResult(suiteResult: SuiteResult, result: TestResult): void {
    const existingIndex = suiteResult.results.findIndex(
      r => r.caseName === result.caseName
    )
    if (existingIndex !== -1) {
      suiteResult.results[existingIndex] = result
    } else {
      suiteResult.results.push(result)
    }
  }

  /**
   * 为 Promise 添加超时控制
   * @param promise - 待包装的 Promise
   * @param ms - 超时时间（毫秒）
   * @returns 带超时控制的 Promise
   * @throws Error 当超时时抛出超时错误
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`用例执行超时 (${ms}ms)`))
      }, ms)

      promise
        .then(value => {
          clearTimeout(timer)
          resolve(value)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * 向所有监听器派发事件
   * @param event - 待派发的测试事件
   */
  private emit(event: TestEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // 监听器异常不影响引擎运行
      }
    }
  }
}

/** 测试运行引擎单例 */
export const testRunner = new TestRunner()

export { TestRunner }
