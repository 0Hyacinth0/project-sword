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
        <UiIconButton label="退出登录" variant="ghost" @click="handleLogout">
          <LogOut :size="16" :stroke-width="1.8" />
        </UiIconButton>
        <ThemeToggle />
      </div>
    </header>

    <!-- 加载状态 -->
    <UiPanel v-if="loading" class="game-loading">
      <Loader2 :size="28" class="game-loading__spinner" />
      <span>正在加载角色数据...</span>
    </UiPanel>

    <div v-else class="game-body" :class="{ 'game-body--center-view': centerView !== 'home' }">
      <!-- ═══ 左侧面板 ═══ -->
      <div class="game-left">
        <!-- 角色详情面板 -->
        <UiPanel stretch>
          <CharacterPanel
            v-if="charDetail"
            :character="charDetail"
            :set-bonuses="activeSetBonuses"
            :skins="shop.ownedSkins"
            :pet-list="petList"
            :pet-capacity="petCapacity"
            :pet-loading="petLoading"
            :exp-items="expItems"
            :equip-items="equipItems"
            :inventory-items="inventory.items"
            @refresh="refreshCharacter"
            @unequip-slot="handleUnequip"
            @enhance-slot="handleEnhance"
            @equip-skin="handleEquipShopSkin"
            @set-active-pet="handleSetActivePet"
            @feed-pet="handleFeedPet"
            @evolve-pet="handleEvolvePet"
            @rename-pet="handleRenamePet"
            @equip-skill="handleEquipSkill"
            @unequip-skill="handleUnequipSkill"
            @equip-item="handleEquipPetItem"
            @unequip-item="handleUnequipPetItem"
          />
          <div v-else class="char-info__empty">
            <span style="color: var(--text-muted)">未选择角色</span>
          </div>
        </UiPanel>
      </div>

      <!-- ═══ 中间面板 ═══ -->
      <div class="game-center">
        <!-- 战斗视图 -->
        <UiPanel v-if="centerView === 'battle'" class="game-main game-main--battle" stretch>
          <BattleConsole @return-view="returnFromBattle" />
        </UiPanel>

        <!-- 地图视图 -->
        <UiPanel v-else-if="centerView === 'map'" class="game-main" stretch>
          <WorldMapPanel
            @back="centerView = 'home'"
            @open-dungeon="handleOpenDungeon"
            @battle-started="enterBattleView('map')"
          />
        </UiPanel>

        <!-- 副本视图 -->
        <UiPanel v-else-if="centerView === 'dungeon' && selectedAreaId" class="game-main" stretch>
          <DungeonPanel
            :area-id="selectedAreaId"
            @back="centerView = 'map'"
            @battle-started="enterBattleView('dungeon')"
          />
        </UiPanel>

        <!-- 好友视图 -->
        <UiPanel v-else-if="centerView === 'friend'" class="game-main" stretch>
          <FriendPanel @battle-started="handleFriendChallenge" />
        </UiPanel>

        <!-- 聊天视图 -->
        <UiPanel v-else-if="centerView === 'chat'" class="game-main" stretch>
          <ChatPanel />
        </UiPanel>

        <!-- 组队视图 -->
        <UiPanel v-else-if="centerView === 'team'" class="game-main" stretch>
          <TeamPanel @battle-started="handleTeamBattleStarted" />
        </UiPanel>

        <!-- 排行榜视图 -->
        <UiPanel v-else-if="centerView === 'leaderboard'" class="game-main" stretch>
          <LeaderboardPanel />
        </UiPanel>

        <!-- 竞技场视图 -->
        <UiPanel v-else-if="centerView === 'arena'" class="game-main" stretch>
          <ArenaPanel @battle-started="enterBattleView('arena')" />
        </UiPanel>

        <!-- 商店视图 -->
        <UiPanel v-else-if="centerView === 'shop'" class="game-main" stretch>
          <ShopPanel
            :character-id="charStore.selectedCharacterId"
            :profession="charDetail?.profession ?? 1"
            :balances="shop.balances"
            :items="shop.items"
            :skins="shop.skins"
            :loading="shop.loading"
            :action-loading="shop.actionLoading"
            @refresh="handleRefreshShop"
            @purchase="handlePurchaseShopItem"
            @redeem-skin="handleRedeemShopSkin"
            @equip-skin="handleEquipShopSkin"
          />
        </UiPanel>

        <!-- 主页欢迎视图 -->
        <UiPanel v-else-if="centerView === 'home'" class="game-main" stretch>
          <div class="game-main__welcome">
            欢迎，{{ auth.user?.username }}
          </div>
          <p class="game-main__desc">
            这里是您的冒险起点。选择角色后，您可以探索世界、挑战副本、与其他玩家对战。
          </p>
          <div class="game-main__actions">
            <UiButton @click="centerView = 'map'">
              <template #icon><Map :size="16" /></template>
              开始探索
            </UiButton>
            <UiButton variant="secondary" @click="centerView = 'map'">
              <template #icon><Swords :size="16" /></template>
              进入副本
            </UiButton>
          </div>
        </UiPanel>

        <!-- 底部快捷导航（始终显示） -->
        <div class="game-bottom-nav">
          <UiButton
            v-for="item in bottomNavItems"
            :key="item.value"
            class="game-bottom-nav__item"
            :class="{ 'game-bottom-nav__item--active': centerView === item.value }"
            @click="centerView = item.value"
          >
            {{ item.label }}
          </UiButton>
        </div>
      </div>

      <!-- ═══ 右侧面板 ═══ -->
      <div class="game-right">
        <UiPanel title="背包" stretch>
          <!-- 标签切换 -->
          <UiTabs
            class="backpack-tabs"
            size="sm"
            :model-value="inventory.activeTab"
            :items="backpackTabItems"
            @update:model-value="handleBackpackTabChange"
          />
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
        </UiPanel>
      </div>
    </div>

    <!-- 物品详情弹窗 -->
    <ItemDetailModal
      :item="selectedItem"
      :action-loading="inventory.actionLoading"
      :current-equipment="currentEquipForSlot"
      @close="selectedItem = null"
      @use="handleUseItem"
      @discard="handleDiscardItem"
      @equip="handleEquipItem"
    />

    <!-- Toast 提示 -->
    <UiToastHost :toasts="homeToasts" @dismiss="hideToast" />

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
import { useShopStore } from '../stores/shop'
import { usePvpStore } from '../stores/pvp'
import { useBattleStore } from '../stores/battle'
import { useSocialStore } from '../stores/social'
import { useUiToasts } from '../composables/useUiToasts'
import { getPetListApi, setActivePetApi, feedPetApi, evolvePetApi, renamePetApi, equipSkillApi, unequipSkillApi, equipPetItemApi, unequipPetItemApi } from '../api/pet'
import ThemeToggle from '../components/ThemeToggle.vue'
import CharacterPanel from '../components/character/CharacterPanel.vue'
import BackpackGrid from '../components/inventory/BackpackGrid.vue'
import WorldMapPanel from '../components/map/WorldMapPanel.vue'
import DungeonPanel from '../components/dungeon/DungeonPanel.vue'
import FriendPanel from '../components/social/FriendPanel.vue'
import ChatPanel from '../components/social/ChatPanel.vue'
import TeamPanel from '../components/team/TeamPanel.vue'
import LeaderboardPanel from '../components/leaderboard/LeaderboardPanel.vue'
import ArenaPanel from '../components/arena/ArenaPanel.vue'
import ShopPanel from '../components/shop/ShopPanel.vue'
import BattleConsole from '../components/battle/BattleConsole.vue'
import ItemDetailModal from '../components/inventory/ItemDetailModal.vue'
import { UiButton, UiIconButton, UiPanel, UiTabs, UiToastHost, type UiTabItem } from '../components/ui'
import { BACKPACK_TABS, RARITY_LABELS } from '../config/item_config'
import { calculateSetBonuses } from '../config/set_config'
import type { BackpackTab, InventoryItem, ItemRarity, SortField } from '../types/item'
import type { EquipmentSlotType } from '../types/equipment'
import type { PetInfo, PetCapacity } from '../types/pet'
import type { CharacterSkin, ShopItem } from '../types/shop'
import {
  Map, Swords, Users, Store, Package, UserPlus, MessageCircle,
  LogOut, Loader2, Sparkles,
  Bell, Lightbulb, Trophy, Wrench,
  Search, ArrowUpDown, ArrowDownUp,
  SortAsc, Hash, Clock, Coins
} from 'lucide-vue-next'

