# 阶段八 P1 功能实现计划（异步 PVP + 暗色模式 + 响应式）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现非实时 PVP（好友挑战）、暗色模式完整适配、移动端响应式优化三个 P1 功能。

**Architecture:** 异步 PVP 在 FriendPanel 好友卡片新增挑战按钮，复用现有战斗引擎和 PVP 对手生成逻辑。暗色模式逐组件补全 `[data-theme='dark']` 样式覆盖（CSS 变量已完备）。响应式新增 375/768/1024 三档断点，补充缺失组件的 @media 查询。

**Tech Stack:** Vue 3 + TypeScript + Pinia + CSS Custom Properties

---

## File Structure

| 文件 | 操作 | 职责 |
|:---|:---|:---|
| `src/config/pvp_config.ts` | 修改 | 新增 `generateFriendMirrorCombatant` |
| `src/components/social/FriendPanel.vue` | 修改 | 新增挑战按钮 + 确认弹窗 + emit |
| `src/views/HomeView.vue` | 修改 | FriendPanel 连接 battle-started |
| `src/stores/social.ts` | 修改 | 新增 `startAsyncPvpBattle` |
| `src/assets/styles/variables.css` | 修改 | 新增断点变量 |
| `src/assets/styles/common.css` | 修改 | 暗色模式 + 响应式 |
| `src/assets/styles/ui.css` | 修改 | 暗色模式 + 响应式 |
| `src/assets/styles/home.css` | 修改 | 暗色模式 + 响应式 |
| `src/assets/styles/battle.css` | 修改 | 暗色模式 |
| `src/assets/styles/pet.css` | 修改 | 暗色模式 |
| `src/assets/styles/character-create.css` | 修改 | 暗色模式 |
| ~50 Vue 组件 scoped styles | 修改 | 暗色模式 + 响应式 |
| `非实时PVP-后端对接文档.md` | 新建 | 后端对接文档 |
| `开发方案.md` | 修改 | 更新完成状态 |

---

## Part A: 非实时 PVP（异步挑战好友）

### Task 1: 新增好友镜像 Combatant 生成函数

**Files:**
- Modify: `src/config/pvp_config.ts`

- [ ] **Step 1: 在 pvp_config.ts 末尾新增 `generateFriendMirrorCombatant` 函数**

在文件末尾、最后一个函数之后添加：

```typescript
/**
 * 根据好友信息生成镜像 Combatant（用于异步 PVP 挑战）
 * 复用 generateOpponentStats 和 getOpponentSkills 逻辑
 * @param friend - 好友信息（FriendInfo 类型，含 profession/level/characterName/characterId）
 * @returns 敌方 Combatant 对象
 */
export function generateFriendMirrorCombatant(friend: {
  characterId: string
  characterName: string
  profession: string
  level: number
}): Combatant {
  const mirrorOpponent: PvpOpponent = {
    characterId: friend.characterId,
    characterName: friend.characterName,
    profession: friend.profession,
    level: friend.level,
    tier: 'bronze',
    subTier: 'I',
    score: 0
  }

  const stats = generateOpponentStats(mirrorOpponent)
  const skills = getOpponentSkills(friend.profession)

  const ELEMENT_MAP: Record<string, number> = {
    none: 0, fire: 1, water: 2, wind: 3, earth: 4, light: 5, dark: 6
  }

  return {
    uid: `enemy-friend-${friend.characterId}`,
    sourceId: friend.characterId,
    name: friend.characterName,
    side: 'enemy',
    type: 'enemy',
    stats: {
      maxHp: stats.maxHp,
      hp: stats.maxHp,
      maxMp: stats.maxMp,
      mp: stats.maxMp,
      physicalAttack: stats.physicalAttack,
      magicAttack: stats.magicAttack,
      defense: stats.defense,
      speed: stats.speed,
      dodgeRate: stats.dodgeRate,
      criticalRate: stats.criticalRate
    },
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      type: 'active_attack' as const,
      mpCost: skill.mpCost,
      power: skill.power,
      targetType: skill.targetType,
      cooldown: skill.cooldown,
      element: ELEMENT_MAP[skill.element] ?? 0,
      description: ''
    })),
    buffs: [],
    cooldowns: {},
    isAlive: true,
    actionValue: 0
  }
}
```

