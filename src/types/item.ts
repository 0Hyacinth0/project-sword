/**
 * 物品与背包类型定义
 * 消耗品、材料、装备的通用数据结构
 */

/** 物品分类 */
export type ItemCategory = 'consumable' | 'material' | 'equipment'

/** 物品稀有度（与装备稀有度统一） */
export type ItemRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

/** 消耗品效果类型 */
export type ConsumableEffectType = 'heal_hp' | 'heal_mp' | 'add_exp' | 'revive'

/** 消耗品效果 */
export interface ConsumableEffect {
  type: ConsumableEffectType
  value: number
  description: string
}

/** 物品基础信息（对应后端 items 静态配置表） */
export interface BaseItem {
  /** 物品模板 ID */
  itemId: number
  /** 物品名称 */
  name: string
  /** 物品分类 */
  category: ItemCategory
  /** 稀有度 */
  rarity: ItemRarity
  /** 物品描述 */
  description: string
  /** 图标资源路径 */
  iconUrl: string | null
  /** 最大堆叠数量（装备=1，消耗品/材料可堆叠） */
  maxStack: number
  /** 出售价格（0 表示不可出售） */
  sellPrice: number
  /** 消耗品效果（仅 category='consumable'） */
  effects?: ConsumableEffect[]
  /** 材料来源描述（仅 category='material'） */
  source?: string
  /** 材料用途描述（仅 category='material'） */
  usage?: string
}

/** 背包物品实例（对应后端 character_inventory 表） */
export interface InventoryItem {
  /** 背包记录唯一 ID */
  id: string
  /** 所属角色 ID */
  characterId: string
  /** 物品模板 ID */
  itemId: number
  /** 物品详情（前端展开，后端返回时 join） */
  item: BaseItem
  /** 持有数量 */
  quantity: number
  /** 获取时间 */
  obtainedAt: string
}

/** 背包标签页类型 */
export type BackpackTab = 'all' | ItemCategory

/** 背包排序字段 */
export type SortField = 'name' | 'rarity' | 'quantity' | 'obtainedAt' | 'sellPrice'

/** 排序方向 */
export type SortOrder = 'asc' | 'desc'

/** 物品使用结果（后端返回） */
export interface UseItemResult {
  /** 效果描述列表 */
  effects: string[]
  /** 汇总提示消息 */
  message: string
}
