# ID Battle 全功能测试套件设计

## 概述

为 ID Battle 游戏构建一个完整的前端端到端测试系统，连接真实后端 API，通过浏览器页面一键执行所有测试用例，实时展示测试结果和日志。

## 技术方案

**方案 A：纯 Vue 页面 + 手写 TestRunner**

- 零新依赖，完全融入现有项目
- 直接复用 `src/api/` 层，共享类型定义
- 测试页面使用 Liquid Glass 风格，与游戏 UI 统一

## 文件结构

```
src/
├── testing/
│   ├── core/
│   │   ├── TestRunner.ts          # 测试引擎：注册、执行、结果收集
│   │   ├── Assertions.ts          # 断言工具库
│   │   └── types.ts               # 类型定义
│   ├── suites/
│   │   ├── authTests.ts
│   │   ├── characterTests.ts
│   │   ├── inventoryTests.ts
│   │   ├── equipmentTests.ts
│   │   ├── petTests.ts
│   │   ├── battleTests.ts
│   │   ├── mapTests.ts
│   │   ├── dungeonTests.ts
│   │   ├── socialTests.ts
│   │   ├── teamTests.ts
│   │   ├── chatTests.ts
│   │   ├── leaderboardTests.ts
│   │   ├── arenaTests.ts
│   │   └── pvpTests.ts
│   ├── utils/
│   │   └── testHelper.ts          # 随机用户名生成、等待、清理等
│   └── registry.ts                # 汇总注册所有测试套件
├── views/
│   └── TestView.vue               # 测试页面（三栏布局）
└── components/
    └── test/
        ├── TestSidebar.vue        # 左侧：模块列表 + 统计
        ├── TestPanel.vue          # 中间：用例列表 + 执行控制
        └── TestLog.vue            # 底部：实时日志面板
```

## 核心类型定义

```typescript
interface TestCase {
  name: string
  fn: () => Promise<void>
  timeout?: number                // 默认 10000ms
  skip?: boolean
}

interface TestSuite {
  module: string
  icon: string
  beforeAll?: () => Promise<void>
  afterAll?: () => Promise<void>
  beforeEach?: () => Promise<void>
  afterEach?: () => Promise<void>
  cases: TestCase[]
}

interface TestResult {
  caseName: string
  status: 'passed' | 'failed' | 'skipped' | 'running'
  duration: number
  error?: { message: string; stack?: string }
  logs: LogEntry[]
}

interface SuiteResult {
  module: string
  status: 'idle' | 'running' | 'done'
  results: TestResult[]
  startTime?: number
  endTime?: number
}
```

## TestRunner 引擎

### 执行流程

```
用户点击"全部执行"或单独执行某模块
       │
       ▼
  TestRunner.run(suite?) ── 按模块顺序串行执行
       │
       ├── suite.beforeAll()     ← 自动注册测试账号、登录
       │
       ├── 遍历 cases[]：
       │   ├── beforeEach()
       │   ├── case.fn()         ← 调用真实 API
       │   │   ├── 成功 → passed
       │   │   ├── 断言失败 → failed + 错误信息
       │   │   └── 超时/异常 → failed + 堆栈
       │   ├── afterEach()
       │   └── 实时推送 TestResult → Vue 组件更新
       │
       ├── suite.afterAll()      ← 清理测试数据
       │
       └── 推送 SuiteResult（汇总统计）
```

### 关键机制

- **模块间串行**：按依赖顺序执行，避免数据竞争
- **模块内用例串行**：保证前后用例的数据状态
- **超时自动 fail**：每个用例默认 10s 超时
- **错误不中断**：某个用例失败不阻止后续用例
- **日志收集**：每个 API 调用的 request/response 自动记录

## 断言工具库

支持方法：`toBe`, `toEqual`, `toBeDefined`, `toBeUndefined`, `toBeNull`, `toBeTruthy`, `toBeFalsy`, `toBeGreaterThan`, `toBeLessThan`, `toHaveLength`, `toContain`, `toMatch`, `toThrow`, `resolves`, `rejects`。