同时需要在文件顶部添加 import：

```typescript
import type { Combatant } from '../types/battle'
```

- [ ] **Step 2: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 3: 提交**

```bash
git add src/config/pvp_config.ts
git commit -m "feat: add generateFriendMirrorCombatant for async PVP"
```

---

### Task 2: social store 新增异步 PVP 战斗方法

**Files:**
- Modify: `src/stores/social.ts`

- [ ] **Step 1: 在 social store 中新增 `startAsyncPvpBattle` 方法**

在 `src/stores/social.ts` 中添加以下 import（文件顶部，与其他 import 一起）：

```typescript
import { generateFriendMirrorCombatant } from '../config/pvp_config'
import { getActiveBattleSkills } from '../config/skill_config'
import { professionToJobType } from '../config/job_config'
import { calculateFullStats } from '../utils/attributeCalculator'
import { useBattleStore } from './battle'
import { useCharacterStore } from './character'
```

在 store 的 return 之前添加方法：

```typescript
/**
 * 发起异步 PVP 挑战（好友镜像战斗）
 * 根据好友 profession/level 生成镜像对手，复用战斗引擎
 * @param friend - 好友信息
 * @returns 操作结果
 */
async function startAsyncPvpBattle(friend: {
  characterId: string
  characterName: string
  profession: string
  level: number
}): Promise<{ success: boolean; message: string }> {
  const characterStore = useCharacterStore()
  const battleStore = useBattleStore()
  const detail = characterStore.characterDetail

  if (!detail) {
    return { success: false, message: '缺少角色详情数据' }
  }

  const enemyCombatant = generateFriendMirrorCombatant(friend)

  const attrs = {
    strength: detail.strength,
    intelligence: detail.intelligence,
    agility: detail.agility
  }
  const statsBreakdown = calculateFullStats(attrs, detail.profession, detail.equipment, null)
  const skills = getActiveBattleSkills(professionToJobType(detail.profession), detail.level)

  return battleStore.startWildBattle(
    detail.id,
    detail.characterName,
    statsBreakdown,
    skills,
    enemyCombatant
  )
}
```

在 store return 对象中添加 `startAsyncPvpBattle`。

- [ ] **Step 2: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 3: 提交**

```bash
git add src/stores/social.ts
git commit -m "feat: add startAsyncPvpBattle to social store"
```

---

### Task 3: FriendPanel 新增挑战按钮和确认弹窗

**Files:**
- Modify: `src/components/social/FriendPanel.vue`
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 修改 FriendPanel.vue — 添加挑战功能**

**模板修改：**

在在线好友卡片中（line ~101），将：
```html
<button class="friend-btn friend-btn--delete" @click="confirmDelete(friend)">删除</button>
```
替换为：
```html
<div class="friend-card__actions">
  <button class="friend-btn friend-btn--challenge" @click="confirmChallenge(friend)">挑战</button>
  <button class="friend-btn friend-btn--delete" @click="confirmDelete(friend)">删除</button>
</div>
```

对离线好友卡片（line ~123）做相同修改，也添加挑战按钮和包裹 `<div class="friend-card__actions">`。

**新增挑战确认弹窗（在删除确认弹窗 Teleport 之后添加第二个 Teleport）：**

```html
<!-- 挑战确认弹窗 -->
<Teleport to="body">
  <Transition name="friend-dialog">
    <div v-if="challengeTarget" class="friend-dialog-overlay" @click.self="challengeTarget = null">
      <div class="friend-dialog-card">
        <h3 class="friend-dialog__title">挑战好友</h3>
        <p class="friend-dialog__desc">确定要挑战「{{ challengeTarget.characterName }}」的镜像吗？</p>
        <div class="friend-dialog__actions">
          <button class="friend-dialog__btn friend-dialog__btn--cancel" @click="challengeTarget = null">取消</button>
          <button
            class="friend-dialog__btn friend-dialog__btn--challenge-confirm"
            @click="handleChallenge"
          >
            开始战斗
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

**Script 修改：**

在 `const deleteTarget` 之后添加：
```typescript
const challengeTarget = ref<FriendInfo | null>(null)
```

在 `handleDelete` 之后添加：
```typescript
/**
 * 确认挑战好友
 * @param friend - 好友信息
 */
