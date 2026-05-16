/**
 * 断言库
 * 提供链式断言 API，支持同步/异步断言，失败时抛出 AssertionError
 */

/**
 * 断言错误类
 * 扩展原生 Error，携带实际值、期望值和比较运算符，便于调试定位
 */
export class AssertionError extends Error {
  /** 实际值 */
  actual: unknown
  /** 期望值 */
  expected: unknown
  /** 比较运算符描述 */
  operator: string

  /**
   * 构造断言错误实例
   * @param message - 错误描述信息
   * @param actual - 实际值
   * @param expected - 期望值
   * @param operator - 比较运算符
   */
  constructor(message: string, actual: unknown, expected: unknown, operator: string) {
    super(message)
    this.name = 'AssertionError'
    this.actual = actual
    this.expected = expected
    this.operator = operator
  }
}

/**
 * 格式化值为可读字符串
 * @param value - 待格式化的值
 * @returns 格式化后的字符串表示
 */
function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/**
 * 创建断言错误信息
 * @param actual - 实际值
 * @param expected - 期望值
 * @param operator - 比较运算符
 * @returns 格式化的错误信息字符串
 */
function createMessage(actual: unknown, expected: unknown, operator: string): string {
  return `期望 ${operator}\n  实际值: ${formatValue(actual)}\n  期望值: ${formatValue(expected)}`
}

/**
 * 断言链对象，包含各种断言方法
 */
interface Assertions {
  /** 断言实际值严格等于期望值（使用 ===） */
  toBe(expected: unknown): void
  /** 断言实际值深度等于期望值（递归比较对象/数组） */
  toEqual(expected: unknown): void
  /** 断言实际值已定义（不为 undefined） */
  toBeDefined(): void
  /** 断言实际值为 undefined */
  toBeUndefined(): void
  /** 断言实际值为 null */
  toBeNull(): void
  /** 断言实际值为真值（Boolean() 转换后为 true） */
  toBeTruthy(): void
  /** 断言实际值为假值（Boolean() 转换后为 false） */
  toBeFalsy(): void
  /** 断言实际值大于期望值 */
  toBeGreaterThan(expected: number): void
  /** 断言实际值小于期望值 */
  toBeLessThan(expected: number): void
  /** 断言实际值大于或等于期望值 */
  toBeGreaterThanOrEqual(expected: number): void
  /** 断言实际值小于或等于期望值 */
  toBeLessThanOrEqual(expected: number): void
  /** 断言实际值具有指定长度 */
  toHaveLength(expected: number): void
  /** 断言实际值（数组/字符串）包含期望值 */
  toContain(expected: unknown): void
  /** 断言实际值匹配正则表达式 */
  toMatch(expected: RegExp | string): void
  /** 断言传入的函数会抛出错误 */
  toThrow(expected?: string | RegExp): void
}

/**
 * 创建断言链对象
 * @param actual - 待断言的实际值
 * @returns 包含各种断言方法的链式对象
 */