const RARITIES: ItemRarity[] = ['Normal', 'Rare', 'Epic', 'Legendary']

type CenterView = 'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team' | 'leaderboard' | 'arena' | 'shop' | 'battle'
type BattleReturnView = Exclude<CenterView, 'home' | 'shop' | 'battle'>

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
const shop = useShopStore()

const loading = ref(false)

/** 中间面板当前视图 */
const centerView = ref<CenterView>('home')

/** 战斗结束后返回的中栏视图 */
const battleReturnView = ref<BattleReturnView>('map')

/** 底部主导航配置 */
const bottomNavItems: { value: Exclude<CenterView, 'home' | 'dungeon' | 'battle'>; label: string; icon: Component }[] = [
  { value: 'map', label: '地图', icon: markRaw(Map) },
  { value: 'chat', label: '聊天', icon: markRaw(MessageCircle) },
  { value: 'friend', label: '好友', icon: markRaw(UserPlus) },
  { value: 'team', label: '组队', icon: markRaw(Users) },
  { value: 'leaderboard', label: '排行', icon: markRaw(Trophy) },
  { value: 'arena', label: '竞技', icon: markRaw(Swords) },
  { value: 'shop', label: '商店', icon: markRaw(Store) }
]

/** 背包标签配置，适配通用 UiTabs 的 value 字段。 */
const backpackTabItems = computed<UiTabItem[]>(() =>
  BACKPACK_TABS.map(tab => ({
    value: tab.key,
    label: tab.label,
    icon: tab.icon ? markRaw(tab.icon) : null
  }))
)

