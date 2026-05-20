/**
 * 商店系统类型定义
 * 覆盖多货币商品、账号职业皮肤与操作结果
 */

export type ShopCurrencyType = 'gold' | 'pvp_coin'
export type ShopItemKind = 'inventory_item' | 'skin'
export type ShopCategory = 'supply' | 'material' | 'skin'
export type SkinSource = 'default' | 'pvp_shop'
export type ShopProfession = 1 | 2 | 3
export type ShopItemRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

export interface ShopPrice {
  currency: ShopCurrencyType
  amount: number
}

export interface ShopBalances {
  characterGold: number
  accountPvpCoin: number
}

export interface ShopItem {
  id: string
  kind: ShopItemKind
  name: string
  description: string
  category: ShopCategory
  rarity: ShopItemRarity
  price: ShopPrice
  maxPurchaseQuantity: number
  itemId?: number
  skinId?: string
  profession?: ShopProfession
  previewImageUrl?: string
  owned?: boolean
  enabled?: boolean
}

export interface CharacterSkin {
  skinId: string
  name: string
  profession: ShopProfession
  portraitUrl: string | null
  source: SkinSource
  owned: boolean
  enabled: boolean
  description?: string
  price?: ShopPrice
}

export interface ShopOverview {
  balances: ShopBalances
  items: ShopItem[]
  skins: CharacterSkin[]
  activeSkinId: string
}

export interface PurchaseShopItemParams {
  characterId: string
  shopItemId: string
  quantity: number
}

export interface RedeemSkinParams {
  characterId: string
  shopItemId: string
}

export interface EquipSkinParams {
  characterId: string
  skinId: string
}

export interface ShopActionResult {
  message: string
  balances: ShopBalances
  items?: ShopItem[]
  skins?: CharacterSkin[]
  activeSkin?: CharacterSkin
  inventoryChanged?: boolean
}