失败时自动收集：断言表达式、实际值 vs 期望值、用例名称和所属模块。

不实现 `not` 否定链，直接用反向断言替代。

## 测试页面 UI

### 三栏布局

```
┌─────────────────────────────────────────────────────────────────────┐
│  Test Suite Runner                              [⚙ 设置] [🔄 重试] │
├──────────────┬────────────────────────────────┬────────────────────┤
│  模块列表     │      用例列表 + 执行状态         │    日志面板        │
│  (200px)     │      (flex-grow)               │    (300px)         │
│              │                                │                    │
│  认证系统     │  [▶ 执行全部] [□ 只测选中]      │  [清空] [复制]     │
│  ✓ 5/5      │                                │                    │
│              │  ▶ 登录-正确密码      ✓ 32ms   │  [09:12:01]        │
│  角色系统     │  ▶ 登录-错误密码      ✓ 45ms   │  → POST /auth/... │
│  ○ 0/8      │  ▶ 注册-新用户        ✓ 89ms   │  ← 200 {"token":  │
│              │  ▶ 注册-重复用户      ✗ 12ms   │  [09:12:02]        │
│  背包系统     │    └─ Error: 用户已存在        │  → POST /char/... │
│  ○ 0/5      │  ▶ 登出              ✓ 15ms   │  ← 200 {...}      │
│              │                                │                    │
│  ...         │  统计: 通过 4 | 失败 1 | 跳过 0 │                    │
├──────────────┴────────────────────────────────┴────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░  认证系统 3/5 (60%)   │
└─────────────────────────────────────────────────────────────────────┘
```

### 左侧 TestSidebar.vue

- 每个模块一行：图标 + 名称 + 统计（✓ 5/5 或 ○ 0/8）
- 状态颜色：全部通过绿色边框、有失败红色、运行中蓝色高亮
- 点击模块切换中间区域
- 底部汇总统计

### 中间 TestPanel.vue

- 工具栏：执行全部 / 执行选中模块 / 停止
- 每个用例一行：状态图标 + 用例名 + 耗时
- 失败用例展开错误详情（错误信息 + 堆栈）
- 底部汇总条

### 右侧 TestLog.vue

- 日志格式：`[时间] 方向 内容`
- 方向：→ 请求（蓝）、← 响应（绿）、✗ 错误（红）、i 信息（灰）
- 支持清空、复制全部日志
- 自动滚动到最新，可手动暂停

### 顶部配置栏

- 后端地址输入框（默认 http://192.168.0.228:8080）
- 连接状态指示灯

### 底部进度条

- 整体进度百分比
- 当前执行的模块名

## 测试用例清单（80 个）

### 1. 认证系统（7 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 注册 - 新用户 | registerApi(随机用户名) | code=200, token 已定义 |
| 注册 - 重复用户名 | registerApi(同一用户名) | code=409 或错误提示 |
| 注册 - 空用户名 | registerApi("") | code=400 |
| 登录 - 正确密码 | loginApi(用户名, 密码) | code=200, token 已定义 |
| 登录 - 错误密码 | loginApi(用户名, 错误密码) | code=401 |
| 登录 - 不存在的用户 | loginApi(不存在, 任意) | code=404 或 401 |
| 检测用户名可用性 | checkUsernameApi(随机名) | code=200, available=true |

### 2. 角色系统（8 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取角色列表（新账号应为空） | getCharacterListApi() | code=200, data 为空数组 |
| 创建角色 - 战士 | createCharacterApi(name, WARRIOR) | code=200, 返回角色数据 |
| 创建角色 - 法师 | createCharacterApi(name, MAGE) | code=200 |
| 创建角色 - 猎人 | createCharacterApi(name, HUNTER) | code=200 |
| 创建第 4 个角色（应失败） | createCharacterApi(name, WARRIOR) | code=403 或限制提示 |
| 检测角色名可用 | checkCharacterNameApi(随机名) | code=200 |
| 获取角色详情 | getCharacterInfoApi(characterId) | code=200, 属性字段完整 |
| 删除角色 | deleteCharacterApi(characterId) | code=200 |