function createAssertions(actual: unknown): Assertions {
  return {
    /**
     * 断言实际值严格等于期望值
     * @param expected - 期望的值
     * @throws AssertionError 当值不相等时
     */
    toBe(expected: unknown): void {
      if (actual !== expected) {
        throw new AssertionError(
          createMessage(actual, expected, '严格相等 (===)'),
          actual,
          expected,
          'toBe'
        )
      }
    },

    /**
     * 断言实际值深度等于期望值
     * @param expected - 期望的值
     * @throws AssertionError 当值不深度相等时
     */
    toEqual(expected: unknown): void {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(
          createMessage(actual, expected, '深度相等'),
          actual,
          expected,
          'toEqual'
        )
      }
    },

    /**
     * 断言实际值已定义（不为 undefined）
     * @throws AssertionError 当值为 undefined 时
     */
    toBeDefined(): void {
      if (actual === undefined) {
        throw new AssertionError(
          '期望值已定义，但得到了 undefined',
          actual,
          'defined',
          'toBeDefined'
        )
      }
    },

    /**
     * 断言实际值为 undefined
     * @throws AssertionError 当值不为 undefined 时
     */
    toBeUndefined(): void {
      if (actual !== undefined) {
        throw new AssertionError(
          `期望值为 undefined，但得到了 ${formatValue(actual)}`,
          actual,
          undefined,
          'toBeUndefined'
        )
      }
    },

    /**
     * 断言实际值为 null
     * @throws AssertionError 当值不为 null 时
     */
    toBeNull(): void {
      if (actual !== null) {
        throw new AssertionError(
          `期望值为 null，但得到了 ${formatValue(actual)}`,
          actual,
          null,
          'toBeNull'
        )
      }
    },

    /**
     * 断言实际值为真值
     * @throws AssertionError 当值为假值时
     */
    toBeTruthy(): void {
      if (!actual) {
        throw new AssertionError(
          `期望值为真值，但得到了 ${formatValue(actual)}`,
          actual,
          'truthy',
          'toBeTruthy'
        )
      }
    },

    /**
     * 断言实际值为假值
     * @throws AssertionError 当值为真值时
     */
    toBeFalsy(): void {
      if (actual) {
        throw new AssertionError(
          `期望值为假值，但得到了 ${formatValue(actual)}`,
          actual,
          'falsy',
          'toBeFalsy'
        )
      }
    },

    /**
     * 断言实际值大于期望值
     * @param expected - 期望比较的数值
     * @throws AssertionError 当实际值不大于期望值时
     */
    toBeGreaterThan(expected: number): void {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          createMessage(actual, expected, '大于 (>)'),
          actual,
          expected,
          'toBeGreaterThan'
        )
      }
    },

    /**
     * 断言实际值小于期望值
     * @param expected - 期望比较的数值
     * @throws AssertionError 当实际值不小于期望值时
     */
    toBeLessThan(expected: number): void {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          createMessage(actual, expected, '小于 (<)'),
          actual,
          expected,
          'toBeLessThan'
        )
      }
    },

    /**
     * 断言实际值大于或等于期望值
     * @param expected - 期望比较的数值
     * @throws AssertionError 当实际值小于期望值时
     */
    toBeGreaterThanOrEqual(expected: number): void {
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(
          createMessage(actual, expected, '大于或等于 (>=)'),
          actual,
          expected,
          'toBeGreaterThanOrEqual'
        )
      }
    },

    /**
     * 断言实际值小于或等于期望值
     * @param expected - 期望比较的数值
     * @throws AssertionError 当实际值大于期望值时
     */
    toBeLessThanOrEqual(expected: number): void {
      if (typeof actual !== 'number' || actual > expected) {
        throw new AssertionError(
          createMessage(actual, expected, '小于或等于 (<=)'),
          actual,
          expected,
          'toBeLessThanOrEqual'
        )
      }
    },

    /**
     * 断言实际值具有指定长度的 length 属性
     * @param expected - 期望的长度
     * @throws AssertionError 当长度不匹配时
     */
    toHaveLength(expected: number): void {
      const value = actual as { length?: number } | null | undefined
      if (value == null || typeof value.length !== 'number') {
        throw new AssertionError(
          `期望值有 length 属性，但得到了 ${formatValue(actual)}`,
          actual,
          expected,
          'toHaveLength'
        )
      }
      if (value.length !== expected) {
        throw new AssertionError(
          createMessage(value.length, expected, '长度相等'),
          value.length,
          expected,
          'toHaveLength'
        )
      }
    },

    /**
     * 断言实际值（数组/字符串）包含期望值
     * @param expected - 期望包含的值
     * @throws AssertionError 当不包含时
     */
    toContain(expected: unknown): void {
      const value = actual as string | unknown[] | null | undefined
      if (value == null) {
        throw new AssertionError(
          `期望值包含 ${formatValue(expected)}，但实际值为 null/undefined`,
          actual,
          expected,
          'toContain'
        )
      }
      if (typeof value === 'string') {
        if (typeof expected !== 'string' || !value.includes(expected)) {
          throw new AssertionError(
            createMessage(actual, expected, '包含 (contains)'),
            actual,
            expected,
            'toContain'
          )
        }
        return
      }
      if (Array.isArray(value)) {
        if (!value.some(item => deepEqual(item, expected))) {
          throw new AssertionError(
            createMessage(actual, expected, '包含 (contains)'),
            actual,
            expected,
            'toContain'
          )
        }
        return
      }
      throw new AssertionError(
        `toContain 仅适用于字符串或数组，但得到了 ${typeof value}`,
        actual,
        expected,
        'toContain'
      )
    },

    /**
     * 断言实际值匹配正则表达式
     * @param expected - 期望匹配的正则或字符串模式
     * @throws AssertionError 当不匹配时
     */
    toMatch(expected: RegExp | string): void {
      if (typeof actual !== 'string') {
        throw new AssertionError(
          `toMatch 仅适用于字符串，但得到了 ${typeof actual}`,
          actual,
          expected,
          'toMatch'
        )
      }
      const regex = typeof expected === 'string' ? new RegExp(expected) : expected
      if (!regex.test(actual)) {
        throw new AssertionError(
          createMessage(actual, expected, '匹配正则 (match)'),
          actual,
          expected,
          'toMatch'
        )
      }
    },

    /**
     * 断言传入的函数会抛出错误
     * 注意：actual 应为函数（非异步），否则断言失败
     * @param expected - 期望的错误消息或正则（可选）
     * @throws AssertionError 当函数未抛出错误或错误不匹配时
     */
    toThrow(expected?: string | RegExp): void {
      if (typeof actual !== 'function') {
        throw new AssertionError(
          'toThrow 仅适用于函数',
          actual,
          'function',
          'toThrow'
        )
      }
      let thrown = false
      let thrownError: unknown
      try {
        actual()
      } catch (e) {
        thrown = true
        thrownError = e
      }
      if (!thrown) {
        throw new AssertionError(
          '期望函数抛出错误，但未抛出任何错误',
          '未抛出',
          expected ?? '任意错误',
          'toThrow'
        )
      }
      if (expected !== undefined) {
        const errMsg = thrownError instanceof Error ? thrownError.message : String(thrownError)
        if (typeof expected === 'string') {
          if (!errMsg.includes(expected)) {
            throw new AssertionError(
              `期望错误消息包含 "${expected}"，但得到 "${errMsg}"`,
              errMsg,
              expected,
              'toThrow'
            )
          }
        } else {
          if (!expected.test(errMsg)) {
            throw new AssertionError(
              `期望错误消息匹配 ${expected}，但得到 "${errMsg}"`,
              errMsg,
              expected,
              'toThrow'
            )
          }
        }
      }
    }
  }
}

