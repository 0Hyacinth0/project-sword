<!--
  ItemDetailModal.vue
  物品详情弹窗
  显示物品名称、稀有度、描述、属性/效果、来源等
  支持使用消耗品、丢弃物品操作
-->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="item" class="item-modal__overlay" @click.self="$emit('close')">
        <div class="item-modal">
          <!-- 顶部：图标 + 名称 -->
          <div class="item-modal__header">
            <div class="item-modal__icon" :style="{ borderColor: rarityColor, background: rarityBg }">
              <component
                :is="getCategoryIcon(item.item.category)"
                :size="22"
                :style="{ color: rarityColor }"
              />
            </div>
            <div class="item-modal__title">
              <span class="item-modal__name" :style="{ color: rarityColor }">
                {{ item.item.name }}
              </span>
              <span class="item-modal__meta">
                {{ rarityLabel }} · {{ categoryLabel }}
              </span>
            </div>
            <button class="item-modal__close" @click="$emit('close')">
              <X :size="16" />
            </button>
          </div>

          <!-- 描述 -->
          <div class="item-modal__desc">{{ item.item.description }}</div>

          <!-- 装备属性对比 -->
          <div v-if="item.item.category === 'equipment'" class="item-modal__compare">
            <div class="item-modal__compare-row item-modal__compare-header">
              <span class="item-modal__compare-col">属性</span>
              <span class="item-modal__compare-col">当前</span>
              <span class="item-modal__compare-col">待装备</span>
              <span class="item-modal__compare-col">差异</span>
            </div>
            <div v-for="stat in compareStats" :key="stat.key" class="item-modal__compare-row">
              <span class="item-modal__compare-col item-modal__compare-label">{{ stat.label }}</span>
              <span class="item-modal__compare-col">{{ stat.current ?? '-' }}</span>
              <span class="item-modal__compare-col">{{ stat.pending ?? '-' }}</span>
              <span
                class="item-modal__compare-col"
                :class="{
                  'item-modal__compare-up': stat.diff > 0,
                  'item-modal__compare-down': stat.diff < 0
                }"
              >
                {{ stat.diff > 0 ? '+' : '' }}{{ stat.diff || '=' }}
              </span>
            </div>
            <div v-if="!currentEquipment" class="item-modal__compare-empty">
              该槽位当前空闲，装备后直接获得以上属性
            </div>
            <div v-if="currentEquipment?.enhanceLevel" class="item-modal__compare-enhance">
              当前装备已强化至 +{{ currentEquipment.enhanceLevel }}，属性已包含强化加成
            </div>
          </div>

          <!-- 随机词条（稀有以上装备） -->
          <div v-if="item.item.category === 'equipment' && item.extraStats?.length" class="item-modal__affix">
            <div class="item-modal__affix-title">随机词条</div>
            <div
              v-for="(affix, i) in item.extraStats"
              :key="i"
              class="item-modal__affix-row"
            >
              <span class="item-modal__affix-label">{{ affixLabel(affix.key) }}</span>
              <span class="item-modal__affix-value">{{ formatAffixValue(affix.key, affix.value) }}</span>
            </div>
          </div>

          <!-- 消耗品效果 -->
          <div v-if="item.item.category === 'consumable' && item.item.effects" class="item-modal__section">
            <div class="item-modal__section-title">效果</div>
            <div
              v-for="(eff, i) in item.item.effects"
              :key="i"
              class="item-modal__effect"
            >
              {{ eff.description }}
            </div>
          </div>

          <!-- 材料来源/用途 -->
          <div v-if="item.item.category === 'material'" class="item-modal__section">
            <div v-if="item.item.source" class="item-modal__info-row">
              <span class="item-modal__info-label">获取途径</span>
              <span class="item-modal__info-value">{{ item.item.source }}</span>
            </div>
            <div v-if="item.item.usage" class="item-modal__info-row">
              <span class="item-modal__info-label">用途</span>
              <span class="item-modal__info-value">{{ item.item.usage }}</span>
            </div>
          </div>

          <!-- 底部信息 -->
          <div class="item-modal__footer">
            <span>数量：{{ item.quantity }}/{{ item.item.maxStack }}</span>
            <span v-if="item.item.sellPrice > 0">售价：{{ item.item.sellPrice }} 金币</span>
          </div>

          <!-- 操作按钮区 -->
          <div class="item-modal__actions">
            <button
              v-if="item.item.category === 'consumable'"
              class="item-modal__btn item-modal__btn--use"
              :disabled="actionLoading"
              @click="startAction('use')"
            >
              <Sparkles :size="14" />
              使用
            </button>
            <button
              v-if="item.item.category === 'equipment'"
              class="item-modal__btn item-modal__btn--use"
              :disabled="actionLoading"
              @click="handleEquip"
            >
              <Sparkles :size="14" />
              装备
            </button>
            <button
              class="item-modal__btn item-modal__btn--discard"
              :disabled="actionLoading"
              @click="startAction('discard')"
            >
              <Trash2 :size="14" />
              丢弃
            </button>
          </div>

          <!-- 数量选择器（展开时显示） -->
          <Transition name="slide">
            <div v-if="activeAction" class="item-modal__quantity">
              <div class="item-modal__quantity-label">
                {{ activeAction === 'use' ? '使用数量' : '丢弃数量' }}
              </div>
              <div class="item-modal__quantity-row">
                <div class="item-modal__quantity-controls">
                  <button class="item-modal__qty-btn" @click="adjustQuantity(-1)">
                    <Minus :size="14" />
                  </button>
                  <input
                    v-model.number="selectedQuantity"
                    class="item-modal__qty-input"
                    type="number"
                    :min="1"
                    :max="item.quantity"
                  />
                  <button class="item-modal__qty-btn" @click="adjustQuantity(1)">
                    <Plus :size="14" />
                  </button>
                </div>
                <div class="item-modal__quantity-actions">
                  <button
                    class="item-modal__btn item-modal__btn--sm"
                    :class="activeAction === 'use' ? 'item-modal__btn--use' : 'item-modal__btn--discard'"
                    :disabled="selectedQuantity < 1 || selectedQuantity > item.quantity || actionLoading"
                    @click="confirmAction"
                  >
                    {{ actionLoading ? '...' : '确认' }}
                  </button>
                  <button class="item-modal__btn item-modal__btn--sm item-modal__btn--cancel" @click="cancelAction">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 丢弃二次确认弹窗 -->
          <Transition name="slide">
            <div v-if="showDiscardConfirm" class="item-modal__confirm">
              <div class="item-modal__confirm-text">
                确定丢弃 <span :style="{ color: rarityColor }">{{ item.item.name }}</span> ×{{ selectedQuantity }}？
              </div>
              <div class="item-modal__confirm-actions">
                <button
                  class="item-modal__btn item-modal__btn--discard"
                  :disabled="actionLoading"
                  @click="executeDiscard"
                >
                  {{ actionLoading ? '处理中...' : '确认丢弃' }}
                </button>
                <button class="item-modal__btn item-modal__btn--cancel" @click="showDiscardConfirm = false">
                  再想想
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Sparkles, Trash2, Minus, Plus } from 'lucide-vue-next'
import type { InventoryItem } from '../../types/item'
import { getRarityColorVar, getRarityLabel, getCategoryIcon, getCategoryLabel, RARITY_COLORS } from '../../config/item_config'
import { AFFIX_LABELS, formatAffixValue } from '../../config/affix_config'
import { getEnhancedValue } from '../../config/enhance_config'
import type { ExtraStat, Equipment, EquipmentRarity } from '../../types/equipment'