function confirmChallenge(friend: FriendInfo): void {
  challengeTarget.value = friend
}

/**
 * 执行异步 PVP 挑战
 */
async function handleChallenge(): Promise<void> {
  if (!challengeTarget.value) return
  const target = challengeTarget.value
  challengeTarget.value = null
  emit('battle-started', target)
}
```

修改 `defineEmits` 或添加 emits 定义（如果不存在）：
```typescript
const emit = defineEmits<{
  'battle-started': [friend: { characterId: string; characterName: string; profession: string; level: number }]
}>()
```

**Style 修改 — 在 `.friend-btn--cancel` 之后添加：**

```css
.friend-btn--challenge {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

.friend-dialog__btn--challenge-confirm {
  background: var(--accent-blue);
  color: var(--button-text);
}
```

- [ ] **Step 2: 修改 HomeView.vue — 连接 FriendPanel 的 battle-started 事件**

在 HomeView.vue 中找到 FriendPanel 所在行（约 line 92）：
```html
<FriendPanel />
```
替换为：
```html
<FriendPanel @battle-started="handleFriendChallenge" />
```

在 script 部分的 `handleOpenDungeon` 函数附近添加：

```typescript
/**
 * 处理好友异步 PVP 挑战
 * 通过 social store 发起战斗后切换到战斗视图
 * @param friend - 被挑战的好友信息
 */
async function handleFriendChallenge(friend: {
  characterId: string; characterName: string; profession: string; level: number
}): Promise<void> {
  const socialStore = useSocialStore()
  const result = await socialStore.startAsyncPvpBattle(friend)
  if (result.success) {
    enterBattleView('friend')
  }
}
```

确保 `useSocialStore` 已在 HomeView.vue 的 script 中 import。

- [ ] **Step 3: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 4: 提交**

```bash
git add src/components/social/FriendPanel.vue src/views/HomeView.vue
git commit -m "feat: add async PVP challenge button to FriendPanel"
```

---

## Part B: 暗色模式完整适配

### Task 4: 全局 CSS 文件暗色模式补全

**Files:**
- Modify: `src/assets/styles/common.css`
- Modify: `src/assets/styles/ui.css`
- Modify: `src/assets/styles/home.css`

暗色模式使用 `[data-theme='dark']` 选择器。所有 CSS 变量已在 `variables.css` 中定义完毕，组件只需用 `[data-theme='dark']` 覆盖硬编码颜色值。

**审计规则：**
1. 硬编码的 `rgba(...)` 颜色值（如 `rgba(0,0,0,0.5)`）→ 暗色模式下需要对应的白色/透明变体
2. 硬编码的 `#xxx` 颜色值 → 改用 CSS 变量或添加暗色覆盖
3. `box-shadow` 中的颜色 → 暗色模式使用更深的阴影
4. 背景半透明色 → 暗色模式调整透明度

- [ ] **Step 1: 审计并修改 common.css**

读取 `src/assets/styles/common.css` 全文。查找所有硬编码颜色值。在文件末尾添加 `[data-theme='dark']` 覆盖块。

对于每个硬编码了颜色的 CSS 类，添加暗色模式版本。典型模式：

```css
/* 示例：如果有硬编码的白色背景 */
[data-theme='dark'] .some-class {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}
```

**需要检查的属性：**
- `background` / `background-color` — 非 CSS 变量的值
- `color` — 非 CSS 变量的值
- `border` / `border-color` — 非 CSS 变量的值
- `box-shadow` — 包含硬编码 rgba 的
- `opacity` 相关的半透明效果

- [ ] **Step 2: 审计并修改 ui.css**

同 Step 1 的模式。读取 `src/assets/styles/ui.css`，在末尾添加 `[data-theme='dark']` 覆盖。

- [ ] **Step 3: 审计并修改 home.css**

同 Step 1 的模式。读取 `src/assets/styles/home.css`，在末尾添加 `[data-theme='dark']` 覆盖。

- [ ] **Step 4: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 5: 提交**

```bash
git add src/assets/styles/common.css src/assets/styles/ui.css src/assets/styles/home.css
git commit -m "feat: add dark mode styles to global CSS files (common, ui, home)"
```

---

### Task 5: 功能 CSS 文件暗色模式补全

**Files:**
- Modify: `src/assets/styles/battle.css`
- Modify: `src/assets/styles/pet.css`
- Modify: `src/assets/styles/character-create.css`

- [ ] **Step 1: 审计并修改 battle.css**

读取 `src/assets/styles/battle.css`，在末尾添加 `[data-theme='dark']` 覆盖。

- [ ] **Step 2: 审计并修改 pet.css**

读取 `src/assets/styles/pet.css`，在末尾添加 `[data-theme='dark']` 覆盖。

- [ ] **Step 3: 审计并修改 character-create.css**

读取 `src/assets/styles/character-create.css`，在末尾添加 `[data-theme='dark']` 覆盖。

- [ ] **Step 4: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 5: 提交**

```bash
git add src/assets/styles/battle.css src/assets/styles/pet.css src/assets/styles/character-create.css
git commit -m "feat: add dark mode styles to feature CSS files (battle, pet, character-create)"
```

---

### Task 6: Vue 组件 scoped 暗色模式补全 — 首页和认证组件

**Files:**
- Modify: `src/views/HomeView.vue` (scoped styles)
- Modify: `src/views/LoginView.vue` (scoped styles) — 已有部分，补全缺失
- Modify: `src/views/CharacterSelectView.vue` (scoped styles) — 已有部分，补全缺失
- Modify: `src/views/CharacterCreateView.vue` (scoped styles)
- Modify: `src/App.vue` (scoped styles if any)

**模式：** 在每个组件的 `<style scoped>` 末尾添加 `[data-theme='dark']` 块，覆盖硬编码颜色。

```css
/* 组件内暗色模式示例 */
[data-theme='dark'] .component-class {
  background: rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 1: 逐组件审计并添加暗色样式**

对每个文件：
1. 读取 `<style scoped>` 部分
2. 找出所有硬编码颜色（非 `var(--xxx)` 的颜色值）
3. 在 `</style>` 之前添加 `[data-theme='dark']` 覆盖

- [ ] **Step 2: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 3: 提交**

```bash
git add src/views/HomeView.vue src/views/LoginView.vue src/views/CharacterSelectView.vue src/views/CharacterCreateView.vue src/App.vue
git commit -m "feat: add dark mode to view components (Home, Login, CharacterSelect, CharacterCreate)"
```

---

### Task 7: Vue 组件 scoped 暗色模式补全 — 功能面板组件

**Files:**
- Modify: 所有 `src/components/battle/` 组件的 scoped styles
- Modify: 所有 `src/components/social/` 组件的 scoped styles
- Modify: 所有 `src/components/team/` 组件的 scoped styles
- Modify: 所有 `src/components/map/` 组件的 scoped styles
- Modify: 所有 `src/components/dungeon/` 组件的 scoped styles
- Modify: 所有 `src/components/arena/` 组件的 scoped styles
- Modify: 所有 `src/components/equipment/` 组件的 scoped styles
- Modify: 所有 `src/components/inventory/` 组件的 scoped styles
- Modify: 所有 `src/components/pet/` 组件的 scoped styles
- Modify: 所有 `src/components/character/` 组件的 scoped styles
- Modify: 所有 `src/components/ui/` 组件的 scoped styles

**具体文件列表（通过 `find src/components -name '*.vue'` 获取）：**

对每个 `.vue` 文件：
1. 读取其 `<style scoped>` 部分
2. 查找所有硬编码颜色值
3. 在 `</style>` 之前添加 `[data-theme='dark']` 覆盖

- [ ] **Step 1: 战斗组件暗色模式**（battle/ 目录下所有 .vue 文件）

逐文件审计并添加暗色样式。

- [ ] **Step 2: 社交和组队组件暗色模式**（social/、team/ 目录下所有 .vue 文件）

- [ ] **Step 3: 地图、副本、竞技组件暗色模式**（map/、dungeon/、arena/ 目录下所有 .vue 文件）

- [ ] **Step 4: 装备、背包、战宠、角色、UI 组件暗色模式**（equipment/、inventory/、pet/、character/、ui/ 目录下所有 .vue 文件）

- [ ] **Step 5: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 6: 提交**

```bash
git add src/components/
git commit -m "feat: add dark mode to all feature panel components"
```

---

## Part C: 移动端响应式优化

### Task 8: 新增断点变量 + 全局 CSS 响应式

**Files:**
- Modify: `src/assets/styles/variables.css`
- Modify: `src/assets/styles/common.css`
- Modify: `src/assets/styles/ui.css`
- Modify: `src/assets/styles/home.css`

- [ ] **Step 1: 在 variables.css 中新增断点变量**

在 `variables.css` 的 `:root` 块末尾、关闭 `}` 之前添加：

```css
  /* ── 响应式断点 ── */
  --breakpoint-mobile: 375px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