/** 副本面板选择的区域 ID */
const selectedAreaId = ref<string | null>(null)

/** 当前选中的物品（弹窗用） */
const selectedItem = ref<InventoryItem | null>(null)

/** 战宠列表 */
const petList = ref<PetInfo[]>([])
const petCapacity = ref<PetCapacity>({ max: 3, current: 0 })
const petLoading = ref(false)

/** 经验道具列表（喂食用） */
const expItems = computed(() =>
  inventory.items.filter(i =>
    i.item.category === 'consumable' &&
    i.item.effects?.some(e => e.type === 'add_exp')
  )
)

/** 装备类物品列表（战宠穿脱用） */
const equipItems = computed(() =>
  inventory.items.filter(i => i.item.category === 'equipment')
)

/** 根据选中物品的 slotType 获取当前装备 */
const currentEquipForSlot = computed(() => {
  if (!selectedItem.value || selectedItem.value.item.category !== 'equipment') return null
  const slotType = selectedItem.value.item.slotType
  if (!slotType) return null
  return charDetail.value?.equipment?.[slotType as keyof typeof charDetail.value.equipment] || null
})

/** 主页级 Toast 反馈，覆盖背包、装备、战宠、战斗入口等操作。 */
const { toasts: homeToasts, showToast, hideToast } = useUiToasts()

/**
 * 切换背包分类标签。
 * @param value - 标签值，由 UiTabs 派发
 * @returns 无返回值
 */
function handleBackpackTabChange(value: string | number): void {
  inventory.setActiveTab(value as BackpackTab)
}

/**
 * 进入内嵌战斗视图并记录战斗结束后的返回位置。
 * @param returnView - 战斗结束后需要恢复的中栏视图
 * @returns 无返回值
 */
function enterBattleView(returnView: BattleReturnView): void {
  battleReturnView.value = returnView
  centerView.value = 'battle'
}

/**
 * 处理队伍副本战斗启动。
 * 在主页级 Toast 中提示，避免组队面板卸载导致反馈消失。
 * @returns 无返回值
 */
function handleTeamBattleStarted(): void {
  showToast('多人副本战斗开始', 'success')
  enterBattleView('team')
}

/**
 * 从内嵌战斗视图返回到进入战斗前记录的中栏视图。
 * 如果是从竞技场 PVP 返回，触发积分结算。
 * @returns 无返回值
 */
async function returnFromBattle(): Promise<void> {
  const returnView = battleReturnView.value
  centerView.value = returnView

  if (returnView === 'arena') {
    const battleStore = useBattleStore()
    const pvpStore = usePvpStore()
    if (pvpStore.matchState === 'in_battle' && battleStore.battleOutcome) {
      const won = battleStore.battleOutcome === 'victory'
      await pvpStore.settleBattle(won)
    }
  }
}

/**
 * 打开副本面板
 */
function handleOpenDungeon(areaId: string) {
  selectedAreaId.value = areaId
  centerView.value = 'dungeon'
}

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
    showToast(result.message, 'success')
    selectedItem.value = null
  } else if (inventory.actionErrorMsg) {
    showToast(inventory.actionErrorMsg, 'error')
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
    showToast('丢弃成功', 'success')
    selectedItem.value = null
  } else if (inventory.actionErrorMsg) {
    showToast(inventory.actionErrorMsg, 'error')
  }
}

