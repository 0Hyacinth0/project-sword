# 剑之传说 - 前后端接口文档

> 版本：v1.1.0  
> 更新日期：2026-04-30  
> 状态：认证模块 + 角色模块

---

## 通用约定

### Base URL

```
待定，建议格式：https://api.example.com/v1
```

### 请求格式

- Content-Type: `application/json`
- 字符编码: `UTF-8`

### 认证方式

- 采用 **JWT (JSON Web Token)** 认证
- 登录成功后，后端返回 `token`
- 后续需要鉴权的接口，前端会在请求头中携带：

```
Authorization: Bearer <token>
```

### 统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 状态码，200 成功，其他为失败 |
| `message` | `string` | 提示信息，前端会直接展示给用户 |
| `data` | `object \| null` | 业务数据，失败时为 `null` |

### 常用错误码

| code | 含义 |
|------|------|
| `200` | 成功 |
| `400` | 请求参数错误 |
| `401` | 未认证 / Token 过期 |
| `409` | 资源冲突（如用户名已存在） |
| `500` | 服务器内部错误 |

---

## 接口列表

| 序号 | 方法 | 路径 | 说明 | 是否需要鉴权 |
|------|------|------|------|:---:|
| 1 | POST | `/auth/login` | 用户登录 | ❌ |
| 2 | POST | `/auth/register` | 用户注册 | ❌ |
| 3 | POST | `/auth/logout` | 用户登出 | ✅ |
| 4 | GET | `/auth/check-username` | 检测用户名是否可用 | ❌ |
| 5 | GET | `/character/list` | 获取角色列表 | ✅ |
| 6 | POST | `/character/create` | 创建角色 | ✅ |
| 7 | GET | `/character/check-name` | 检测角色名是否可用 | ✅ |
| 8 | DELETE | `/character/delete/{id}` | 删除角色 | ✅ |

---

## 1. 用户登录

### `POST /auth/login`

#### 请求参数（Request Body）

```json
{
  "username": "testuser",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:---:|------|------|
| `username` | `string` | ✅ | 3-20 个字符 | 用户名 |
| `password` | `string` | ✅ | 6-20 个字符 | 密码（明文传输，建议后端做 hash） |

#### 成功响应

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.id` | `string` | 用户唯一标识（UUID） |
| `data.username` | `string` | 用户名 |
| `data.token` | `string` | JWT Token，前端会存入 localStorage |

#### 失败响应示例

**用户名不存在：**
```json
{
  "code": 401,
  "message": "用户名不存在",
  "data": null
}
```

**密码错误：**
```json
{
  "code": 401,
  "message": "密码错误",
  "data": null
}
```

---

## 2. 用户注册

### `POST /auth/register`

#### 请求参数（Request Body）

```json
{
  "username": "newplayer",
  "password": "abc123"
}
```

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:---:|------|------|
| `username` | `string` | ✅ | 3-20 个字符 | 用户名，需唯一 |
| `password` | `string` | ✅ | 6-20 个字符 | 密码（明文传输，后端做 hash 存储） |

> **备注**：前端已做「确认密码」的一致性校验，不会传 `confirmPassword` 字段给后端。

#### 成功响应

```json
{
  "code": 200,
  "message": "注册成功，请登录",
  "data": null
}
```

> **说明**：注册成功后前端不会自动登录，而是切换到登录 Tab 让用户手动登录。所以注册接口无需返回 token。

#### 失败响应示例

**用户名已存在：**
```json
{
  "code": 409,
  "message": "该用户名已被注册",
  "data": null
}
```

**参数校验失败：**
```json
{
  "code": 400,
  "message": "用户名需要 3-20 个字符",
  "data": null
}
```

---

## 3. 用户登出

### `POST /auth/logout`

> 需要在请求头携带 `Authorization: Bearer <token>`

#### 请求参数

无（Token 从 Header 中获取）

#### 成功响应

```json
{
  "code": 200,
  "message": "已退出登录",
  "data": null
}
```

> **说明**：前端会清除本地 localStorage 中的用户信息。后端可选择将该 Token 加入黑名单，或直接依赖 Token 过期机制。

---

## 4. 检测用户名是否可用

### `GET /auth/check-username`

> 前端在注册表单中，用户输入用户名后会**防抖 500ms** 自动调用此接口，实时显示用户名是否可用。

#### 请求参数（Query String）

