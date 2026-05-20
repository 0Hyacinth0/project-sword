# UI First Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the UI-first remediation baseline: build passes, core feedback uses the design system, visible social/team/test flows stop feeling half-finished, and the project is ready for broader visual polish.

**Architecture:** Keep the existing Vue 3 + Pinia structure. Add one small toast composable, finish the current test-page work without reverting user edits, then replace browser `alert(...)` usage in social/team flows with `UiToastHost` feedback and make `HomeView` feedback semantic.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite, existing `src/components/ui` primitives, existing CSS variables from `DESIGN.md`.

---

## Current Worktree Notes

The worktree already contains uncommitted edits in:

- `src/components/test/TestSidebar.vue`
- `src/testing/core/TestRunner.ts`
- `src/testing/suites/authTests.ts`
- `src/testing/utils/testHelper.ts`

Treat these as user-owned in-progress edits. Continue from them; do not revert them. The known build blocker is that `authTests.ts` calls `clearAuthState()` without importing it.

## File Structure

- Modify: `src/testing/suites/authTests.ts`  
  Restore the missing `clearAuthState` import so TypeScript builds.

- Modify: `src/testing/registry.ts`  
  Guard `registerAllSuites()` against duplicate registration when `/test` is revisited.

- Modify: `src/views/TestView.vue`  
  Keep the current log interceptor work, add cleanup on module runs and component unmount, and prevent stale interceptors from surviving failed runs.

- Create: `src/composables/useUiToasts.ts`  
  Shared front-end toast state helper for panels that need local feedback.

- Modify: `src/views/HomeView.vue`  
  Replace the single-message toast state with the shared helper and classify success/error/info feedback.

- Modify: `src/components/social/FriendPanel.vue`  
  Replace `alert(...)` with `UiToastHost` and show feedback for friend actions.

- Modify: `src/components/team/TeamPanel.vue`  
  Replace `alert(...)` with `UiToastHost` and show feedback for team actions.

- Modify: `src/components/team/DungeonRoomPanel.vue`  
  Replace `alert(...)` with `UiToastHost` and show feedback for room/dungeon actions.

- Verify only: `src/components/test/TestSidebar.vue`, `src/testing/core/TestRunner.ts`, `src/testing/utils/testHelper.ts`  
  Preserve existing changes unless build or runtime verification exposes a specific defect.

---

### Task 1: Restore Build Baseline For Test Suite Imports

**Files:**
- Modify: `src/testing/suites/authTests.ts`
- Verify: `src/testing/utils/testHelper.ts`

- [ ] **Step 1: Update the `testHelper` import in auth tests**

In `src/testing/suites/authTests.ts`, replace the import block from `../utils/testHelper` with:

```ts
import {
  testContext,
  resetTestContext,
  clearAuthState,
  setAuthState,
  disableMock,
  generateTestUsername,
  safeCall,
  TEST_PASSWORD,
} from '../utils/testHelper'
```

- [ ] **Step 2: Run build to confirm the previous error is gone**

Run:

```bash
npm run build
```

Expected: the previous `TS2304: Cannot find name 'clearAuthState'` error is gone. If another TypeScript error appears, record the exact file and line before editing anything else.

- [ ] **Step 3: Commit this narrow build fix if build passes or moves to a different error**

Run:

```bash
git add src/testing/suites/authTests.ts
git commit -m "fix(testing): restore auth cleanup import"
```

Expected: one commit that touches only `src/testing/suites/authTests.ts`.

---

### Task 2: Finish Test Runner Registration And Cleanup

**Files:**
- Modify: `src/testing/registry.ts`
- Modify: `src/views/TestView.vue`

- [ ] **Step 1: Guard test suite registration**

In `src/testing/registry.ts`, add this module-level flag above `registerAllSuites()`:

```ts
/** 是否已经注册过全部测试套件，避免重复进入 /test 时重复追加。 */
let registered = false
```

Then replace the first line of `registerAllSuites()` with:

```ts
export function registerAllSuites(): void {
  if (registered) return
  registered = true
```

The rest of the existing `testRunner.register(...)` calls stay in the same order.

- [ ] **Step 2: Add a run cleanup helper in TestView**

In `src/views/TestView.vue`, add this state near `isRunning`:

```ts
/** 当前测试运行结束后是否需要清理认证状态。 */
const clearAuthAfterRun = ref(false)
```

Then add this function after `clearLogs()`:

