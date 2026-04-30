/**
 * 物品静态配置数据
 * 前端展示用，包含分类图标、稀有度颜色等
 */
import type { ItemCategory, ItemRarity, BackpackTab } from '../types/item'
import { Droplet, Sparkles, Gem, Shirt } from 'lucide-vue-next'
import type { Component } from 'vue'

/** 稀有度颜色（与装备系统统一） */
export const RARITY_COLORS: Record<ItemRarity, { light: string; dark: string }> = {
  Normal: { light: '#6e6e73', dark: '#f4f1ff' },
  Rare: { light: '#0071e3', dark: '#59a6ff' },
  Epic: { light: '#af52de', dark: '#c282ff' },
  Legendary: { light: '#ff9500', dark: '#ff9b52' }
}

/** 稀有度标签（中文） */
export const RARITY_LABELS: Record<ItemRarity, string> = {
  Normal: '普通',
  Rare: '稀有',
  Epic: '史诗',
  Legendary: '传说'
}

/** 物品分类配置 */
export interface CategoryConfig {
  type: ItemCategory
  icon: Component
  label: string
}

/** 物品分类配置表 */
export const CATEGORY_CONFIGS: Record<ItemCategory, CategoryConfig> = {
  consumable: {
    type: 'consumable',
    icon: Droplet,
    label: '消耗品'
  },
  material: {
    type: 'material',
    icon: Gem,
    label: '材料'
  },
  equipment: {
    type: 'equipment',
    icon: Shirt,
    label: '装备'
  }
}

/** 背包标签页配置 */
export interface BackpackTabConfig {
  key: BackpackTab
  icon: Component | null
  label: string
}

/** 背包标签页列表 */
export const BACKPACK_TABS: BackpackTabConfig[] = [
  { key: 'all', icon: null, label: '全部' },
  { key: 'consumable', icon: CATEGORY_CONFIGS.consumable.icon, label: '消耗品' },
  { key: 'material', icon: CATEGORY_CONFIGS.material.icon, label: '材料' },
  { key: 'equipment', icon: CATEGORY_CONFIGS.equipment.icon, label: '装备' }
]

/** 消耗品效果图标映射 */
export const EFFECT_TYPE_ICONS: Record<string, Component> = {
  heal_hp: Droplet,
  heal_mp: Sparkles,
  add_exp: Sparkles,
  revive: Sparkles
}

/** 消耗品效果描述模板 */
export const EFFECT_TYPE_DESCRIPTIONS: Record<string, string> = {
  heal_hp: '恢复生命值',
  heal_mp: '恢复魔法值',
  add_exp: '增加经验值',
  revive: '复活角色'
}

/**
 * 获取稀有度颜色
 */
export function getRarityColor(rarity: ItemRarity, isDark: boolean = false): string {
  return isDark ? RARITY_COLORS[rarity].dark : RARITY_COLORS[rarity].light
}

/**
 * 获取稀有度标签
 */
export function getRarityLabel(rarity: ItemRarity): string {
  return RARITY_LABELS[rarity] || '普通'
}

/**
 * 获取分类配置
 */
export function getCategoryConfig(category: ItemCategory): CategoryConfig {
  return CATEGORY_CONFIGS[category]
}

/**
 * 获取分类图标（根据分类类型）
 */
export function getCategoryIcon(category: ItemCategory): Component {
  return CATEGORY_CONFIGS[category].icon
}

/**
 * 获取分类标签
 */
export function getCategoryLabel(category: ItemCategory): string {
  return CATEGORY_CONFIGS[category].label
}