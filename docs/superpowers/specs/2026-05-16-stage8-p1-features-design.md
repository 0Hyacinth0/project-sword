# 阶段八 P1 功能设计：异步 PVP + 暗色模式 + 响应式优化

## 概述

实现开发方案阶段八剩余 P1 功能：非实时 PVP（挑战好友镜像）、暗色模式完整适配、移动端响应式优化。三个功能相互独立。

---

## 1. 非实时 PVP（挑战好友镜像）

### 1.1 入口

FriendPanel 好友卡片右下角新增"挑战"按钮。点击后弹出确认弹窗（显示好友名称 + 确认/取消），确认后进入 BattleView。

### 1.2 数据流

```
好友列表 → 选择好友 → generateFriendMirrorCombatant() → battleStore.startWildBattle() → 战斗 → 结算提示（无积分）→ 返回 FriendPanel
```

### 1.3 镜像生成

- 使用好友的 `profession` + `level` 生成战斗属性（复用 `generateOpponentStats`）
- 使用好友职业的默认技能（复用 `getOpponentSkills`）
- 无需后端接口，前端根据好友列表中已有的 profession/level 数据 Mock 生成

### 1.4 积分

纯娱乐，不结算 Elo 积分，不影响竞技场战绩。

### 1.5 UI 变化

- FriendPanel 好友卡片新增"挑战"按钮（胶囊按钮， swords 图标）
- 点击弹出 UiModal 确认弹窗："挑战 {好友名}？"
- 战斗使用现有 BattleConsole，结束后显示 BattleResultOverlay，点击确认返回 FriendPanel

### 1.6 文件清单

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/components/social/FriendPanel.vue` | 修改 | 新增挑战按钮 + 确认弹窗 |
| `src/stores/social.ts` | 修改 | 新增 `startAsyncPvpBattle(friendId)` |
| `src/config/pvp_config.ts` | 修改 | 新增 `generateFriendMirrorCombatant(friend)` |
| `src/views/HomeView.vue` | 修改 | 监听 FriendPanel 的 `battle-started` 事件跳转 BattleView |

---

## 2. 暗色模式完整适配

### 2.1 现状

- CSS 变量已完备（`variables.css` 中 `[data-theme='dark']` 覆盖全部变量）
- ThemeToggle 组件已实现主题切换 + localStorage 持久化
- 仅 4/12 个 CSS 文件和 2/53 个组件有暗色样式

### 2.2 策略

逐组件审计，补全 `[data-theme='dark']` 选择器覆盖。核心规则：
1. 硬编码颜色 → 改用 CSS 变量
2. 缺少暗色覆盖 → 补充 `[data-theme='dark']` 块

### 2.3 分组

| 组别 | 文件 |
|:---|:---|
| 全局样式 | common.css、ui.css、home.css |
| 功能样式 | battle.css、pet.css、character-create.css |
| 组件 scoped | 所有 Vue 组件的 `<style scoped>` 内补全暗色覆盖 |

### 2.4 审计清单

| 页面 | 组件 | CSS 文件 | 现状 |
|:---|:---|:---|:---|
| 登录 | LoginView.vue | login.css | ✅ 已有 |
| 角色选择 | CharacterSelectView.vue | character-select.css | ✅ 已有 |
| 角色创建 | CharacterCreateView.vue | character-create.css | ❌ 缺失 |
| 首页 | HomeView.vue | home.css | ❌ 缺失 |
| 战斗 | BattleConsole.vue 等 | battle.css | ❌ 缺失 |
| 背包 | BackpackGrid.vue | inventory.css | ✅ 已有 |
| 装备 | EquipmentPanel.vue | character.css | ✅ 已有 |
| 战宠 | PetView.vue | pet.css | ❌ 缺失 |
| 社交 | FriendPanel.vue 等 | common.css | 部分 |
| 副本 | DungeonPanel.vue | common.css | 部分 |
| 地图 | WorldMapPanel.vue | common.css | 部分 |
| 竞技 | ArenaPanel.vue | common.css | 部分 |
| UI 基础 | UiPanel.vue、UiModal.vue 等 | ui.css | ❌ 缺失 |

---

## 3. 移动端响应式优化

### 3.1 断点规范

| 断点 | 设备 | 典型场景 |
|:---:|:---|:---|
| `max-width: 1024px` | iPad 平板 | 面板布局从并排改为堆叠 |
| `max-width: 768px` | 手机横屏/小平板 | 按钮堆叠、字体缩小 |
| `max-width: 375px` | iPhone SE 小屏 | 单列布局、间距紧缩 |

### 3.2 统一断点变量

新增到 `variables.css`：
```css
--breakpoint-mobile: 375px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
```

### 3.3 各模块响应策略

| 模块 | 1024px | 768px | 375px |
|:---|:---|:---|:---|
| 首页 | 面板并排 | 面板堆叠 | 单列、Tab 缩小 |
| 战斗 | 完整布局 | 行动面板折叠 | 技能网格 3 列 |
| 背包 | 4 列网格 | 3 列 | 2 列 |
| 社交 | 列表完整 | 按钮堆叠 | 操作栏紧凑 |
| 角色/战宠 | 面板并排 | 堆叠 | 雷达图缩小 |

### 3.4 需补全的组件

战斗组件（13 个）已有较好覆盖，主要补充：
- HomeView.vue — 首页布局
- LoginView.vue — 登录表单
- CharacterSelectView.vue — 角色卡片
- CharacterCreateView.vue — 创建页面
- FriendPanel.vue — 好友列表
- ChatPanel.vue — 聊天面板
- TeamPanel.vue — 组队面板
- DungeonRoomPanel.vue — 房间面板
- WorldMapPanel.vue — 地图面板
- ArenaPanel.vue — 竞技面板
- PetListPanel.vue / PetDetailPanel.vue — 战宠面板
- EquipmentPanel.vue — 装备面板
- BackpackGrid.vue — 背包网格
- UiPanel.vue / UiModal.vue — 基础组件

---

## 不做的功能

- 全局音效与 BGM（P2，第二批）
- 加载动画与转场优化（P2，第二批）
- 战报回放（P2，第二批）
- 异步 PVP 积分结算（纯娱乐）
- 异步 PVP 防守/被挑战记录
- 响应式图片/资源适配