```ts
/**
 * 结束测试运行并清理请求日志拦截器。
 * @param clearAuth - 是否清理认证状态
 * @returns 无返回值
 */
function finishRun(clearAuth: boolean): void {
  isRunning.value = false
  removeLogInterceptor()
  if (clearAuth) clearAuthState()
}
```

- [ ] **Step 3: Use `try/finally` for full test runs**

Replace the end of `runAll()` with:

```ts
  clearAuthAfterRun.value = true
  isRunning.value = true
  testRunner.reset()
  try {
    await testRunner.run()
  } finally {
    if (isRunning.value) finishRun(true)
  }
```

- [ ] **Step 4: Use `try/finally` for module runs**

Replace the end of `runModule()` with:

```ts
  clearAuthAfterRun.value = false
  isRunning.value = true
  try {
    await testRunner.run(activeModule.value)
  } finally {
    if (isRunning.value) finishRun(false)
  }
```

- [ ] **Step 5: Route existing stop/all-done/unmount cleanup through `finishRun`**

Replace `stop()` with:

```ts
/**
 * 停止当前正在执行的测试。
 * @returns 无返回值
 */
function stop(): void {
  testRunner.abort()
  finishRun(false)
}
```

In the `all-done` event branch, replace the current cleanup block with:

```ts
      summary.value = event.summary
      finishRun(clearAuthAfterRun.value)
```

In `onUnmounted()`, append this cleanup after the listener cleanup:

```ts
  removeLogInterceptor()
```

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 7: Commit test runner cleanup**

Run:

```bash
git add src/testing/registry.ts src/views/TestView.vue
git commit -m "fix(testing): stabilize test page lifecycle"
```

Expected: one commit containing only the registration guard and TestView cleanup.

---

### Task 3: Add Shared UI Toast Composable

**Files:**
- Create: `src/composables/useUiToasts.ts`

- [ ] **Step 1: Create the composables directory if needed**

Run:

```bash
mkdir -p src/composables
```

- [ ] **Step 2: Add `useUiToasts`**

Create `src/composables/useUiToasts.ts` with:

```ts
import { computed, ref } from 'vue'
import type { UiToastItem, UiToastType } from '../components/ui'

/** 默认 Toast 展示时长（毫秒）。 */
const DEFAULT_TOAST_DURATION = 3000

interface InternalToast extends UiToastItem {
  id: string
  type: UiToastType
}

/**
 * 提供局部 Toast 列表和展示/隐藏方法。
 * @returns Toast 列表、展示方法和隐藏方法
 */
export function useUiToasts() {
  const queue = ref<InternalToast[]>([])

  /**
   * 展示一条 Toast。
   * @param message - 提示文案
   * @param type - 提示类型
   * @param duration - 自动隐藏时长，传 0 表示不自动隐藏
   * @returns 新 Toast 的 ID
   */
  function showToast(
    message: string,
    type: UiToastType = 'info',
    duration: number = DEFAULT_TOAST_DURATION
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    queue.value = [...queue.value, { id, message, type }]

    if (duration > 0) {
      window.setTimeout(() => hideToast(id), duration)
    }

    return id
  }

  /**
   * 隐藏指定 Toast；不传参数时清空全部 Toast。
   * @param target - Toast ID 或 Toast 对象
   * @returns 无返回值
   */
  function hideToast(target?: string | number | UiToastItem): void {
    if (target === undefined) {
      queue.value = []
      return
    }

    const id = typeof target === 'object' ? target.id : target
    queue.value = queue.value.filter(toast => toast.id !== String(id))
  }

  const toasts = computed<UiToastItem[]>(() => queue.value)

  return {
    toasts,
    showToast,
    hideToast
  }
}
```

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: build passes with the new composable unused.

- [ ] **Step 4: Commit the composable**

Run:

```bash
git add src/composables/useUiToasts.ts
git commit -m "feat(ui): add reusable toast composable"
```

Expected: one commit containing only `useUiToasts.ts`.

---

### Task 4: Make HomeView Toast Feedback Semantic

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: Import the shared toast composable**

In `src/views/HomeView.vue`, add this import near the other local imports:

```ts
import { useUiToasts } from '../composables/useUiToasts'
```

- [ ] **Step 2: Replace single-message toast state**

Remove this existing block:

```ts
/** Toast 提示消息 */
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

/** 当前主页 Toast 列表，供通用 Toast 容器渲染。 */
const homeToasts = computed<UiToastItem[]>(() =>
  toastMessage.value
    ? [{ id: 'home-toast', message: toastMessage.value, type: 'info' }]
    : []
)

/**
 * 显示 Toast 提示
 */
function showToast(message: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = message
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}
```

Replace it with:

```ts
/** 主页级 Toast 反馈，覆盖背包、装备、战宠、战斗入口等操作。 */
const { toasts: homeToasts, showToast, hideToast } = useUiToasts()
```

- [ ] **Step 3: Update the Toast host dismiss handler**

In the template, replace:

```vue
<UiToastHost :toasts="homeToasts" @dismiss="toastMessage = ''" />
```

with:

```vue
<UiToastHost :toasts="homeToasts" @dismiss="hideToast" />
```

- [ ] **Step 4: Remove the unused `UiToastItem` type import**

In the UI import from `../components/ui`, remove `type UiToastItem`. The import should remain:

```ts
import { UiButton, UiIconButton, UiPanel, UiTabs, UiToastHost, type UiTabItem } from '../components/ui'
```

- [ ] **Step 5: Classify existing feedback calls**

In `src/views/HomeView.vue`, update these calls:

```ts
showToast('商店功能即将开放', 'info')
showToast(result.message, 'success')
showToast(inventory.actionErrorMsg, 'error')
showToast('丢弃成功', 'success')
showToast('装备成功', 'success')
showToast('卸下成功', 'success')
showToast(result.message, result.success ? 'success' : 'error')
```

Apply the same rule to all `showToast(...)` calls in `HomeView.vue`: success paths use `'success'`, failure paths use `'error'`, neutral unavailable features use `'info'`.

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: build passes and `HomeView.vue` no longer references `toastMessage`, `toastTimer`, or `UiToastItem`.

- [ ] **Step 7: Commit HomeView feedback cleanup**

Run:

```bash
git add src/views/HomeView.vue
git commit -m "feat(home): use semantic toast feedback"
```

Expected: one commit containing only `HomeView.vue`.

---

### Task 5: Replace FriendPanel Alert Feedback

**Files:**
- Modify: `src/components/social/FriendPanel.vue`

- [ ] **Step 1: Add Toast host to the template**

Before the root `</div>` in `FriendPanel.vue`, after the challenge confirmation Teleport, add:

```vue
    <UiToastHost :toasts="toasts" @dismiss="hideToast" />
```

- [ ] **Step 2: Add imports**

Replace the script imports with these additions:

```ts
import { UiToastHost } from '../ui'
import { useUiToasts } from '../../composables/useUiToasts'
```

Keep the existing `ref`, `onMounted`, store, config, and type imports.

- [ ] **Step 3: Create the local toast controller**

After `const socialStore = useSocialStore()`, add:

```ts
/** 好友面板局部 Toast 反馈。 */
const { toasts, showToast, hideToast } = useUiToasts()
```

- [ ] **Step 4: Replace `handleSendRequest`**

Replace the function with:

```ts
/**
 * 发送好友请求。
 * @param toCharacterId - 目标角色 ID
 * @returns Promise，无业务返回值
 */
async function handleSendRequest(toCharacterId: string): Promise<void> {
  const result = await socialStore.sendRequest(toCharacterId)
  showToast(result.message, result.success ? 'success' : 'error')
}
```

- [ ] **Step 5: Make request/delete handlers show store results**

Replace these functions:

```ts
async function handleAccept(requestId: string): Promise<void> {
  const result = await socialStore.acceptRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleReject(requestId: string): Promise<void> {
  const result = await socialStore.rejectRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return
  const result = await socialStore.removeFriend(deleteTarget.value.characterId)
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) deleteTarget.value = null
}

async function handleCancel(requestId: string): Promise<void> {
  const result = await socialStore.cancelSentRequest(requestId)
  showToast(result.message, result.success ? 'success' : 'error')
}
```

If `handleCancel` already exists later in the file, replace that existing function instead of adding a duplicate.

- [ ] **Step 6: Build and search for remaining FriendPanel alerts**

Run:

```bash
rg -n "alert\\(" src/components/social/FriendPanel.vue
npm run build
```

Expected: `rg` returns no lines for `FriendPanel.vue`, and build passes.

- [ ] **Step 7: Commit FriendPanel feedback cleanup**

Run:

```bash
git add src/components/social/FriendPanel.vue
git commit -m "feat(social): replace friend alerts with toasts"
```

Expected: one commit containing only `FriendPanel.vue`.

---

### Task 6: Replace TeamPanel Alert Feedback

**Files:**
- Modify: `src/components/team/TeamPanel.vue`

- [ ] **Step 1: Add Toast host to the template**

Before the root `</div>` in `TeamPanel.vue`, after the kick confirmation Teleport, add:

```vue
    <UiToastHost :toasts="toasts" @dismiss="hideToast" />
```

- [ ] **Step 2: Add imports**

Add:

```ts
import { UiToastHost } from '../ui'
import { useUiToasts } from '../../composables/useUiToasts'
```

- [ ] **Step 3: Create the local toast controller**

After `const socialStore = useSocialStore()`, add:

```ts
/** 组队面板局部 Toast 反馈。 */
const { toasts, showToast, hideToast } = useUiToasts()
```

- [ ] **Step 4: Replace team action functions with result feedback**

Replace the functions listed below with this exact behavior:

```ts
async function handleCreateTeam(): Promise<void> {
  const result = await teamStore.createTeam()
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) await teamStore.fetchTeamList()
}

async function handleApply(teamId: string): Promise<void> {
  const result = await teamStore.applyToTeam(teamId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleInvite(characterId: string): Promise<void> {
  const result = await teamStore.inviteFriend(characterId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleAcceptApp(applicationId: string): Promise<void> {
  const result = await teamStore.acceptApp(applicationId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleRejectApp(applicationId: string): Promise<void> {
  const result = await teamStore.rejectApp(applicationId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleKick(): Promise<void> {
  if (!kickTarget.value) return
  const result = await teamStore.kickMember(kickTarget.value.characterId)
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) kickTarget.value = null
}

async function handleChangeLeader(characterId: string): Promise<void> {
  const result = await teamStore.changeLeader(characterId)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleToggleStatus(status: 'open' | 'closed'): Promise<void> {
  const result = await teamStore.toggleStatus(status)
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleLeave(): Promise<void> {
  const result = await teamStore.leaveTeam()
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    showLeaveConfirm.value = false
    await teamStore.fetchTeamList()
  }
}

async function handleDisband(): Promise<void> {
  const result = await teamStore.disbandTeam()
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    showDisbandConfirm.value = false
    await teamStore.fetchTeamList()
  }
}
```

- [ ] **Step 5: Build and search for remaining TeamPanel alerts**

Run:

```bash
rg -n "alert\\(" src/components/team/TeamPanel.vue
npm run build
```

Expected: `rg` returns no lines for `TeamPanel.vue`, and build passes.

- [ ] **Step 6: Commit TeamPanel feedback cleanup**

Run:

```bash
git add src/components/team/TeamPanel.vue
git commit -m "feat(team): replace team alerts with toasts"
```

Expected: one commit containing only `TeamPanel.vue`.

---

### Task 7: Replace DungeonRoomPanel Alert Feedback

**Files:**
- Modify: `src/components/team/DungeonRoomPanel.vue`

- [ ] **Step 1: Add Toast host to the template**

Before the root `</div>` in `DungeonRoomPanel.vue`, after the room content templates, add:

```vue
    <UiToastHost :toasts="toasts" @dismiss="hideToast" />
```

- [ ] **Step 2: Add imports**

Add:

```ts
import { UiToastHost } from '../ui'
import { useUiToasts } from '../../composables/useUiToasts'
```

- [ ] **Step 3: Create the local toast controller**

After `const characterStore = useCharacterStore()`, add:

```ts
/** 副本房间局部 Toast 反馈。 */
const { toasts, showToast, hideToast } = useUiToasts()
```

- [ ] **Step 4: Replace `handleSelectDungeon`**

Replace the function with:

```ts
async function handleSelectDungeon(dungeonId: string): Promise<void> {
  if (!teamStore.myTeam) return
  const result = await roomStore.createRoom(
    teamStore.myTeam.id,
    dungeonId,
    teamStore.myTeam.members,
    teamStore.myTeam.leaderId
  )
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    teamStore.setDungeonRoom(roomStore.currentRoom!.roomId)
  }
}
```

- [ ] **Step 5: Replace `handleStartChallenge` alert paths**

Replace the function with:

