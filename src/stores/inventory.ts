import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getInventoryApi, useItemApi, discardItemApi } from '../api/inventory'
import type { InventoryItem, BackpackTab, UseItemResult, SortField, SortOrder, ItemRarity } from '../types/item'

/** 稀有度排序权重（数值越高越稀有） */
const RARITY_WEIGHT: Record<ItemRarity, number> = {
  Normal: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3
}

/**
 * 背包状态管理
 * 管理角色背包物品列表、标签筛选、排序、搜索
 */
export const useInventoryStore = defineStore('inventory', () => {
  // ── 状态 ──
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const activeTab = ref<BackpackTab>('all')
  const sortField = ref<SortField>('obtainedAt')
  const sortOrder = ref<SortOrder>('desc')
  const searchQuery = ref('')
  const rarityFilter = ref<ItemRarity | 'all'>('all')
  const errorMsg = ref('')
  const actionLoading = ref(false)
  const actionErrorMsg = ref('')

  // ── 计算属性 ──

  /** 筛选 + 排序后的物品列表 */
  const filteredItems = computed(() => {
    let result = [...items.value]

    // 1. 按分类筛选
    if (activeTab.value !== 'all') {
      result = result.filter(inv => inv.item.category === activeTab.value)
    }

    // 2. 按稀有度筛选
    if (rarityFilter.value !== 'all') {
      result = result.filter(inv => inv.item.rarity === rarityFilter.value)
    }

    // 3. 按名称搜索
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      result = result.filter(inv => inv.item.name.toLowerCase().includes(query))
    }

    // 4. 排序
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField.value) {
        case 'name':
          cmp = a.item.name.localeCompare(b.item.name, 'zh-CN')
          break
        case 'rarity':
          cmp = RARITY_WEIGHT[a.item.rarity] - RARITY_WEIGHT[b.item.rarity]
          break
        case 'quantity':
          cmp = a.quantity - b.quantity
          break
        case 'obtainedAt':
          cmp = new Date(a.obtainedAt).getTime() - new Date(b.obtainedAt).getTime()
          break
        case 'sellPrice':
          cmp = a.item.sellPrice - b.item.sellPrice
          break
      }
      return sortOrder.value === 'asc' ? cmp : -cmp
    })

    return result
  })

  /** 背包物品总数 */
  const totalItems = computed(() => items.value.length)

  // ── 方法 ──

  /**
   * 加载角色背包数据
   * @param characterId - 角色 UUID
   */
  async function fetchInventory(characterId: string) {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getInventoryApi(characterId)
      if (res.code === 200) {
        items.value = res.data
      } else {
        errorMsg.value = res.message
      }
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '获取背包数据失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换背包标签
   */
  function setActiveTab(tab: BackpackTab) {
    activeTab.value = tab
  }

  /**
   * 设置排序字段
   */
  function setSortField(field: SortField) {
    if (sortField.value === field) {
      // 同字段切换升降序
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'desc'
    }
  }

  /**
   * 设置稀有度筛选
   */
  function setRarityFilter(rarity: ItemRarity | 'all') {
    rarityFilter.value = rarity
  }

  /**
   * 设置搜索关键词
   */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /**
   * 使用消耗品
   * @param characterId - 角色 UUID
   * @param inventoryId - 背包记录 ID
   * @param quantity - 使用数量
   */
  async function useItem(characterId: string, inventoryId: string, quantity: number): Promise<UseItemResult | null> {
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await useItemApi(characterId, inventoryId, quantity)
      if (res.code === 200) {
        await fetchInventory(characterId)
        return res.data
      } else {
        actionErrorMsg.value = res.message
        return null
      }
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '使用物品失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 丢弃物品
   * @param characterId - 角色 UUID
   * @param inventoryId - 背包记录 ID
   * @param quantity - 丢弃数量
   */
  async function discardItem(characterId: string, inventoryId: string, quantity: number): Promise<boolean> {
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await discardItemApi(characterId, inventoryId, quantity)
      if (res.code === 200) {
        await fetchInventory(characterId)
        return true
      } else {
        actionErrorMsg.value = res.message
        return false
      }
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '丢弃物品失败'
      return false
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 清空背包数据（切换角色/退出时调用）
   */
  function clear() {
    items.value = []
    activeTab.value = 'all'
    sortField.value = 'obtainedAt'
    sortOrder.value = 'desc'
    searchQuery.value = ''
    rarityFilter.value = 'all'
    errorMsg.value = ''
    actionErrorMsg.value = ''
  }

  return {
    items,
    loading,
    activeTab,
    sortField,
    sortOrder,
    searchQuery,
    rarityFilter,
    errorMsg,
    actionLoading,
    actionErrorMsg,
    filteredItems,
    totalItems,
    fetchInventory,
    setActiveTab,
    setSortField,
    setRarityFilter,
    setSearchQuery,
    useItem,
    discardItem,
    clear
  }
})
