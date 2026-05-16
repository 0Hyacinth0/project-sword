<template>
  <div class="action-panel" v-if="visible">
    <div class="action-header">
      <span class="actor-name">{{ actorName }} 的回合</span>
      <span class="phase-tag">{{ phaseLabel }}</span>
    </div>

    <!-- 普通攻击 / 防御 / 逃跑 -->
    <div class="action-row">
      <button class="action-btn attack" @click="$emit('action', { type: 'attack', actorUid: actorUid, targetUid: selectedTargetUid ?? undefined })" :disabled="!selectedTargetUid">
        ⚔ 攻击
      </button>
      <button class="action-btn defend" @click="$emit('action', { type: 'defend', actorUid })">
        🛡 防御
      </button>
      <button class="action-btn flee" @click="$emit('action', { type: 'flee', actorUid })">
        🏃 逃跑
      </button>
    </div>

    <!-- 技能选择 -->
    <div class="skill-section" v-if="skills.length > 0">
      <div class="section-label">技能</div>
      <div class="skill-grid">
        <button
          v-for="skill in skills"
          :key="skill.id"
          class="skill-btn"
          :class="{ disabled: isSkillDisabled(skill) }"
          :disabled="isSkillDisabled(skill)"
          @click="handleSkillClick(skill)"
        >
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-meta">
            <span v-if="skill.mpCost" class="mp-cost">{{ skill.mpCost }} MP</span>
            <span v-if="getCooldown(skill.id) > 0" class="cooldown">CD: {{ getCooldown(skill.id) }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- 目标选择 -->
    <div class="target-section" v-if="targets.length > 0">
      <div class="section-label">选择目标</div>
      <div class="target-list">
        <button
          v-for="target in targets"
          :key="target.uid"
          class="target-btn"
          :class="{ selected: selectedTargetUid === target.uid }"
          @click="setSelectedTarget(target.uid)"
        >
          <span class="target-name">{{ target.name }}</span>
          <span class="target-hp">HP: {{ target.stats.hp }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BattlePhase } from '../../types/battle'
import type { BattleAction, BattleSkill, Combatant } from '../../types/battle'

const props = defineProps<{
  visible: boolean
  actorUid: string
  actorName: string
  phase: BattlePhase
  skills: BattleSkill[]
  targets: Combatant[]
  cooldowns: Record<string, number>
  currentMp: number
  modelValue?: string | null
}>()

const emit = defineEmits<{
  action: [action: BattleAction]
  'update:modelValue': [targetUid: string | null]
}>()

const selectedTargetUid = ref<string | null>(null)

const phaseLabel = computed(() => {
  switch (props.phase) {
    case BattlePhase.ACTION_SELECT: return '行动选择'
    case BattlePhase.BUFF_SETTLEMENT: return 'Buff结算'
    case BattlePhase.SETTLEMENT: return '结算中'
    default: return ''
  }
})

/**
 * 判断技能当前是否不可用。
 * @param skill 需要检查可用性的战斗技能。
 * @returns 技能为被动、MP 不足或仍在冷却时返回 true，否则返回 false。
 */
function isSkillDisabled(skill: BattleSkill): boolean {
  if (skill.type === 'passive') return true
  if (skill.mpCost && props.currentMp < skill.mpCost) return true
  if (getCooldown(skill.id) > 0) return true
  return false
}

/**
 * 获取指定技能的剩余冷却回合。
 * @param skillId 需要查询冷却的技能 ID。
 * @returns 剩余冷却回合数；没有冷却记录时返回 0。
 */
function getCooldown(skillId: number): number {
  return props.cooldowns[String(skillId)] ?? 0
}

/**
 * 同步当前选中的目标，并通知外部 v-model。
 * @param targetUid 目标单位 uid，传入 null 表示清空选择。
 * @returns 无返回值。
 */
function setSelectedTarget(targetUid: string | null): void {
  selectedTargetUid.value = targetUid
  emit('update:modelValue', targetUid)
}

/**
 * 处理技能按钮点击并派发技能行动。
 * @param skill 被点击的战斗技能。
 * @returns 无返回值。
 */
function handleSkillClick(skill: BattleSkill): void {
  if (isSkillDisabled(skill)) return
  emit('action', {
    type: 'skill',
    actorUid: props.actorUid,
    skillId: skill.id,
    targetUid: selectedTargetUid.value ?? undefined
  })
}

watch(() => props.modelValue, (targetUid) => {
  selectedTargetUid.value = targetUid ?? null
}, { immediate: true })

// 自动选中第一个目标
watch(() => props.targets, (targets) => {
  if (targets.length > 0 && !targets.find(t => t.uid === selectedTargetUid.value)) {
    setSelectedTarget(targets[0].uid)
  }
}, { immediate: true })
</script>

<style scoped>
.action-panel {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--bg-panel);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-elevated);
}

/* ── 头部 ── */
.action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.actor-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.phase-tag {
  font-size: var(--font-size-caption);
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 4px;
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

/* ── 基础行动按钮 ── */
.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 12px;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--bg-panel-light);
  color: var(--text-primary);
}

.action-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.attack { border-color: rgba(255, 59, 48, 0.3); }
.action-btn.attack:hover:not(:disabled) { background: rgba(255, 59, 48, 0.08); }

.action-btn.defend { border-color: rgba(0, 113, 227, 0.3); }
.action-btn.defend:hover:not(:disabled) { background: rgba(0, 113, 227, 0.08); }

.action-btn.flee { border-color: rgba(245, 158, 11, 0.3); }
.action-btn.flee:hover:not(:disabled) { background: rgba(245, 158, 11, 0.08); }

/* ── 技能区域 ── */
.section-label {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.skill-section {
  margin-bottom: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.skill-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-panel-light);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.skill-btn:hover:not(.disabled) {
  border-color: var(--accent-blue);
  background: rgba(0, 113, 227, 0.06);
  transform: translateY(-1px);
}

.skill-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.skill-name {
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.skill-meta {
  display: flex;
  gap: 8px;
  font-size: var(--font-size-caption);
}

.mp-cost { color: var(--accent-blue); }
.cooldown { color: var(--accent-gold); }

/* ── 目标选择 ── */
.target-section {
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.target-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.target-btn {
  padding: 6px 14px;
  min-width: 0;
  max-width: 100%;
  font-size: var(--font-size-small);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-panel-light);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-wrap: anywhere;
}

.target-btn:hover { background: rgba(255, 59, 48, 0.06); }

.target-btn.selected {
  border-color: var(--accent-red);
  background: rgba(255, 59, 48, 0.1);
  color: var(--accent-red);
  font-weight: 500;
}

.target-name {
  min-width: 0;
}

.target-hp {
  flex: 0 0 auto;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.target-btn.selected .target-hp { color: var(--accent-red); }

/* ── 响应式 ── */
@media (max-width: 720px) {
  .action-panel { padding: 12px 14px; }
  .action-row { flex-wrap: wrap; }
  .action-btn { min-width: calc(33% - 6px); }
  .skill-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