### 3. 背包系统（5 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取背包物品 | getInventoryApi(characterId) | code=200 |
| 使用消耗品 | useItemApi(characterId, itemId, 1) | code=200, 数量减少 |
| 使用物品 - 数量为0 | useItemApi(characterId, itemId, 1) | 应失败 |
| 丢弃物品 | discardItemApi(characterId, itemId, 1) | code=200 |
| 丢弃不存在的物品 | discardItemApi(characterId, 假id, 1) | code=404 |

### 4. 装备系统（7 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 穿戴装备 | equipItemApi(...) | code=200, 角色属性变化 |
| 穿戴 - 已占用槽位 | equipItemApi(同槽位) | 替换或提示 |
| 卸下装备 | unequipItemApi(...) | code=200, 属性恢复 |
| 卸下 - 空槽位 | unequipItemApi(空槽) | 应无变化或提示 |
| 强化装备 | enhanceEquipmentApi(...) | code=200, 等级+1 |
| 属性加点 | updateAttributesApi(...) | code=200, 属性变化 |
| 获取角色属性 | getCharacterInfoApi(...) | 属性计算正确 |

### 5. 战宠系统（10 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取战宠列表 | getPetListApi(characterId) | code=200 |
| 设置出战战宠 | setActivePetApi(...) | code=200, is_active=true |
| 取消出战 | setActivePetApi(null) | code=200 |
| 喂食战宠 | feedPetApi(...) | code=200, 经验增加 |
| 重命名战宠 | renamePetApi(...) | code=200, 名字更新 |
| 装备技能 | equipSkillApi(...) | code=200 |
| 卸下技能 | unequipSkillApi(...) | code=200 |
| 战宠穿戴装备 | equipPetItemApi(...) | code=200 |
| 战宠卸下装备 | unequipPetItemApi(...) | code=200 |
| 进化战宠 | evolvePetApi(...) | 满足条件 code=200，不满足时提示 |

### 6. 战斗系统（6 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 发起战斗 | startBattleApi(...) | code=200, 返回 battleId |
| 提交行动 - 普攻 | submitActionApi(attack) | code=200, 伤害结算 |
| 提交行动 - 技能 | submitActionApi(skill) | code=200 |
| 提交行动 - 使用物品 | submitActionApi(item) | code=200 |
| 结束战斗 | endBattleApi(battleId) | code=200, 返回奖励 |
| 战斗结算 - 经验和物品 | 验证返回数据 | 奖励数据结构完整 |

### 7. 地图系统（4 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取区域列表 | getAreaListApi() | code=200, 至少 1 个区域 |
| 获取区域详情 | getAreaDetailApi(areaId) | code=200, 怪物列表非空 |
| 进入区域 | enterAreaApi(...) | code=200 |
| 创建野外怪物 | createWildMonsterCombatant(...) | 返回有效 Combatant |

### 8. 副本系统（4 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取副本配置 | getDungeonConfigsForRoomApi() | code=200 |
| 进入副本 | enterDungeonApi(...) | code=200, runState 初始化 |
| 完成副本 | completeDungeonApi(...) | code=200, 奖励返回 |
| 副本掉落验证 | 检查奖励数据 | 物品/经验/金币字段存在 |

### 9. 社交系统（7 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取好友列表 | getFriendListApi() | code=200 |
| 搜索玩家 | searchPlayerApi(keyword) | code=200 |
| 发送好友请求 | sendFriendRequestApi(...) | code=200 |
| 获取待处理请求 | getFriendListApi() | pending 非空 |
| 接受好友请求 | acceptFriendRequestApi(...) | code=200 |
| 拒绝好友请求 | rejectFriendRequestApi(...) | code=200 |
| 删除好友 | deleteFriendApi(...) | code=200 |

