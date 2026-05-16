/**
 * API 防刷工具
 * 节流（throttle）和去重（dedupe）机制
 */

/** 节流记录：key → 最后调用时间戳 */
const throttleMap = new Map<string, number>()

/** 去重记录：key → 进行中的 Promise */
const dedupeMap = new Map<string, Promise<unknown>>()

/**
 * 节流请求：同一 key 在指定时间窗口内只允许一次调用
 * @param key - 唯一标识（如 'battle-action'）
 * @param fn - 实际请求函数
 * @param interval - 节流间隔（毫秒），默认 500
 * @returns 结果和是否被节流的标记
 */
export async function throttleRequest<T>(
  key: string,
  fn: () => Promise<T>,
  interval = 500
): Promise<{ result: T | null; throttled: boolean }> {
  const now = Date.now()
  const lastCall = throttleMap.get(key) ?? 0

  if (now - lastCall < interval) {
    return { result: null, throttled: true }
  }

  throttleMap.set(key, now)
  const result = await fn()
  return { result, throttled: false }
}

/**
 * 去重请求：相同 key 的并发请求只发一次，复用 Promise
 * @param key - 唯一标识（如 'inventory-use-123'）
 * @param fn - 实际请求函数
 * @returns 请求结果
 */
export async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const pending = dedupeMap.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = fn().finally(() => {
    dedupeMap.delete(key)
  })

  dedupeMap.set(key, promise)
  return promise
}

/**
 * 检查 URL 是否为高频接口并返回节流间隔
 * @param url - 请求 URL
 * @returns 节流间隔（毫秒），0 表示不限流
 */
export function getThrottleInterval(url: string | undefined): number {
  if (!url) return 0
  const rules: Array<{ pattern: string; interval: number }> = [
    { pattern: '/battle/action', interval: 300 },
    { pattern: '/inventory/use', interval: 500 },
    { pattern: '/inventory/discard', interval: 500 },
    { pattern: '/character/attributes', interval: 500 },
    { pattern: '/arena/match', interval: 2000 },
    { pattern: '/arena/settle', interval: 1000 },
    { pattern: '/pet/feed', interval: 500 },
    { pattern: '/pet/evolve', interval: 1000 }
  ]
  const match = rules.find(r => url.includes(r.pattern))
  return match?.interval ?? 0
}

/**
 * 清除所有节流记录
 */
export function clearThrottleRecords(): void {
  throttleMap.clear()
}

/**
 * 清除所有去重记录
 */
export function clearDedupeRecords(): void {
  dedupeMap.clear()
}