/**
 * 深度比较两个值是否相等
 * 支持原始类型、数组、普通对象的递归比较
 * @param a - 第一个值
 * @param b - 第二个值
 * @returns 是否深度相等
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // 严格相等直接返回
  if (a === b) return true

  // null 或非对象类型不相等
  if (a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  // 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  // 数组与非数组不相等
  if (Array.isArray(a) !== Array.isArray(b)) return false

  // 普通对象比较
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every(key => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
}

/**
 * expect 断言入口函数
 * 创建一个断言链用于验证 actual 值
 * @param actual - 待断言的实际值
 * @returns 断言链对象
 *
 * @example
 * expect(1 + 1).toBe(2)
 * expect({ name: 'test' }).toEqual({ name: 'test' })
 * expect([1, 2, 3]).toContain(2)
 */
export function expect(actual: unknown): Assertions {
  return createAssertions(actual)
}

/**
 * 异步断言工具对象
 * 提供 resolves 和 rejects 用于测试 Promise 的 resolve/reject 值
 */
export const expectAsync = {
  /**
   * 断言 Promise 成功 resolve，并验证 resolve 的值
   * @param promise - 待验证的 Promise
   * @returns 断言链对象，用于验证 resolve 值
   * @throws AssertionError 当 Promise 被 reject 时
   *
   * @example
   * await expectAsync.resolves(fetchData()).toEqual({ id: 1 })
   */
  async resolves<T>(promise: Promise<T>): Promise<Assertions> {
    let result: T
    try {
      result = await promise
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      throw new AssertionError(
        `期望 Promise resolve，但被 reject: ${errMsg}`,
        'rejected',
        'resolved',
        'resolves'
      )
    }
    return createAssertions(result)
  },

  /**
   * 断言 Promise 被 reject，并验证 reject 的原因
   * @param promise - 待验证的 Promise
   * @returns 断言链对象，用于验证 reject 原因
   * @throws AssertionError 当 Promise 成功 resolve 时
   *
   * @example
   * await expectAsync.rejects(Promise.reject(new Error('fail'))).toThrow('fail')
   */
  async rejects<T>(promise: Promise<T>): Promise<Assertions> {
    let error: unknown
    try {
      await promise
    } catch (e) {
      error = e
    }
    if (error === undefined) {
      throw new AssertionError(
        '期望 Promise reject，但成功 resolve',
        'resolved',
        'rejected',
        'rejects'
      )
    }
    const errorValue = error instanceof Error ? error : error
    return createAssertions(errorValue)
  }
}
