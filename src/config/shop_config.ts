/**
 * 商店静态配置
 * 仅描述前端展示和 Mock 默认商品；真实价格与上架状态以后端为准。
 */
import type { ShopBalances, ShopItem } from '../types/shop'

export const DEFAULT_SHOP_BALANCES: ShopBalances = {
  characterGold: 1800,
  accountPvpCoin: 2400
}

export const SHOP_GOLD_ITEMS: ShopItem[] = [
  {
    id: 'gold-small-hp-potion',
    kind: 'inventory_item',
    name: '回春丹（小）',
    description: '恢复 50 点气血，适合江湖补给。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 35 },
    maxPurchaseQuantity: 20,
    itemId: 1001
  },
  {
    id: 'gold-mana-potion',
    kind: 'inventory_item',
    name: '聚气丹',
    description: '恢复 30 点内力，适合术士常备。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 45 },
    maxPurchaseQuantity: 20,
    itemId: 1004
  },
  {
    id: 'gold-small-exp-scroll',
    kind: 'inventory_item',
    name: '修为秘籍（小）',
    description: '研读后获得 100 点修为。',
    category: 'supply',
    rarity: 'Rare',
    price: { currency: 'gold', amount: 180 },
    maxPurchaseQuantity: 5,
    itemId: 1006
  },
  {
    id: 'gold-iron-ore',
    kind: 'inventory_item',
    name: '玄铁矿',
    description: '基础强化材料，可用于低阶装备强化。',
    category: 'material',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 25 },
    maxPurchaseQuantity: 30,
    itemId: 2001
  },
  {
    id: 'gold-steel-ore',
    kind: 'inventory_item',
    name: '寒铁精矿',
    description: '进阶强化材料，适合稀有装备强化。',
    category: 'material',
    rarity: 'Rare',
    price: { currency: 'gold', amount: 90 },
    maxPurchaseQuantity: 15,
    itemId: 2002
  }
]

export const SHOP_SKIN_ITEMS: ShopItem[] = [
  {
    id: 'arena-warrior-invoke',
    kind: 'skin',
    name: '剑客·侠影',
    description: '比武擂台兑换的剑客门派侠影皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'warrior_invoke',
    profession: 1,
    previewImageUrl: '/assets/portraits/warrior_invoke.png'
  },
  {
    id: 'arena-mage-invoke',
    kind: 'skin',
    name: '术士·玄影',
    description: '比武擂台兑换的术士门派玄影皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'mage_invoke',
    profession: 2,
    previewImageUrl: '/assets/portraits/mage_invoke.png'
  },
  {
    id: 'arena-hunter-invoke',
    kind: 'skin',
    name: '刺客·冥影',
    description: '比武擂台兑换的刺客门派冥影皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'hunter_invoke',
    profession: 3,
    previewImageUrl: '/assets/portraits/hunter_invoke.png'
  }
]