```
GET /auth/check-username?username=testuser
```

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:---:|------|------|
| `username` | `string` | ✅ | 3-20 个字符 | 待检测的用户名 |

#### 成功响应（可用）

```json
{
  "code": 200,
  "message": "用户名可用",
  "data": {
    "available": true
  }
}
```

#### 成功响应（已占用）

```json
{
  "code": 200,
  "message": "该用户名已被注册",
  "data": {
    "available": false
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.available` | `boolean` | `true` 可用，`false` 已被占用 |

> **说明**：此接口会被频繁调用（用户每次输入都会触发），建议后端做接口限流（如每 IP 每秒最多 5 次）。

---

## 5. 获取角色列表

### `GET /character/list`

> 需要在请求头携带 `Authorization: Bearer <token>`

#### 请求参数

无（用户身份从 JWT Token 中获取）

#### 成功响应

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "characterName": "剑圣无名",
      "profession": 1,
      "level": 15,
      "experience": 2340,
      "strength": 10,
      "intelligence": 3,
      "agility": 5,
      "hp": 500,
      "mp": 50,
      "physicalAttack": 20,
      "magicAttack": 6,
      "defense": 15,
      "dodgeRate": 5,
      "criticalRate": 3,
      "createTime": "2026-04-20T08:00:00Z",
      "updateTime": "2026-04-28T10:00:00Z"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `CharacterInfo[]` | 角色数组，最多 3 个元素 |
| `data[].id` | `string` | 角色唯一标识（UUID） |
| `data[].userId` | `string` | 所属用户 UUID |
| `data[].characterName` | `string` | 角色名 |
| `data[].profession` | `number` | 职业类型：1-战士, 2-法师, 3-猎人 |
| `data[].level` | `number` | 等级 |
| `data[].experience` | `number` | 经验值 |
| `data[].strength` | `number` | 力量 |
| `data[].intelligence` | `number` | 智力 |
| `data[].agility` | `number` | 敏捷 |
| `data[].hp` | `number` | 生命值 |
| `data[].mp` | `number` | 魔法值 |
| `data[].physicalAttack` | `number` | 物理攻击力 |
| `data[].magicAttack` | `number` | 魔法攻击力 |
| `data[].defense` | `number` | 防御力 |
| `data[].dodgeRate` | `number` | 闪避率 |
| `data[].criticalRate` | `number` | 暴击率 |
| `data[].createTime` | `string` | 创建时间（ISO 8601） |
| `data[].updateTime` | `string` | 更新时间（ISO 8601） |

> **说明**：前端在角色选择页加载时调用此接口。如果返回空数组，前端自动引导用户创建角色。

#### 失败响应示例

**未认证：**
```json
{
  "code": 401,
  "message": "登录已过期，请重新登录",
  "data": null
}
```

---

## 6. 创建角色

### `POST /character/create`

> 需要在请求头携带 `Authorization: Bearer <token>`

#### 请求参数（Request Body）

```json
{
  "characterName": "暗影刺客",
  "profession": 3
}
```

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:---:|------|------|
| `characterName` | `string` | ✅ | 2-12 个字符，全局唯一 | 角色名 |
| `profession` | `number` | ✅ | 枚举值：1 / 2 / 3 | 职业类型：1-战士, 2-法师, 3-猎人 |

#### 成功响应

```json
{
  "code": 200,
  "message": "角色创建成功",
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "characterName": "暗影刺客",
    "profession": 3,
    "level": 1,
    "experience": 0,
    "strength": 5,
    "intelligence": 4,
    "agility": 11,
    "hp": 125,
    "mp": 40,
    "physicalAttack": 10,
    "magicAttack": 8,
    "defense": 5,
    "dodgeRate": 5,
    "criticalRate": 3,
    "createTime": "2026-04-30T12:00:00Z",
    "updateTime": "2026-04-30T12:00:00Z"
  }
}
```

> **说明**：创建成功后，后端根据 `profession` 初始化对应职业的基础属性值。前端会将新角色追加到本地角色列表中。

#### 失败响应示例

**角色数量已满：**
```json
{
  "code": 403,
  "message": "每个账号最多创建 3 个角色",
  "data": null
}
```

**角色名已存在：**
```json
{
  "code": 409,
  "message": "该角色名已被使用",
  "data": null
}
```

**职业类型非法：**
```json
{
  "code": 400,
  "message": "无效的职业类型",
  "data": null
}
```

