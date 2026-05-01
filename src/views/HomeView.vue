<!-- 游戏主页 - 三栏布局 -->
<template>
  <div class="game-home">
    <!-- 顶部通栏 -->
    <header class="game-header">
      <div class="game-header__left">
        <Swords :size="20" :stroke-width="1.5" class="game-header__logo" />
        <span class="game-header__title">剑之传说</span>
      </div>
      <div class="game-header__center" @mouseenter="pauseAnnouncement" @mouseleave="resumeAnnouncement">
        <Transition name="announce" mode="out-in">
          <div class="announcement" :key="currentAnnouncement.id">
            <component :is="currentAnnouncement.icon" :size="14" class="announcement__icon" :style="{ color: currentAnnouncement.color }" />
            <span class="announcement__text">{{ currentAnnouncement.text }}</span>
          </div>
        </Transition>
      </div>
      <div class="game-header__right">
        <button class="game-header__btn game-header__btn--round" title="退出登录" @click="handleLogout">
          <LogOut :size="16" :stroke-width="1.8" />
        </button>
        <ThemeToggle />
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="game-loading game-panel">
      <Loader2 :size="28" class="game-loading__spinner" />
      <span>正在加载角色数据...</span>
    </div>

    <div v-else class="game-body">
      <!-- ═══ 左侧面板 ═══ -->
      <div class="game-left">
        <!-- 角色详情面板 -->
        <div class="game-panel">
          <CharacterPanel
            v-if="charDetail"
            :character="charDetail"
            @refresh="refreshCharacter"
          />
          <div v-else class="char-info__empty">
            <span style="color: var(--text-muted)">未选择角色</span>
          </div>
        </div>
      </div>

      <!-- ═══ 中间面板 ═══ -->
      <div class="game-center">
        <div class="game-panel game-main">
          <div class="game-main__welcome">
            欢迎，{{ auth.user?.username }}
          </div>
          <p class="game-main__desc">
            这里是您的冒险起点。选择角色后，您可以探索世界、挑战副本、与其他玩家对战。
          </p>
          <div class="game-main__actions">
            <button class="game-main__btn game-main__btn--primary">
              <Map :size="16" />
              开始探索
            </button>
            <button class="game-main__btn game-main__btn--secondary">
              <Swords :size="16" />
              进入副本
            </button>
          </div>
        </div>

        <!-- 底部快捷导航 -->
        <div class="game-bottom-nav">
          <div class="game-panel">
            <Map :size="16" />
            <span>地图</span>
          </div>
          <div class="game-panel">
            <Swords :size="16" />
            <span>战斗</span>
          </div>
          <div class="game-panel">
            <Users :size="16" />
            <span>组队</span>
          </div>
          <div class="game-panel">
            <Store :size="16" />
            <span>商店</span>
          </div>
        </div>
      </div>

      <!-- ═══ 右侧面板 ═══ -->
      <div class="game-right">
        <div class="game-panel" style="display: flex; flex-direction: column">
          <div class="game-panel__title">背包</div>
          <!-- 标签切换 -->
          <div class="backpack-tabs">
            <button
              v-for="tab in BACKPACK_TABS"
              :key="tab.key"
              class="backpack-tab"
              :class="{ 'backpack-tab--active': inventory.activeTab === tab.key }"
              @click="inventory.setActiveTab(tab.key)"
            >
              <component v-if="tab.icon" :is="tab.icon" :size="12" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
          <!-- 搜索 + 排序工具栏 -->
          <div class="backpack-toolbar">
            <div class="backpack-search">
              <Search :size="13" class="backpack-search__icon" />
              <input
                class="backpack-search__input"
                type="text"
                placeholder="搜索物品"
                :value="inventory.searchQuery"
                @input="inventory.setSearchQuery(($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="backpack-filters">
              <select
                class="backpack-filter-select"
                :value="inventory.rarityFilter"
                @change="inventory.setRarityFilter(($event.target as HTMLSelectElement).value as any)"
              >
                <option value="all">全部品质</option>
                <option v-for="r in RARITIES" :key="r" :value="r">{{ RARITY_LABELS[r] }}</option>
              </select>
              <button
                class="backpack-sort-btn"
                @click="inventory.setSortField(sortOptions[currentSortIndex].field)"
                :title="sortLabel"
              >
                <component :is="sortOptions[currentSortIndex].icon" :size="12" />
                {{ sortLabel }}
                <ArrowUpDown v-if="inventory.sortOrder === 'asc'" :size="10" />
                <ArrowDownUp v-else :size="10" />
              </button>
            </div>
          </div>
          <!-- 加载状态 -->
          <div v-if="inventory.loading" class="backpack-loading">
            <Loader2 :size="20" class="backpack-loading__spinner" />
          </div>
          <!-- 背包网格 -->
          <BackpackGrid
            v-else-if="inventory.filteredItems.length > 0"
            :items="inventory.filteredItems"
            @click-item="showItemDetail"
          />
          <!-- 空背包提示 -->
          <div v-else class="backpack-empty">
            <Package :size="28" class="backpack-empty__icon" />
            <span>{{ inventory.searchQuery || inventory.rarityFilter !== 'all' ? '无匹配物品' : '暂无物品' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 物品详情弹窗 -->
    <ItemDetailModal
      :item="selectedItem"
      :action-loading="inventory.actionLoading"
      @close="selectedItem = null"
      @use="handleUseItem"
      @discard="handleDiscardItem"
    />

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toastMessage" class="game-toast">{{ toastMessage }}</div>
    </Transition>

    <!-- UID 显示 - 屏幕左下角 -->
    <div v-if="auth.user?.id" class="game-uid">
      UID：{{ auth.user.id.slice(0, 8) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCharacterStore } from '../stores/character'
import { useInventoryStore } from '../stores/inventory'
import ThemeToggle from '../components/ThemeToggle.vue'
import CharacterPanel from '../components/character/CharacterPanel.vue'
import BackpackGrid from '../components/inventory/BackpackGrid.vue'
import ItemDetailModal from '../components/inventory/ItemDetailModal.vue'
import { BACKPACK_TABS, RARITY_LABELS } from '../config/item_config'
import type { InventoryItem, ItemRarity, SortField } from '../types/item'
import {
  Map, Swords, Users, Store, Package,
  LogOut, Loader2, Sparkles,
  Bell, Lightbulb, Trophy, Wrench,
  Search, ArrowUpDown, ArrowDownUp,
  SortAsc, Hash, Clock, Coins
} from 'lucide-vue-next'

const RARITIES: ItemRarity[] = ['Normal', 'Rare', 'Epic', 'Legendary']

/** 排序选项配置 */
const sortOptions: { field: SortField; label: string; icon: Component }[] = [
  { field: 'obtainedAt', label: '获取时间', icon: markRaw(Clock) },
  { field: 'name', label: '名称', icon: markRaw(SortAsc) },
  { field: 'rarity', label: '稀有度', icon: markRaw(Hash) },
  { field: 'quantity', label: '数量', icon: markRaw(Hash) },
  { field: 'sellPrice', label: '售价', icon: markRaw(Coins) }
]

/** 当前排序选项索引（根据 store.sortField 计算） */
const currentSortIndex = computed(() =>
  sortOptions.findIndex(opt => opt.field === inventory.sortField)
)

/** 排序按钮标签 */
const sortLabel = computed(() =>
  sortOptions[currentSortIndex.value]?.label || '排序'
)

const router = useRouter()
const auth = useAuthStore()
const charStore = useCharacterStore()
const inventory = useInventoryStore()

const loading = ref(false)

/** 当前选中的物品（弹窗用） */
const selectedItem = ref<InventoryItem | null>(null)

/** Toast 提示消息 */
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

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

/**
 * 显示物品详情弹窗
 */
function showItemDetail(item: InventoryItem) {
  selectedItem.value = item
}

/**
 * 使用消耗品
 */
async function handleUseItem(inventoryId: string, quantity: number) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await inventory.useItem(characterId, inventoryId, quantity)
  if (result) {
    showToast(result.message)
    selectedItem.value = null
  } else if (inventory.actionErrorMsg) {
    showToast(inventory.actionErrorMsg)
  }
}

/**
 * 丢弃物品
 */
async function handleDiscardItem(inventoryId: string, quantity: number) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const success = await inventory.discardItem(characterId, inventoryId, quantity)
  if (success) {
    showToast('丢弃成功')
    selectedItem.value = null
  } else if (inventory.actionErrorMsg) {
    showToast(inventory.actionErrorMsg)
  }
}

/* ── 公告轮播 ── */
interface Announcement {
  id: number
  text: string
  icon: Component
  color: string
}

const announcements: Announcement[] = [
  { id: 1, text: '服务器将于 5 月 2 日 02:00-06:00 进行维护，请提前下线', icon: markRaw(Wrench), color: 'var(--accent-gold)' },
  { id: 2, text: '五一限时活动「勇者试炼」已开启，通关副本可获传说装备', icon: markRaw(Trophy), color: 'var(--accent-red)' },
  { id: 3, text: '当前在线冒险者：1,284 人', icon: markRaw(Users), color: 'var(--accent-green)' },
  { id: 4, text: '欢迎来到剑之传说！选择角色即可开始你的冒险之旅', icon: markRaw(Sparkles), color: 'var(--accent-blue)' },
  { id: 5, text: '小贴士：闪避率影响被攻击时的回避概率，敏捷属性可提升闪避', icon: markRaw(Lightbulb), color: 'var(--accent-gold)' },
  { id: 6, text: '公告：新赛季排位赛将于 5 月 5 日开放，敬请期待', icon: markRaw(Bell), color: 'var(--accent-blue)' },
]

const currentIndex = ref(0)
let announceTimer: ReturnType<typeof setInterval> | null = null

/**
 * 当前显示的公告
 */
const currentAnnouncement = computed(() => announcements[currentIndex.value])

/**
 * 切换到下一条公告
 */
function nextAnnouncement() {
  currentIndex.value = (currentIndex.value + 1) % announcements.length
}

/**
 * 鼠标悬停时暂停轮播
 */
function pauseAnnouncement() {
  if (announceTimer) {
    clearInterval(announceTimer)
    announceTimer = null
  }
}

/**
 * 鼠标离开时恢复轮播
 */
function resumeAnnouncement() {
  startAnnouncementTimer()
}

/**
 * 启动公告轮播定时器
 */
function startAnnouncementTimer() {
  if (announceTimer) clearInterval(announceTimer)
  announceTimer = setInterval(nextAnnouncement, 4000)
}

/**
 * 获取角色详情数据
 */
const charDetail = computed(() => charStore.characterDetail)

/**
 * 退出登录
 */
function handleLogout() {
  charStore.clear()
  inventory.clear()
  router.push({ name: 'characters' })
}

/**
 * 加载角色详情（初次进入或切换角色）
 */
async function loadCharacterDetail() {
  const characterId = charStore.selectedCharacterId
  if (!characterId) {
    router.push({ name: 'characters' })
    return
  }
  loading.value = true
  await charStore.fetchCharacterDetail(characterId)
  await inventory.fetchInventory(characterId)
  loading.value = false
}

/**
 * 刷新角色数据（加点后，不重新加载背包）
 */
async function refreshCharacter() {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return
  await charStore.fetchCharacterDetail(characterId)
}

onMounted(() => {
  loadCharacterDetail()
  startAnnouncementTimer()
})

onUnmounted(() => {
  if (announceTimer) clearInterval(announceTimer)
})
</script>

<style scoped>
/* HomeView 特定样式 */
.char-info__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

/* 背包加载状态 */
.backpack-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
}

.backpack-loading__spinner {
  animation: spin 1s linear infinite;
  color: var(--text-muted);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

<style>
/* 在 header 中覆盖 ThemeToggle 的 fixed 定位和尺寸 */
.game-header__right .theme-toggle {
  position: static;
}

.game-header__right .theme-toggle__btn {
  width: 36px;
  height: 36px;
  border-radius: 980px;
}

.game-header__right .theme-toggle__btn:hover {
  transform: scale(1.08) rotate(15deg);
}
</style>