```

- [ ] **Step 2: 审计并补全 common.css 响应式样式**

读取 `src/assets/styles/common.css`，查找现有的 `@media` 查询。补全缺失的响应式规则。新增三档断点：

```css
@media (max-width: 1024px) {
  /* 平板适配 */
}

@media (max-width: 768px) {
  /* 手机横屏适配 */
}

@media (max-width: 375px) {
  /* 小屏手机适配 */
}
```

- [ ] **Step 3: 审计并补全 ui.css 响应式样式**

同上模式。

- [ ] **Step 4: 审计并补全 home.css 响应式样式**

现有 home.css 已有 720px 和 960px 断点。将其统一为三档体系：
- 1024px 替换 960px
- 768px 替换 720px
- 新增 375px 断点

- [ ] **Step 5: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 6: 提交**

```bash
git add src/assets/styles/variables.css src/assets/styles/common.css src/assets/styles/ui.css src/assets/styles/home.css
git commit -m "feat: add responsive breakpoints and global responsive CSS"
```

---

### Task 9: 视图组件响应式补全

**Files:**
- Modify: `src/views/HomeView.vue` (scoped styles)
- Modify: `src/views/LoginView.vue` (scoped styles)
- Modify: `src/views/CharacterSelectView.vue` (scoped styles)
- Modify: `src/views/CharacterCreateView.vue` (scoped styles)

- [ ] **Step 1: HomeView.vue 响应式**

在 `<style scoped>` 末尾添加/补全三档响应式：

```css
@media (max-width: 1024px) {
  /* 三栏 → 两栏/单栏 */
  .game-body { flex-direction: column; }
  .game-left, .game-right { width: 100%; max-width: none; }
  .game-bottom-nav { /* 紧凑导航 */ }
}