---

## 7. 检测角色名是否可用

### `GET /character/check-name`

> 需要在请求头携带 `Authorization: Bearer <token>`

> 前端在角色创建表单中，用户输入角色名后会**防抖 500ms** 自动调用此接口，实时显示角色名是否可用。

#### 请求参数（Query String）

```
GET /character/check-name?name=暗影刺客
```

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:---:|------|------|
| `name` | `string` | ✅ | 2-12 个字符 | 待检测的角色名 |

#### 成功响应（可用）

```json
{
  "code": 200,
  "message": "角色名可用",
  "data": {
    "available": true
  }
}
```

#### 成功响应（已占用）

```json
{
  "code": 200,
  "message": "该角色名已被使用",
  "data": {
    "available": false
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.available` | `boolean` | `true` 可用，`false` 已被占用 |

> **说明**：此接口会被频繁调用（用户每次输入都会触发），建议后端做接口限流（如每 IP 每秒最多 5 次）。

---

## 8. 删除角色

### `DELETE /character/delete/{id}`

> 需要在请求头携带 `Authorization: Bearer <token>`

#### 请求参数（Path Variable）

```
DELETE /character/delete/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `id` | `string` | ✅ | 要删除的角色 UUID |

#### 成功响应

```json
{
  "code": 200,
  "message": "角色已删除",
  "data": null
}
```

> **说明**：前端在删除前会弹出确认弹窗，确认后才调用此接口。删除成功后前端会从本地角色列表中移除该角色。

#### 失败响应示例

**角色不存在：**
```json
{
  "code": 404,
  "message": "角色不存在",
  "data": null
}
```

**无权删除他人角色：**
```json
{
  "code": 403,
  "message": "无权操作该角色",
  "data": null
}
```

---

## 前端数据结构参考

### 前端存储的用户对象

```typescript
interface UserInfo {
  id: string       // 用户 UUID
  username: string // 用户名
  token: string    // JWT Token
}
```

前端会将此对象以 `JSON.stringify` 存入 `localStorage`，key 为 `auth_user`。

### 角色信息对象

```typescript
interface CharacterInfo {
  id: string                // 角色 UUID
  userId: string            // 所属用户 UUID
  characterName: string     // 角色名
  profession: number        // 职业类型：1-战士, 2-法师, 3-猎人
  level: number             // 等级
  experience: number        // 经验值
  strength: number          // 力量
  intelligence: number      // 智力
  agility: number           // 敏捷
  hp: number                // 生命值
  mp: number                // 魔法值
  physicalAttack: number    // 物理攻击力
  magicAttack: number       // 魔法攻击力
  defense: number           // 防御力
  dodgeRate: number         // 闪避率
  criticalRate: number      // 暴击率
  createTime: string        // 创建时间（ISO 8601）
  updateTime: string        // 更新时间（ISO 8601）
}
```

> **字段命名说明**：后端使用 `snake_case`（如 `character_name`），JeecgBoot 自动转为 `camelCase`（如 `characterName`），前端统一使用 `camelCase`。

### 职业编号对照表

| profession 值 | 职业 | 主属性 | 初始属性 (STR/INT/AGI) |
|:---:|------|------|------|
| `1` | 战士 (Warrior) | 力量 | 10 / 3 / 5 |
| `2` | 法师 (Mage) | 智力 | 2 / 12 / 4 |
| `3` | 猎人 (Hunter) | 敏捷 | 5 / 4 / 11 |

### 前端校验规则汇总

| 字段 | 前端校验 | 建议后端也校验 |
|------|----------|:---:|
| 用户名 | 非空，3-20 字符 | ✅ |
| 密码 | 非空，6-20 字符 | ✅ |
| 确认密码 | 与密码一致（仅前端校验，不传后端） | — |
| 角色名 | 非空，2-12 字符 | ✅ |
| 职业类型 | 枚举值 1/2/3 | ✅ |
| 角色数量 | ≤ 3 个（前端隐藏创建入口） | ✅（后端必须再次校验） |

---

## 补充说明

1. **密码安全**：当前前端明文传输密码，建议上线前改为 HTTPS，或前端做一层加密后传输
2. **Token 有效期**：建议后端设置合理的 JWT 过期时间（如 24h），前端收到 401 时自动跳转登录页
3. **CORS**：后端需配置跨域允许，开发环境前端地址为 `http://localhost:5173`