/**
 * 物品详情弹窗组件
 * @param item - 当前选中的背包物品（null 时隐藏）
 * @param actionLoading - 操作进行中（禁用按钮）
 * @emits close - 关闭弹窗
 * @emits use - 使用消耗品 (inventoryId, quantity)
 * @emits discard - 丢弃物品 (inventoryId, quantity)
 */

interface Props {
  item: InventoryItem | null
  actionLoading?: boolean
  currentEquipment?: Equipment | null
}

interface Emits {
  (e: 'close'): void
  (e: 'use', inventoryId: string, quantity: number): void
  (e: 'discard', inventoryId: string, quantity: number): void
  (e: 'equip', inventoryId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  actionLoading: false,
  currentEquipment: null
})
const emit = defineEmits<Emits>()

/** 当前展开的操作类型 */
const activeAction = ref<'use' | 'discard' | null>(null)

/** 选择的数量 */
const selectedQuantity = ref(1)

/** 丢弃二次确认 */
const showDiscardConfirm = ref(false)

/** 稀有度颜色（CSS 变量，自动适配暗色模式） */
const rarityColor = computed(() => {
  if (!props.item) return 'var(--rarity-normal)'
  return getRarityColorVar(props.item.item.rarity)
})

/** 稀有度背景色（半透明，使用 hex 透明度） */
const rarityBg = computed(() => {
  if (!props.item) return 'transparent'
  const color = RARITY_COLORS[props.item.item.rarity].light
  return color + '14'
})