```ts
async function handleStartChallenge(): Promise<void> {
  const room = roomStore.currentRoom
  if (!room) return

  const result = await roomStore.startChallenge()
  if (!result.success) {
    showToast(result.message, 'error')
    return
  }

  const enterResult = dungeonStore.enterDungeon(room.dungeonId)
  if (!enterResult.success) {
    showToast(enterResult.message, 'error')
    return
  }

  const battleResult = await dungeonStore.startMultiPlayerFloorBattle(room.members)
  if (battleResult.success) {
    showToast('多人副本战斗开始', 'success')
    emit('battle-started')
  } else {
    showToast(battleResult.message, 'error')
  }
}
```

- [ ] **Step 6: Show feedback for room lifecycle actions**

Replace these functions:

```ts
async function handleToggleReady(): Promise<void> {
  const result = await roomStore.toggleReady()
  showToast(result.message, result.success ? 'success' : 'error')
}

async function handleCancelRoom(): Promise<void> {
  const result = await roomStore.cancelRoom()
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) teamStore.setDungeonRoom(null)
}

async function handleLeaveRoom(): Promise<void> {
  const result = await roomStore.leaveRoom()
  showToast(result.message, result.success ? 'success' : 'error')
  if (result.success) teamStore.setDungeonRoom(null)
}
```

- [ ] **Step 7: Build and search for remaining DungeonRoomPanel alerts**

Run:

```bash
rg -n "alert\\(" src/components/team/DungeonRoomPanel.vue
npm run build
```

Expected: `rg` returns no lines for `DungeonRoomPanel.vue`, and build passes.

- [ ] **Step 8: Commit DungeonRoomPanel feedback cleanup**

Run:

```bash
git add src/components/team/DungeonRoomPanel.vue
git commit -m "feat(team): replace dungeon room alerts with toasts"
```

Expected: one commit containing only `DungeonRoomPanel.vue`.

---

### Task 8: Final UI Baseline Verification

**Files:**
- Verify: `src/views/HomeView.vue`
- Verify: `src/components/social/FriendPanel.vue`
- Verify: `src/components/team/TeamPanel.vue`
- Verify: `src/components/team/DungeonRoomPanel.vue`
- Verify: `src/views/TestView.vue`
- Verify: `src/assets/styles/test.css`

- [ ] **Step 1: Verify no browser alert remains in user-facing panels**

Run:

```bash
rg -n "alert\\(" src/components src/views
```

Expected: no lines in `FriendPanel.vue`, `TeamPanel.vue`, or `DungeonRoomPanel.vue`. If other files appear, list them in the final implementation notes and do not expand this milestone unless they block the core demo.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: `vue-tsc -b` and `vite build` both succeed.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Browser-check core UI routes**

Open the Vite URL and verify:

```text
/login              登录/注册表单可见，加载和错误反馈不遮挡按钮
/characters         角色槽位可见，删除确认仍使用设计系统弹窗
/characters/create  职业切换、雷达图、名称输入、开始冒险按钮可见
/                    主页三栏可见，背包/装备/战宠反馈使用 Toast
/test                测试页三栏可见，运行按钮禁用态正确，日志面板可显示请求/响应
```

From `/`, click the bottom navigation and verify these center panels render without blank main content or native alert popups:

```text
地图       WorldMapPanel shows areas and locked/unlocked state
聊天       ChatPanel shows world/private chat empty or message state
好友       FriendPanel shows tabs, search, empty/request state, and Toast feedback
组队       TeamPanel shows create/list/team state and Toast feedback
排行       LeaderboardPanel shows loading or leaderboard data state
竞技       ArenaPanel shows loading, player data, or empty state
副本       Open from map; DungeonPanel shows dungeon entry state
战斗       Start from map/dungeon/arena; BattleConsole shows active or empty battle state
```

Expected: no obvious overlap, blank main panel, stuck loading state, text overflow in compact controls, or native alert in the checked flows.

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C` in the dev-server terminal.

- [ ] **Step 6: Commit verification-only cleanup if any file was changed**

If no files changed during verification, do not create a commit. If a small verification fix was needed in the scoped UI baseline files, commit only this known file set:

```bash
git add src/views/HomeView.vue src/components/social/FriendPanel.vue src/components/team/TeamPanel.vue src/components/team/DungeonRoomPanel.vue src/views/TestView.vue src/assets/styles/test.css
git commit -m "fix(ui): complete remediation baseline verification"
```

Expected: final `git status --short` contains only unrelated user-owned changes or is clean.