@media (max-width: 768px) {
  /* 单栏布局 */
  .game-header { padding: 8px 12px; }
  .game-bottom-nav { /* 2列导航 */ }
}

@media (max-width: 375px) {
  /* 小屏缩紧 */
  .game-header__title { font-size: var(--font-size-small); }
}
```

具体规则需根据当前 HomeView.vue 的 scoped styles 审计确定。

- [ ] **Step 2: LoginView.vue 响应式补全**

- [ ] **Step 3: CharacterSelectView.vue 响应式补全**

- [ ] **Step 4: CharacterCreateView.vue 响应式补全**

- [ ] **Step 5: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 6: 提交**

```bash
git add src/views/HomeView.vue src/views/LoginView.vue src/views/CharacterSelectView.vue src/views/CharacterCreateView.vue
git commit -m "feat: add responsive styles to view components"
```

---

### Task 10: 功能面板组件响应式补全

**Files:**
- Modify: 所有缺少 `@media` 查询的 `src/components/` 下 .vue 文件

**需要补全的组件（当前无 @media 的主要组件）：**
- `src/components/social/FriendPanel.vue`
- `src/components/social/ChatPanel.vue`
- `src/components/map/WorldMapPanel.vue` — 已有部分，补全
- `src/components/arena/ArenaPanel.vue`
- `src/components/arena/PvpMatchOverlay.vue`
- `src/components/arena/PvpSettlementOverlay.vue`
- `src/components/equipment/EquipmentPanel.vue`
- `src/components/inventory/BackpackGrid.vue`
- `src/components/pet/PetListPanel.vue`
- `src/components/pet/PetDetailPanel.vue`
- `src/components/pet/PetCollectionPanel.vue`
- `src/components/character/CharacterPanel.vue`
- `src/components/character/CharacterStats.vue`
- `src/components/ui/UiPanel.vue`
- `src/components/ui/UiModal.vue`
- `src/components/ui/UiToastHost.vue`
- `src/components/dungeon/DungeonFloorResultOverlay.vue`

- [ ] **Step 1: 社交组件响应式**（FriendPanel.vue、ChatPanel.vue）

为每个组件的 scoped styles 添加响应式规则。

- [ ] **Step 2: 竞技和地图组件响应式**（ArenaPanel.vue、PvpMatchOverlay.vue、PvpSettlementOverlay.vue、WorldMapPanel.vue）

- [ ] **Step 3: 装备、背包、战宠、角色组件响应式**

- [ ] **Step 4: UI 基础组件和副本组件响应式**（UiPanel.vue、UiModal.vue、DungeonFloorResultOverlay.vue）

- [ ] **Step 5: 运行构建验证**

Run: `cd "/Users/hyacinth/Desktop/project sword" && npm run build 2>&1 | tail -5`
Expected: `✓ built in` 出现在输出中

- [ ] **Step 6: 提交**

```bash
git add src/components/
git commit -m "feat: add responsive styles to all feature panel components"
```

---

## Part D: 文档和开发方案更新

### Task 11: 创建后端对接文档并更新开发方案

**Files:**
- Create: `非实时PVP-后端对接文档.md`
- Modify: `开发方案.md` (lines 537-539)

- [ ] **Step 1: 创建后端对接文档**

创建 `非实时PVP-后端对接文档.md`：

```markdown
# 非实时 PVP（挑战好友镜像） - 后端对接文档

