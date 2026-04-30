/**
 * 装备静态配置数据
 * 前端展示用，包含槽位图标、品质颜色等
 */
import type { EquipmentSlotType, EquipmentRarity } from '../types/equipment'
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

/** 装备稀有度颜色（参考 DESIGN.md） */
export const RARITY_COLORS: Record<EquipmentRarity, { light: string; dark: string }> = {
  Normal: {
    light: '#6e6e73',
    dark: '#f4f1ff'
  },
  Rare: {
    light: '#0071e3',
    dark: '#59a6ff'
  },
  Epic: {
    light: '#af52de',
    dark: '#c282ff'
  },
  Legendary: {
    light: '#ff9500',
    dark: '#ff9b52'
  }
}

/** 稀有度标签（中文） */
export const RARITY_LABELS: Record<EquipmentRarity, string> = {
  Normal: '普通',
  Rare: '稀有',
  Epic: '史诗',
  Legendary: '传说'
}

/** 获取槽位配置 */
export function getSlotConfig(slotType: EquipmentSlotType): SlotConfig {
  return EQUIPMENT_SLOT_CONFIGS[slotType]
}

/** 获取稀有度颜色（根据主题） */
export function getRarityColor(rarity: EquipmentRarity, isDark: boolean = false): string {
  return isDark ? RARITY_COLORS[rarity].dark : RARITY_COLORS[rarity].light
}