/**
 * 穿戴装备
 */
async function handleEquipItem(inventoryId: string, slotType?: string) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await charStore.equipItem(characterId, inventoryId, slotType)
  if (result.success) {
    showToast('装备成功', 'success')
    selectedItem.value = null
    // 刷新背包（装备从背包移除）
    await inventory.fetchInventory(characterId)
  } else {
    showToast(result.message, 'error')
  }
}

/**
 * 卸下装备
 */
async function handleUnequip(slotType: EquipmentSlotType) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await charStore.unequipItem(characterId, slotType)
  if (result.success) {
    showToast('卸下成功', 'success')
    // 刷新背包（装备回到背包）
    await inventory.fetchInventory(characterId)
  } else {
    showToast(result.message, 'error')
  }
}

/**
 * 强化装备
 */
async function handleEnhance(slotType: EquipmentSlotType) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await charStore.enhanceItem(characterId, slotType)
  if (result.success) {
    showToast(result.message, 'success')
    await inventory.fetchInventory(characterId)
  } else {
    showToast(result.message, 'error')
  }
}

/**
 * 刷新当前角色的商店概览。
 * @returns 无返回值
 */
async function handleRefreshShop(): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const ok = await shop.fetchOverview(characterId)
  if (!ok && shop.errorMsg) {
    showToast(shop.errorMsg, 'error')
  }
}

/**
 * 处理商店金币商品购买。
 * @param item - 被购买商品
 * @param quantity - 购买数量
 * @returns 无返回值
 */
async function handlePurchaseShopItem(item: ShopItem, quantity: number): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await shop.purchaseItem(characterId, item.id, quantity)
  if (result) {
    showToast(result.message, 'success')
    if (result.inventoryChanged) {
      await inventory.fetchInventory(characterId)
    }
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
  }
}

/**
 * 处理竞技币皮肤兑换。
 * @param item - 被兑换皮肤商品
 * @returns 无返回值
 */
async function handleRedeemShopSkin(item: ShopItem): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await shop.redeemSkin(characterId, item.id)
  if (result) {
    showToast(result.message, 'success')
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
  }
}

/**
 * 处理商店或装备页皮肤启用。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
async function handleEquipShopSkin(skin: CharacterSkin): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  const result = await shop.equipSkin(characterId, skin.skinId)
  if (result) {
    await charStore.fetchCharacterDetail(characterId)
    showToast(result.message, 'success')
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
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
 * 计算当前装备的套装效果
 */
const activeSetBonuses = computed(() => {
  if (!charDetail.value) return []
  return calculateSetBonuses(charDetail.value.equipment ?? {})
})

/**
 * 退出账号并清理本地角色、背包状态。
 * @returns Promise，无业务返回值
 */
async function handleLogout(): Promise<void> {
  await auth.logout()
  charStore.clear()
  inventory.clear()
  shop.clear()
  router.push({ name: 'login' })
}

/**
 * 加载角色详情（初次进入或切换角色）
 * 三个接口无依赖关系，并行请求提升加载速度
 */
async function loadCharacterDetail() {
  const characterId = charStore.selectedCharacterId
  if (!characterId) {
    router.push({ name: 'characters' })
    return
  }
  loading.value = true
  try {
    await Promise.all([
      charStore.fetchCharacterDetail(characterId),
      inventory.fetchInventory(characterId),
      fetchPetList(characterId),
      shop.fetchOverview(characterId)
    ])
  } finally {
    loading.value = false
  }
}

/**
 * 获取战宠列表
 */