## 概述

好友面板新增"挑战"功能，玩家可挑战好友的镜像进行异步 PVP 对战。纯娱乐玩法，不结算积分。

---

## 1. 机制说明

| 项目 | 说明 |
|:---|:---|
| 入口 | 好友面板好友卡片"挑战"按钮 |
| 对手数据 | 基于好友 profession + level 前端 Mock 生成镜像属性 |
| 积分结算 | 无（纯娱乐） |
| 战斗模式 | 复用现有战斗引擎，AI 控制对手行动 |

---

## 2. 前端实现

- 镜像属性通过 `generateFriendMirrorCombatant(friend)` 生成
- 复用 `generateOpponentStats` 和 `getOpponentSkills` 函数
- 战斗使用 `battleStore.startWildBattle()` 发起

---

## 3. 后端对接

**无需后端新增 API**。当前实现使用前端 Mock 数据生成好友镜像属性。

**后续可扩展（建议后端提供）：**

| 接口 | 说明 |
|:---|:---|
| `GET /friend/{characterId}/mirror` | 获取好友真实属性快照（替代前端 Mock） |
| `POST /pvp/async-challenge` | 记录异步挑战记录 |

---

## 4. 前端文件清单

| 文件 | 职责 |
|:---|:---|
| `src/config/pvp_config.ts` | generateFriendMirrorCombatant |
| `src/stores/social.ts` | startAsyncPvpBattle |
| `src/components/social/FriendPanel.vue` | 挑战按钮 + 确认弹窗 |
| `src/views/HomeView.vue` | 连接战斗视图 |
```

- [ ] **Step 2: 更新开发方案.md 第 537-539 行**

将：
```
| 非实时 PVP（挑战离线玩家镜像） | P1 | 异步竞技 |
| 暗色模式完整适配 | P1 | 全组件暗色主题 |
| 移动端响应式优化 | P1 | 移动端体验 |
```

替换为：
```
| 非实时 PVP（挑战离线玩家镜像） | P1 | ✅ 已完成 | FriendPanel挑战按钮、好友镜像Combatant生成、纯娱乐无积分、后端对接文档 |
| 暗色模式完整适配 | P1 | ✅ 已完成 | 全组件[data-theme='dark']覆盖、硬编码颜色审计替换、后端对接文档 |
| 移动端响应式优化 | P1 | ✅ 已完成 | 375/768/1024三档断点、全局+组件响应式补全、后端对接文档 |
```

- [ ] **Step 3: 提交**

```bash
git add 非实时PVP-后端对接文档.md 开发方案.md
git commit -m "docs: add async PVP backend doc and update development plan for P1 features"
```
