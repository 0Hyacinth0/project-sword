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
          @click="selectedTargetUid = target.uid"
        >
          {{ target.name }}
          <span class="target-hp">HP: {{ target.stats.hp }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
}>()

const emit = defineEmits<{
  action: [action: BattleAction]
}>()

const selectedTargetUid = ref<string | null>(null)

/** 阶段标签 */
const phaseLabel = (() => {
  switch (props.phase) {
    case BattlePhase.ACTION_SELECT: return '行动选择'
    case BattlePhase.BUFF_SETTLEMENT: return 'Buff结算'
    case BattlePhase.SETTLEMENT: return '结算中'
    default: return ''
  }
})()

/** 检查技能是否不可用（MP不足或冷却中） */
function isSkillDisabled(skill: BattleSkill): boolean {
  if (skill.type === 'passive') return true
  if (skill.mpCost && props.currentMp < skill.mpCost) return true
  if (getCooldown(skill.id) > 0) return true
  return false
}

/** 获取技能冷却 */
function getCooldown(skillId: number): number {
  return props.cooldowns[String(skillId)] ?? 0
}

/** 处理技能点击 */
function handleSkillClick(skill: BattleSkill) {
  if (isSkillDisabled(skill)) return
  emit('action', {
    type: 'skill',
    actorUid: props.actorUid,
    skillId: skill.id,
    targetUid: selectedTargetUid.value ?? undefined
  })
}

// 自动选中第一个目标
watch(() => props.targets, (targets) => {
  if (targets.length > 0 && !targets.find(t => t.uid === selectedTargetUid.value)) {
    selectedTargetUid.value = targets[0].uid
  }
}, { immediate: true })
</script>