async function fetchPetList(characterId: string) {
  petLoading.value = true
  try {
    const res = await getPetListApi(characterId)
    if (res.code === 200) {
      petList.value = res.data.pets
      petCapacity.value = res.data.capacity
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 设置出战战宠
 */
async function handleSetActivePet(petId: string) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await setActivePetApi(characterId, petId)
    if (res.code === 200) {
      await fetchPetList(characterId)
      await refreshCharacter()
      showToast(res.message || '设置成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 喂食战宠
 */
async function handleFeedPet(petId: string, inventoryId: string, quantity: number) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await feedPetApi(characterId, petId, inventoryId, quantity)
    if (res.code === 200) {
      await fetchPetList(characterId)
      await inventory.fetchInventory(characterId)
      showToast(res.message || '喂食成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 进化战宠
 */
async function handleEvolvePet(petId: string) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await evolvePetApi(characterId, petId)
    if (res.code === 200) {
      await fetchPetList(characterId)
      await refreshCharacter()
      showToast(res.message || '进化成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 重命名战宠
 */
async function handleRenamePet(petId: string, nickname: string) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await renamePetApi(characterId, petId, nickname)
    if (res.code === 200) {
      await fetchPetList(characterId)
      showToast(res.message || '重命名成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 装备技能到槽位
 */
async function handleEquipSkill(petId: string, skillId: number, slotIndex: number) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await equipSkillApi(characterId, petId, skillId, slotIndex)
    if (res.code === 200) {
      await fetchPetList(characterId)
      showToast(res.message || '装备技能成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 卸下技能
 */
async function handleUnequipSkill(petId: string, slotIndex: number) {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await unequipSkillApi(characterId, petId, slotIndex)
    if (res.code === 200) {
      await fetchPetList(characterId)
      showToast(res.message || '卸下技能成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 给战宠穿戴装备
 */
async function handleEquipPetItem(petId: string, inventoryId: string, slotType: 'armor' | 'accessory') {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await equipPetItemApi(characterId, petId, inventoryId, slotType)
    if (res.code === 200) {
      await fetchPetList(characterId)
      await inventory.fetchInventory(characterId)
      showToast(res.message || '装备成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
}

/**
 * 卸下战宠装备
 */
async function handleUnequipPetItem(petId: string, slotType: 'armor' | 'accessory') {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return

  petLoading.value = true
  try {
    const res = await unequipPetItemApi(characterId, petId, slotType)
    if (res.code === 200) {
      await fetchPetList(characterId)
      await inventory.fetchInventory(characterId)
      showToast(res.message || '卸下成功', 'success')
    } else {
      showToast(res.message, 'error')
    }
  } finally {
    petLoading.value = false
  }
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
/* ── Dark Mode Overrides ── */

/* 底部导航激活态 — 图片底图按钮无需额外暗色覆盖 */

/* 背包格子悬浮 — 暗色适配 */
[data-theme='dark'] .backpack-cell:hover {
  box-shadow: 0 4px 12px var(--accent-blue-glow);
}

/* 加载状态文字 */
[data-theme='dark'] .game-loading {
  color: var(--text-muted);
}

/* 空状态提示 */
[data-theme='dark'] .char-info__empty {
  color: var(--text-muted);
}

/* 背包加载动画 */
[data-theme='dark'] .backpack-loading__spinner {
  color: var(--text-muted);
}

/* 背包空状态 */
[data-theme='dark'] .backpack-empty {
  color: var(--text-muted);
}

/* 公告文字 */
[data-theme='dark'] .announcement__text {
  color: var(--text-muted);
}

/* UID 标签 */
[data-theme='dark'] .game-uid {
  color: var(--text-muted);
  background: var(--bg-panel-light);
  border-color: var(--border-light);
}

/* ═══ 响应式断点 ═══ */

/* ── Tablet (≤1024px) ── */
@media (max-width: 1024px) {
  .game-body {
    display: flex;
    flex-direction: column;
  }

  .game-left,
  .game-right {
    width: 100%;
    min-width: 0;
  }

  .backpack-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* ── Mobile landscape (≤768px) ── */
@media (max-width: 768px) {
  .game-home {
    padding: 8px;
  }

  .game-header {
    padding: 8px 10px;
    gap: 8px;
    border-radius: 12px;
  }

  .game-header__center {
    margin: 0 4px;
  }

  .game-header__title {
    font-size: var(--font-size-caption);
  }

  .game-body {
    gap: 8px;
  }

  .game-main__welcome {
    font-size: var(--font-size-base);
  }

  .game-main__desc {
    font-size: var(--font-size-xs);
  }

  .game-main__actions,
  .game-bottom-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .game-bottom-nav__item {
    min-width: 0;
  }

  .backpack-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .game-uid {
    position: static;
    align-self: flex-start;
    margin-top: 8px;
  }
}

/* ── Small phone (≤375px) ── */
@media (max-width: 375px) {
  .game-home {
    padding: 6px;
  }

  .game-header {
    padding: 6px 8px;
    margin-bottom: 8px;
    border-radius: 10px;
  }

  .game-body {
    gap: 6px;
  }

  .game-left {
    gap: 8px;
  }

  .game-main__actions,
  .game-bottom-nav {
    gap: 6px;
  }

  .backpack-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .backpack-search {
    padding: 4px 6px;
  }

  .backpack-filters {
    gap: 4px;
  }
}
</style>