/** 稀有度标签 */
const rarityLabel = computed(() => {
  if (!props.item) return ''
  return getRarityLabel(props.item.item.rarity)
})

/** 分类标签 */
const categoryLabel = computed(() => {
  if (!props.item) return ''
  return getCategoryLabel(props.item.item.category)
})

/** 属性名称映射 */
const STAT_LABELS: Record<string, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  hp: '生命',
  mp: '魔力',
  criticalRate: '暴击',
  dodgeRate: '闪避',
  strength: '力量',
  intelligence: '智力',
  agility: '敏捷'
}

/**
 * 获取装备某属性的总值（基础 stats + 强化加成 + extraStats）
 */
function getTotalStat(
  stats: Record<string, number | undefined> | undefined,
  extraStats?: ExtraStat[],
  enhanceLevel?: number,
  rarity?: EquipmentRarity
): (key: string) => number {
  return (key: string) => {
    const base = stats?.[key] ?? 0
    // 强化加成（仅对基础属性生效）
    const enhanced = getEnhancedValue(base, enhanceLevel || 0, rarity || 'Normal')
    // 随机词条加成
    const extra = extraStats?.filter(s => s.key === key).reduce((sum, s) => sum + s.value, 0) ?? 0
    return enhanced + extra
  }
}

/** 合并所有出现过的属性 key（含词条） */
const allStatKeys = computed(() => {
  const keys = new Set<string>()
  if (props.currentEquipment) {
    Object.keys(props.currentEquipment.stats).forEach(k => keys.add(k))
    props.currentEquipment.extraStats?.forEach(s => keys.add(s.key))
  }
  if (props.item?.item.stats) {
    Object.keys(props.item.item.stats).forEach(k => keys.add(k))
  }
  if (props.item?.extraStats) {
    props.item.extraStats.forEach(s => keys.add(s.key))
  }
  return [...keys]
})

/** 属性对比数据（合并基础属性 + 强化加成 + 随机词条） */
const compareStats = computed(() => {
  const getCurrent = getTotalStat(
    props.currentEquipment?.stats as Record<string, number | undefined> | undefined,
    props.currentEquipment?.extraStats,
    props.currentEquipment?.enhanceLevel,
    props.currentEquipment?.rarity
  )
  // 背包中的装备暂无强化等级（新获取的装备）
  const getPending = getTotalStat(
    props.item?.item.stats as Record<string, number | undefined> | undefined,
    props.item?.extraStats,
    0,
    props.item?.item.rarity as EquipmentRarity
  )
  return allStatKeys.value.map(key => {
    const current = getCurrent(key)
    const pending = getPending(key)
    const diff = pending - current
    return {
      key,
      label: STAT_LABELS[key] || key,
      current: current || null,
      pending: pending || null,
      diff
    }
  })
})

/**
 * 获取词条属性中文名
 */
function affixLabel(key: string): string {
  return AFFIX_LABELS[key] || key
}

/**
 * 开始操作（展开数量选择器）
 */
function startAction(action: 'use' | 'discard') {
  activeAction.value = action
  selectedQuantity.value = 1
  showDiscardConfirm.value = false
}

/**
 * 调整数量（+1 或 -1）
 */
function adjustQuantity(delta: number) {
  if (!props.item) return
  const newVal = selectedQuantity.value + delta
  selectedQuantity.value = Math.max(1, Math.min(newVal, props.item.quantity))
}

/**
 * 确认操作
 */
function confirmAction() {
  if (!props.item || selectedQuantity.value < 1) return
  if (activeAction.value === 'use') {
    emit('use', props.item.id, selectedQuantity.value)
  } else if (activeAction.value === 'discard') {
    // 丢弃需要二次确认
    showDiscardConfirm.value = true
  }
}

/**
 * 执行丢弃（二次确认后）
 */
function executeDiscard() {
  if (!props.item) return
  emit('discard', props.item.id, selectedQuantity.value)
}

/**
 * 取消操作（收起数量选择器）
 */
function cancelAction() {
  activeAction.value = null
  selectedQuantity.value = 1
}

/**
 * 装备物品
 */
function handleEquip() {
  if (!props.item) return
  emit('equip', props.item.id)
}
</script>
