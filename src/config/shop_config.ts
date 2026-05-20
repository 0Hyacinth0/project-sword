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
    name: '小型生命药水',
    description: '恢复 50 点生命值，适合日常冒险补给。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 35 },
    maxPurchaseQuantity: 20,
    itemId: 1001
  },
  {
    id: 'gold-mana-potion',
    kind: 'inventory_item',
    name: '魔法药水',
    description: '恢复 30 点魔法值，适合施法职业常备。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 45 },
    maxPurchaseQuantity: 20,
    itemId: 1004
  },
  {
    id: 'gold-small-exp-scroll',
    kind: 'inventory_item',
    name: '经验卷轴（小）',
    description: '使用后获得 100 点经验值。',
    category: 'supply',
    rarity: 'Rare',
    price: { currency: 'gold', amount: 180 },
    maxPurchaseQuantity: 5,
    itemId: 1006
  },
  {
    id: 'gold-iron-ore',
    kind: 'inventory_item',
    name: '铁矿石',
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
    name: '精钢矿石',
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
    name: '战士·英灵召唤',
    description: '竞技场兑换的战士职业 invoke 皮肤。',
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
    name: '法师·英灵召唤',
    description: '竞技场兑换的法师职业 invoke 皮肤。',
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
    name: '猎人·英灵召唤',
    description: '竞技场兑换的猎人职业 invoke 皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'hunter_invoke',
    profession: 3,
    previewImageUrl: '/assets/portraits/hunter_invoke.png'
  }
]
