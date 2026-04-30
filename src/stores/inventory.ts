import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getInventoryApi, useItemApi, discardItemApi } from '../api/inventory'
import type { InventoryItem, BackpackTab, UseItemResult } from '../types/item'

/**
 * 背包状态管理
 * 管理角色背包物品列表、标签筛选、物品操作
 */
export const useInventoryStore = defineStore('inventory', () => {
  // ── 状态 ──
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const activeTab = ref<BackpackTab>('all')
  const errorMsg = ref('')
  const actionLoading = ref(false)
  const actionErrorMsg = ref('')

  // ── 计算属性 ──

  /** 按当前标签过滤后的物品列表 */
  const filteredItems = computed(() => {
    if (activeTab.value === 'all') return items.value
    return items.value.filter(inv => inv.item.category === activeTab.value)
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
    errorMsg.value = ''
    actionErrorMsg.value = ''
  }

  return {
    items,
    loading,
    activeTab,
    errorMsg,
    actionLoading,
    actionErrorMsg,
    filteredItems,
    totalItems,
    fetchInventory,
    setActiveTab,
    useItem,
    discardItem,
    clear
  }
})
