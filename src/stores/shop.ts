import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  equipCharacterSkinApi,
  getShopItemsApi,
  getShopOverviewApi,
  purchaseShopItemApi,
  redeemShopSkinApi
} from '../api/shop'
import type { CharacterSkin, ShopActionResult, ShopBalances, ShopItem, ShopOverview } from '../types/shop'

/**
 * 创建空商店货币余额。
 * @returns 角色金币与账号竞技币的默认余额
 */
function createEmptyBalances(): ShopBalances {
  return { characterGold: 0, accountPvpCoin: 0 }
}

/**
 * 商店状态管理
 * 管理商品列表、货币余额、账号皮肤拥有状态以及购买/兑换/启用动作
 */
export const useShopStore = defineStore('shop', () => {
  const overview = ref<ShopOverview | null>(null)
  const items = ref<ShopItem[]>([])
  const skins = ref<CharacterSkin[]>([])
  const balances = ref<ShopBalances>(createEmptyBalances())
  const activeSkinId = ref('')
  const loading = ref(false)
  const actionLoading = ref(false)
  const errorMsg = ref('')
  const actionErrorMsg = ref('')

  /** 金币商品列表。 */
  const goldItems = computed(() => items.value.filter(item => item.price.currency === 'gold'))

  /** 竞技币皮肤商品列表。 */
  const arenaSkinItems = computed(() => items.value.filter(item => item.price.currency === 'pvp_coin'))

  /** 当前账号已拥有的皮肤列表。 */
  const ownedSkins = computed(() => skins.value.filter(skin => skin.owned))

  /** 当前启用的皮肤。 */
  const activeSkin = computed(() => skins.value.find(skin => skin.skinId === activeSkinId.value) ?? null)

  /**
   * 使用商店概览同步 store 状态。
   * @param data - 商店概览数据
   * @returns 无返回值
   */
  function applyOverview(data: ShopOverview): void {
    overview.value = data
    items.value = data.items
    skins.value = data.skins
    balances.value = data.balances
    activeSkinId.value = data.activeSkinId
  }

  /**
   * 使用商店动作结果同步 store 状态。
   * @param result - 购买、兑换或启用返回结果
   * @returns 无返回值
   */
  function applyActionResult(result: ShopActionResult): void {
    balances.value = result.balances
    if (result.items) items.value = result.items
    if (result.skins) skins.value = result.skins
    if (result.activeSkin) activeSkinId.value = result.activeSkin.skinId
  }

  /**
   * 获取当前角色商店概览。
   * @param characterId - 当前角色 ID
   * @returns 是否成功
   */
  async function fetchOverview(characterId: string): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getShopOverviewApi(characterId)
      if (res.code === 200) {
        applyOverview(res.data)
        return true
      }
      errorMsg.value = res.message
      return false
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '获取商店数据失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前角色可见商品。
   * @param characterId - 当前角色 ID
   * @returns 是否成功
   */
  async function fetchItems(characterId: string): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getShopItemsApi(characterId)
      if (res.code === 200) {
        items.value = res.data
        return true
      }
      errorMsg.value = res.message
      return false
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '获取商品列表失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 购买金币商品。
   * @param characterId - 当前角色 ID
   * @param shopItemId - 商品 ID
   * @param quantity - 购买数量
   * @returns 操作结果，失败时返回 null
   */
  async function purchaseItem(characterId: string, shopItemId: string, quantity: number): Promise<ShopActionResult | null> {
    if (actionLoading.value) return null
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await purchaseShopItemApi({ characterId, shopItemId, quantity })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '购买失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 兑换竞技皮肤。
   * @param characterId - 当前角色 ID
   * @param shopItemId - 皮肤商品 ID
   * @returns 操作结果，失败时返回 null
   */
  async function redeemSkin(characterId: string, shopItemId: string): Promise<ShopActionResult | null> {
    if (actionLoading.value) return null
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await redeemShopSkinApi({ characterId, shopItemId })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '兑换失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 启用角色皮肤。
   * @param characterId - 当前角色 ID
   * @param skinId - 皮肤 ID
   * @returns 操作结果，失败时返回 null
   */
  async function equipSkin(characterId: string, skinId: string): Promise<ShopActionResult | null> {
    if (actionLoading.value) return null
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await equipCharacterSkinApi({ characterId, skinId })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '启用皮肤失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 清空商店状态。
   * @returns 无返回值
   */
  function clear(): void {
    overview.value = null
    items.value = []
    skins.value = []
    balances.value = createEmptyBalances()
    activeSkinId.value = ''
    errorMsg.value = ''
    actionErrorMsg.value = ''
  }

  return {
    overview,
    items,
    skins,
    balances,
    activeSkinId,
    loading,
    actionLoading,
    errorMsg,
    actionErrorMsg,
    goldItems,
    arenaSkinItems,
    ownedSkins,
    activeSkin,
    fetchOverview,
    fetchItems,
    purchaseItem,
    redeemSkin,
    equipSkin,
    clear
  }
})
