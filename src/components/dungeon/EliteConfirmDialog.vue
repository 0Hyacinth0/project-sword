<template>
  <UiModal
    :model-value="visible"
    :title="dungeonName"
    @update:model-value="handleModelUpdate"
  >
    <template #icon>
      <UiBadge tone="epic">精英</UiBadge>
    </template>

    <div class="elite-confirm__body">
      <p class="elite-confirm__desc">精英副本难度更高，怪物拥有以下增强：</p>
      <ul class="elite-confirm__list">
        <li>怪物属性额外提升 <strong>30%</strong></li>
        <li>怪物拥有<strong>专属技能</strong>（横扫、战意高昂、毒雾）</li>
        <li>Boss 层有<strong>精英专属掉落</strong></li>
      </ul>
    </div>

    <template #footer>
      <UiButton variant="secondary" block @click="emit('cancel')">取消</UiButton>
      <UiButton block @click="emit('confirm')">挑战精英</UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiModal } from '../ui'

/**
 * 精英副本进入确认弹窗
 * 提示玩家精英副本的额外难度与专属奖励
 */

defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 副本名称 */
  dungeonName: string
}>()

const emit = defineEmits<{
  /** 确认挑战 */
  confirm: []
  /** 取消 */
  cancel: []
}>()

/**
 * 处理弹窗 v-model 回写。
 * @param value - UiModal 传出的显示状态
 * @returns 无返回值
 */
function handleModelUpdate(value: boolean): void {
  if (!value) emit('cancel')
}
</script>

<style scoped>
/* ── 说明区 ── */
.elite-confirm__body {
  text-align: left;
}

.elite-confirm__desc {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin: 0 0 10px;
}

.elite-confirm__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.elite-confirm__list li {
  font-size: var(--font-size-small);
  color: var(--text-primary);
  padding: 6px 10px;
  background: color-mix(in srgb, var(--rarity-epic) 8%, transparent);
  border-radius: 8px;
  border-left: 3px solid color-mix(in srgb, var(--rarity-epic) 44%, transparent);
}

.elite-confirm__list li strong {
  color: var(--rarity-epic);
}
</style>
