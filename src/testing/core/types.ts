/**
 * 测试框架核心类型定义
 * 定义日志、测试用例、测试套件、执行结果及事件等基础类型
 */

/** 日志条目 */
export interface LogEntry {
  /** 时间戳（毫秒） */
  timestamp: number
  /** 日志方向：请求 | 响应 | 错误 | 信息 */
  direction: 'request' | 'response' | 'error' | 'info'
  /** 日志内容 */
  content: string
}

/** 单个测试用例定义 */
export interface TestCase {
  /** 用例名称 */
  name: string
  /** 用例执行函数 */
  fn: () => Promise<void>
  /** 超时时间（毫秒），默认 10000 */
  timeout?: number
  /** 是否跳过该用例 */
  skip?: boolean
}

/** 测试套件定义 */
export interface TestSuite {
  /** 所属模块名称 */
  module: string
  /** 模块图标 */
  icon: string
  /** 套件内所有用例执行前的钩子 */
  beforeAll?: () => Promise<void>
  /** 套件内所有用例执行后的钩子 */
  afterAll?: () => Promise<void>
  /** 每个用例执行前的钩子 */
  beforeEach?: () => Promise<void>
  /** 每个用例执行后的钩子 */
  afterEach?: () => Promise<void>
  /** 测试用例列表 */
  cases: TestCase[]
}

/** 单个用例执行结果 */
export interface TestResult {
  /** 用例名称 */
  caseName: string
  /** 执行状态：通过 | 失败 | 跳过 | 运行中 */
  status: 'passed' | 'failed' | 'skipped' | 'running'
  /** 执行耗时（毫秒） */
  duration: number
  /** 错误信息（仅在失败时存在） */
  error?: { message: string; stack?: string }
  /** 执行期间产生的日志 */
  logs: LogEntry[]
}

/** 套件执行结果 */
export interface SuiteResult {
  /** 模块名称 */
  module: string
  /** 套件状态：空闲 | 运行中 | 完成 */
  status: 'idle' | 'running' | 'done'
  /** 各用例执行结果列表 */
  results: TestResult[]
  /** 套件开始时间 */
  startTime?: number
  /** 套件结束时间 */
  endTime?: number
}

/** 测试引擎事件类型 */
export type TestEvent =
  | { type: 'suite-start'; module: string }
  | { type: 'case-start'; module: string; caseName: string }
  | { type: 'case-result'; module: string; result: TestResult }
  | { type: 'suite-result'; module: string; result: SuiteResult }
  | { type: 'all-done'; summary: { total: number; passed: number; failed: number; skipped: number } }
  | { type: 'log'; module: string; entry: LogEntry }

/** 测试引擎事件回调 */
export type TestEventListener = (event: TestEvent) => void
