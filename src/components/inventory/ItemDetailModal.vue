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

<style scoped>
.item-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.item-modal {
  width: 320px;
  max-width: 90vw;
  background: var(--bg-modal);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  color: var(--text-primary);
}

/* 头部 */
.item-modal__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.item-modal__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-modal__title {
  flex: 1;
  min-width: 0;
}

.item-modal__name {
  display: block;
  font-size: var(--font-size-base, 16px);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-modal__meta {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.item-modal__close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.item-modal__close:hover {
  background: rgba(128, 128, 128, 0.15);
  color: var(--text-primary);
}

/* 描述 */
.item-modal__desc {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 12px;
}

/* ── 装备属性对比 ── */
.item-modal__compare {
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.item-modal__compare-row {
  display: flex;
  gap: 0;
  font-size: var(--font-size-xs);
  border-bottom: 1px solid var(--border-light);
}

.item-modal__compare-row:last-child {
  border-bottom: none;
}

.item-modal__compare-col {
  flex: 1;
  padding: 5px 6px;
  text-align: center;
  color: var(--text-primary);
}

.item-modal__compare-header {
  background: rgba(128, 128, 128, 0.06);
  font-weight: 600;
  color: var(--text-muted);
}

.item-modal__compare-label {
  text-align: left;
  color: var(--text-muted);
}

.item-modal__compare-up {
  color: var(--accent-green, #34c759);
  font-weight: 600;
}

.item-modal__compare-down {
  color: var(--accent-red, #ff3b30);
  font-weight: 600;
}

.item-modal__compare-empty {
  padding: 6px 8px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-align: center;
}

.item-modal__compare-enhance {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  color: var(--accent-gold, #f59e0b);
  text-align: center;
  border-top: 1px solid var(--border-light);
}

/* ── 随机词条 ── */
.item-modal__affix {
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid rgba(52, 199, 89, 0.2);
  background: rgba(52, 199, 89, 0.04);
  padding: 8px 10px;
}

.item-modal__affix-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--accent-green, #34c759);
  margin-bottom: 6px;
}

.item-modal__affix-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: var(--font-size-xs);
}

.item-modal__affix-label {
  color: var(--text-muted);
}

.item-modal__affix-value {
  color: var(--accent-green, #34c759);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 信息段落 */
.item-modal__section {
  margin-bottom: 12px;
}

.item-modal__section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.item-modal__effect {
  font-size: var(--font-size-small);
  color: var(--accent-green);
  padding: 4px 0;
}

.item-modal__info-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: var(--font-size-small);
}

.item-modal__info-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.item-modal__info-value {
  color: var(--text-primary);
}

/* 底部 */
.item-modal__footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-bottom: 12px;
}

/* ── 操作按钮区 ── */
.item-modal__actions {
  display: flex;
  gap: 8px;
}

.item-modal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.item-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-modal__btn--use {
  background: var(--accent-blue);
  color: #fff;
}

.item-modal__btn--use:hover:not(:disabled) {
  background: var(--accent-blue-dark);
}

.item-modal__btn--discard {
  background: rgba(255, 59, 48, 0.1);
  color: var(--accent-red);
}

.item-modal__btn--discard:hover:not(:disabled) {
  background: rgba(255, 59, 48, 0.2);
}

.item-modal__btn--confirm {
  flex: 1;
}

.item-modal__btn--cancel {
  background: rgba(128, 128, 128, 0.12);
  color: var(--text-muted);
}

.item-modal__btn--cancel:hover {
  background: rgba(128, 128, 128, 0.2);
}

/* ── 数量选择器 ── */
.item-modal__quantity {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.item-modal__quantity-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-bottom: 8px;
}

.item-modal__quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.item-modal__quantity-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-modal__quantity-actions {
  display: flex;
  gap: 6px;
}

.item-modal__btn--sm {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
}

.item-modal__qty-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.item-modal__qty-btn:hover {
  background: rgba(128, 128, 128, 0.16);
}

.item-modal__qty-input {
  width: 48px;
  height: 32px;
  text-align: center;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  font-size: var(--font-size-small);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  outline: none;
  -moz-appearance: textfield;
}

.item-modal__qty-input::-webkit-outer-spin-button,
.item-modal__qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.item-modal__qty-input:focus {
  border-color: var(--accent-blue);
}

/* ── 丢弃二次确认 ── */
.item-modal__confirm {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 59, 48, 0.06);
  border: 1px solid rgba(255, 59, 48, 0.15);
}

.item-modal__confirm-text {
  font-size: var(--font-size-small);
  margin-bottom: 10px;
  line-height: 1.5;
}

.item-modal__confirm-actions {
  display: flex;
  gap: 8px;
}

/* ── 过渡动画 ── */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .item-modal,
.modal-leave-to .item-modal {
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>