### 10. 组队系统（8 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 创建队伍 | createTeamApi() | code=200, 返回 teamId |
| 获取我的队伍 | getMyTeamApi() | code=200 |
| 获取公开队伍列表 | getTeamListApi() | code=200 |
| 切换队伍状态 | toggleTeamStatusApi('closed') | code=200 |
| 邀请好友入队 | inviteToTeamApi(...) | code=200 |
| 踢出成员 | kickMemberApi(...) | code=200 |
| 转让队长 | changeLeaderApi(...) | code=200 |
| 解散队伍 | disbandTeamApi() | code=200 |

### 11. 聊天系统（4 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取世界频道消息 | getWorldMessagesApi() | code=200 |
| 发送世界消息 | sendMessageApi('world', 'test') | code=200 |
| 获取私聊会话 | getPrivateConversationsApi() | code=200 |
| 发送私聊消息 | sendMessageApi('private', 'hi', targetId) | code=200 |

### 12. 排行榜（3 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 等级排行 | getLeaderboardApi('level', 'all') | code=200, entries 数组 |
| 战力排行 | getLeaderboardApi('power', 'all') | code=200 |
| 竞技排行 | getLeaderboardApi('arena', 'friends') | code=200 |

### 13. 竞技场（3 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 获取赛季信息 | getArenaSeasonApi() | code=200, 赛季字段完整 |
| 获取玩家竞技数据 | getArenaPlayerDataApi() | code=200, 积分/段位字段 |
| 数据完整性验证 | 检查返回结构 | 段位/积分/胜率字段齐全 |

### 14. PVP 系统（4 个）

| 用例 | 操作 | 断言 |
|------|------|------|
| 发起匹配 | startMatchmakingApi(score) | code=200 |
| 结算 - 胜利 | settlePvpBattleApi(..., true, ...) | code=200, 积分增加 |
| 结算 - 失败 | settlePvpBattleApi(..., false, ...) | code=200, 积分减少 |
| 积分计算验证 | 对比前后积分 | 分差符合 Elo 公式 |

## 模块依赖与执行顺序

```
认证系统 ──→ token + 测试账号
    │
    ▼
角色系统 ──→ characterId
    │
    ├─→ 背包系统（characterId）
    ├─→ 装备系统（characterId + 背包物品）
    ├─→ 战宠系统（characterId + 消耗品）
    │      │
    │      └─→ 战斗系统（角色属性 + 战宠）
    │             │
    │             ├─→ 地图系统（角色等级）
    │             │     └─→ 副本系统（区域数据）
    │             └─→ PVP 系统（角色数据）
    │
    └─→ 社交系统（characterId，需注册第二个测试账号）
           ├─→ 组队系统（好友关系）
           ├─→ 聊天系统（好友关系）
           ├─→ 排行榜（角色数据）
           └─→ 竞技场（角色数据）
```

## 生命周期钩子策略

### beforeAll

| 模块 | 动作 |
|------|------|
| 认证 | 自动注册测试账号 + 登录 |
| 角色 | 使用认证阶段的 token |
| 背包/装备/战宠 | 使用已创建的角色 ID |
| 战斗 | 确保角色有 HP/MP，战宠已出战 |
| 社交 | 注册第二个测试账号作为好友对象 |
| 组队 | 依赖社交阶段的好友关系 |
| PVP | 依赖角色数据用于匹配 |

### afterAll

| 模块 | 动作 |
|------|------|
| 角色 | 删除测试期间创建的角色 |
| 社交 | 删除好友关系 |
| 组队 | 解散队伍 |
| 认证 | 清除本地 token（最后执行） |

## 错误隔离

- 认证模块全部失败 → 后续模块自动 skip，日志标注"依赖模块失败"
- 某模块 beforeAll 失败 → 该模块所有用例 skip，不影响其他模块
- 单个用例失败不阻断同模块其他用例
