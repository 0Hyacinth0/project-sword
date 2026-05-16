/**
 * 装备静态配置数据
 * 前端展示用，包含槽位图标、品质颜色等
 */
import type { EquipmentSlotType } from '../types/equipment'
import type { ItemRarity } from '../types/item'
import {
  RARITY_COLORS as ITEM_RARITY_COLORS,
  RARITY_CSS_VAR as ITEM_RARITY_CSS_VAR,
  RARITY_LEVEL as ITEM_RARITY_LEVEL,
  RARITY_LABELS as ITEM_RARITY_LABELS,
  getRarityColor as getItemRarityColor
} from './item_config'
import { Sword, Crown, Shield, Footprints, Gem } from 'lucide-vue-next'
import type { Component } from 'vue'

/** 槽位配置 */
export interface SlotConfig {
  type: EquipmentSlotType
  icon: Component          // Lucide 图标组件
  label: string            // 槽位名称（中文）
  position: number         // 显示顺序
}

/** 六槽位完整配置 */
export const EQUIPMENT_SLOT_CONFIGS: Record<EquipmentSlotType, SlotConfig> = {
  weapon: {
    type: 'weapon',
    icon: Sword,
    label: '武器',
    position: 1
  },
  helmet: {
    type: 'helmet',
    icon: Crown,
    label: '头盔',
    position: 2
  },
  chest: {
    type: 'chest',
    icon: Shield,
    label: '胸甲',
    position: 3
  },
  legs: {
    type: 'legs',
    icon: Footprints,
    label: '护腿',
    position: 4
  },
  accessory1: {
    type: 'accessory1',
    icon: Gem,
    label: '饰品',
    position: 5
  },
  accessory2: {
    type: 'accessory2',
    icon: Gem,
    label: '饰品',
    position: 6
  }
}

/** 槽位列表（按位置排序） */
export const SLOT_LIST: EquipmentSlotType[] = ['weapon', 'helmet', 'chest', 'legs', 'accessory1', 'accessory2']

// ──────────────────────────────────────────
// 稀有度配置（从 item_config 重导出，类型适配为 EquipmentRarity）
// ──────────────────────────────────────────

/** 装备稀有度颜色（重导出自 item_config） */
export const RARITY_COLORS = ITEM_RARITY_COLORS as Record<ItemRarity, { light: string; dark: string }>

/** 稀有度对应的 CSS 变量名（重导出自 item_config） */
export const RARITY_CSS_VAR = ITEM_RARITY_CSS_VAR as Record<ItemRarity, string>

/** 稀有度等级数值（重导出自 item_config） */
export const RARITY_LEVEL = ITEM_RARITY_LEVEL as Record<ItemRarity, number>

/** 稀有度标签（重导出自 item_config） */
export const RARITY_LABELS = ITEM_RARITY_LABELS as Record<ItemRarity, string>

/** 获取槽位配置 */
export function getSlotConfig(slotType: EquipmentSlotType): SlotConfig {
  return EQUIPMENT_SLOT_CONFIGS[slotType]
}

/** 获取稀有度颜色（根据主题，委托给 item_config） */
export function getRarityColor(rarity: ItemRarity, isDark: boolean = false): string {
  return getItemRarityColor(rarity, isDark)
}