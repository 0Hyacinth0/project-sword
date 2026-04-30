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
import { getRarityColor, getRarityLabel, getCategoryIcon, getCategoryLabel } from '../../config/item_config'

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
}

interface Emits {
  (e: 'close'): void
  (e: 'use', inventoryId: string, quantity: number): void
  (e: 'discard', inventoryId: string, quantity: number): void
}

const props = withDefaults(defineProps<Props>(), {
  actionLoading: false
})
const emit = defineEmits<Emits>()

/** 当前展开的操作类型 */
const activeAction = ref<'use' | 'discard' | null>(null)

/** 选择的数量 */
const selectedQuantity = ref(1)

/** 丢弃二次确认 */
const showDiscardConfirm = ref(false)

/** 稀有度颜色 */
const rarityColor = computed(() => {
  if (!props.item) return '#6e6e73'
  return getRarityColor(props.item.item.rarity)
})

/** 稀有度背景色（半透明） */
const rarityBg = computed(() => {
  if (!props.item) return 'transparent'
  return getRarityColor(props.item.item.rarity) + '14'
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