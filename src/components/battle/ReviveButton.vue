<template>
  <div class="revive-panel" v-if="visible && deadAllies.length > 0 && canRevive">
    <button
      class="revive-btn"
      :disabled="currentMp < mpCost"
      @click="showTargetSelect = true"
    >
      <span class="revive-icon">⚡</span>
      复活队友
      <span class="revive-count">{{ reviveCount }}/{{ maxRevives }}</span>
    </button>

    <!-- 目标选择弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTargetSelect" class="revive-modal" @click.self="showTargetSelect = false">
          <div class="revive-modal__card">
            <h3 class="revive-modal__title">选择复活目标</h3>
            <div class="revive-modal__list">
              <button
                v-for="ally in deadAllies"
                :key="ally.uid"
                class="revive-modal__item"
                @click="handleRevive(ally.uid)"
              >
                <span class="ally-name">{{ ally.name }}</span>
                <span class="ally-info">HP 0/{{ ally.stats.maxHp }}</span>
              </button>
            </div>
            <button class="revive-modal__cancel" @click="showTargetSelect = false">取消</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Combatant } from '../../types/battle'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
  /** 死亡的友方单位 */
  deadAllies: Combatant[]
  /** 当前 MP */
  currentMp: number
  /** 复活消耗 MP */
  mpCost: number
  /** 已使用复活次数 */
  reviveCount: number
  /** 最大复活次数 */
  maxRevives: number
}>()

const emit = defineEmits<{
  /** 执行复活 */
  revive: [targetUid: string]
}>()

const showTargetSelect = ref(false)

const canRevive = computed(() => props.reviveCount < props.maxRevives)

function handleRevive(targetUid: string) {
  emit('revive', targetUid)
  showTargetSelect.value = false
}
</script>

<style scoped>
.revive-panel {
  margin-top: 8px;
}

.revive-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(52, 199, 89, 0.3);
  background: rgba(52, 199, 89, 0.12);
  color: var(--accent-green);
  font-size: var(--font-size-caption);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.revive-btn:hover:not(:disabled) {
  background: rgba(52, 199, 89, 0.2);
}

.revive-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.revive-icon {
  font-size: 14px;
}

.revive-count {
  font-size: 11px;
  opacity: 0.7;
}

/* ── Modal ── */
.revive-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.revive-modal__card {
  background: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 20px;
  min-width: 280px;
}

.revive-modal__title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  text-align: center;
}

.revive-modal__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.revive-modal__item {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.revive-modal__item:hover {
  background: rgba(52, 199, 89, 0.1);
}

.ally-name {
  font-weight: 600;
}

.ally-info {
  color: var(--text-muted);
  font-size: 11px;
}

.revive-modal__cancel {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: rgba(142, 142, 147, 0.1);
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  cursor: pointer;
}

/* ── Animation ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* ── 深色模式 ── */
[data-theme='dark'] .revive-modal__item {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .revive-modal__cancel {
  background: rgba(142, 142, 147, 0.15);
}
</style>