# 安全加固（接口防刷、数值校验）设计

## 概述

前端实现接口防刷（节流、去重）和业务数值校验，防止恶意请求和非法数值操作。

---

## 1. 接口防刷

### 1.1 节流（Throttle）

同一 API 在指定时间窗口内只允许一次调用，防止重复点击。

```typescript
// src/utils/apiGuard.ts
function throttleRequest<T>(key: string, fn: () => Promise<T>, interval = 500): Promise<{ result: T; throttled: boolean }>
```

- 用 `Map<string, number>` 存储每个 key 的最后调用时间
- 调用时检查是否在 interval 内，若在则返回 `{ throttled: true, result: null }`
- 默认 interval 500ms

### 1.2 去重（Dedupe）

相同参数的并发请求只发一次，复用 Promise。

```typescript
// src/utils/apiGuard.ts
function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T>
```

- 用 `Map<string, Promise<T>>` 存储进行中的请求
- 相同 key 的并发请求复用同一个 Promise
- 请求完成后自动清理 Map

---

## 2. 数值校验

### 业务校验函数

```typescript
// src/utils/validators.ts

/** 校验属性点加点 */
function validateAttributePoints(point: number, available: number): { valid: boolean; message: string }

/** 校验物品使用/丢弃数量 */
function validateItemQuantity(quantity: number, owned: number): { valid: boolean; message: string }

/** 校验竞技积分 */
function validateScore(score: number): { valid: boolean; message: string }

/** 校验等级 */
function validateLevel(level: number): { valid: boolean; message: string }
```

校验规则：
- 属性点：`point >= 0 && point <= available`
- 物品数量：`quantity > 0 && quantity <= owned`
- 积分：`score >= 0`
- 等级：`level > 0`

---

## 3. request.ts 集成

在请求拦截器中为高频接口添加节流标记：

- 战斗行动（`/battle/action`）— 节流 300ms
- 物品使用（`/inventory/use`）— 节流 500ms
- 属性加点（`/character/attributes`）— 节流 500ms

---

## 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/utils/apiGuard.ts` | 新建 | throttleRequest、dedupeRequest |
| `src/utils/validators.ts` | 新建 | 数值校验函数 |
| `src/api/request.ts` | 修改 | 集成高频接口节流 |

---

## 使用示例

```typescript
// 战斗行动提交（防刷）
import { throttleRequest } from '../utils/apiGuard'

async function submitAction(action) {
  const { throttled } = await throttleRequest('battle-action', () => battleStore.submitAction(action), 300)
  if (throttled) {
    showToast('操作过快，请稍后再试')
    return
  }
}

// 属性加点（校验）
import { validateAttributePoints } from '../utils/validators'

function handleAddStrength() {
  const { valid, message } = validateAttributePoints(1, character.availablePoints)
  if (!valid) {
    showToast(message)
    return
  }
  // 执行加点...
}
```

---

## 不做的功能

- CSRF 防护
- Token 刷新机制
- 请求签名/加密
- CSP/XSS 安全头
- 安全日志/审计