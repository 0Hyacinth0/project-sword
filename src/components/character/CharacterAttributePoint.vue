<!--
  CharacterAttributePoint.vue
  属性加点组件
  提供属性点分配预览和确认功能
-->
<template>
  <div class="char-allocate">
    <!-- 可用点数提示 -->
    <div class="char-allocate__header">
      <span class="char-allocate__points">可用点数: {{ availablePoints }}</span>
    </div>

    <!-- 属性加点控制 -->
    <div class="char-allocate__attrs">
      <!-- 力量 -->
      <div class="char-allocate__attr">
        <span class="char-allocate__label">力量</span>
        <div class="char-allocate__control">
          <button
            class="char-allocate__btn"
            :disabled="pending.str <= 0"
            @click="adjust('str', -1)"
          >
            <Minus :size="14" />
          </button>
          <span class="char-allocate__value">
            {{ strength + pending.str }}
            <span v-if="pending.str > 0" class="char-allocate__add">+{{ pending.str }}</span>
          </span>
          <button
            class="char-allocate__btn"
            :disabled="remainingPoints <= 0"
            @click="adjust('str', 1)"
          >
            <Plus :size="14" />
          </button>
        </div>
      </div>

      <!-- 智力 -->
      <div class="char-allocate__attr">
        <span class="char-allocate__label">智力</span>
        <div class="char-allocate__control">
          <button
            class="char-allocate__btn"
            :disabled="pending.int <= 0"
            @click="adjust('int', -1)"
          >
            <Minus :size="14" />
          </button>
          <span class="char-allocate__value">
            {{ intelligence + pending.int }}
            <span v-if="pending.int > 0" class="char-allocate__add">+{{ pending.int }}</span>
          </span>
          <button
            class="char-allocate__btn"
            :disabled="remainingPoints <= 0"
            @click="adjust('int', 1)"
          >
            <Plus :size="14" />
          </button>
        </div>
      </div>

      <!-- 敏捷 -->
      <div class="char-allocate__attr">
        <span class="char-allocate__label">敏捷</span>
        <div class="char-allocate__control">
          <button
            class="char-allocate__btn"
            :disabled="pending.agi <= 0"
            @click="adjust('agi', -1)"
          >
            <Minus :size="14" />
          </button>
          <span class="char-allocate__value">
            {{ agility + pending.agi }}
            <span v-if="pending.agi > 0" class="char-allocate__add">+{{ pending.agi }}</span>
          </span>
          <button
            class="char-allocate__btn"
            :disabled="remainingPoints <= 0"
            @click="adjust('agi', 1)"
          >
            <Plus :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 确认/取消按钮 -->
    <div class="char-allocate__actions">
      <button class="char-allocate__cancel" @click="$emit('cancel')">
        取消
      </button>
      <button
        class="char-allocate__confirm"
        :disabled="totalAllocated === 0"
        @click="handleConfirm"
      >
        确认加点
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Plus, Minus } from 'lucide-vue-next'

/**
 * 属性加点组件
 * @param availablePoints - 可用点数
 * @param strength - 当前力量值
 * @param intelligence - 当前智力值
 * @param agility - 当前敏捷值
 * @emits confirm - 确认加点，返回分配的点数
 * @emits cancel - 取消加点
 */

interface Props {
  availablePoints: number
  strength: number
  intelligence: number
  agility: number
}

interface Emits {
  (e: 'confirm', points: { str: number; int: number; agi: number }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 待分配点数 */
const pending = reactive({
  str: 0,
  int: 0,
  agi: 0
})

/** 已分配总数 */
const totalAllocated = computed(() => pending.str + pending.int + pending.agi)

/** 剩余可用点数 */
const remainingPoints = computed(() => props.availablePoints - totalAllocated.value)

/**
 * 调整属性点数
 */
function adjust(attr: 'str' | 'int' | 'agi', delta: number) {
  pending[attr] = Math.max(0, pending[attr] + delta)
}

/**
 * 确认加点
 */
function handleConfirm() {
  if (totalAllocated.value === 0) return
  emit('confirm', {
    str: pending.str,
    int: pending.int,
    agi: pending.agi
  })
  // 重置待分配点数
  pending.str = 0
  pending.int = 0
  pending.agi = 0
}
</script>

<style scoped>
.char-allocate {
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 113, 227, 0.08);
}

.char-allocate__header {
  margin-bottom: 10px;
}

.char-allocate__points {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  color: var(--accent-blue, #0071e3);
}

.char-allocate__attrs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.char-allocate__attr {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.char-allocate__label {
  font-size: var(--font-size-small, 14px);
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.char-allocate__control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-allocate__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.3));
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary, #1d1d1f);
  cursor: pointer;
  transition: background 0.2s ease;
}

.char-allocate__btn:hover:not(:disabled) {
  background: rgba(0, 113, 227, 0.1);
}

.char-allocate__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.char-allocate__value {
  font-size: var(--font-size-small, 14px);
  font-weight: 600;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.char-allocate__add {
  color: var(--accent-green, #34c759);
  font-size: var(--font-size-xs, 12px);
}

.char-allocate__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.char-allocate__cancel,
.char-allocate__confirm {
  padding: 6px 12px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.char-allocate__cancel {
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.3));
  background: transparent;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.char-allocate__cancel:hover {
  background: rgba(0, 0, 0, 0.04);
}

.char-allocate__confirm {
  border: none;
  background: var(--accent-blue, #0071e3);
  color: #fff;
}

.char-allocate__confirm:hover:not(:disabled) {
  filter: brightness(1.1);
}

.char-allocate__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>