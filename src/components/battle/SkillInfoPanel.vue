<template>
  <div class="skill-info-panel" v-if="skills.length > 0">
    <div class="panel-header">
      <span class="panel-title">技能列表</span>
      <span class="skill-count">{{ activeCount }}/{{ skills.length }}</span>
    </div>
    <div class="skill-list">
      <div
        v-for="skill in skills"
        :key="skill.id"
        class="skill-card"
        :class="[skill.type, { passive: skill.type === 'passive' }]"
      >
        <div class="skill-header">
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-type-badge" :class="skill.type">{{ typeLabel(skill.type) }}</span>
        </div>
        <div class="skill-meta">
          <span v-if="skill.mpCost" class="meta-tag mp">MP {{ skill.mpCost }}</span>
          <span v-if="skill.cooldown" class="meta-tag cd">CD {{ skill.cooldown }}</span>
          <span v-if="skill.power" class="meta-tag power">威力 {{ skill.power }}%</span>
          <span v-if="skill.type === 'passive' && skill.passiveTrigger" class="meta-tag trigger">{{ triggerLabel(skill.passiveTrigger) }}</span>
        </div>
        <div class="skill-desc">{{ skill.description }}</div>
        <div class="skill-buff" v-if="skill.attachedBuff">
          <span class="buff-label" :class="{ debuff: skill.attachedBuff.isDebuff }">
            {{ skill.attachedBuff.isDebuff ? 'Debuff' : 'Buff' }}: {{ skill.attachedBuff.name }}
          </span>
          <span class="buff-detail">
            {{ buffStatLabel(skill.attachedBuff.stat) }} {{ skill.attachedBuff.value > 0 ? '+' : '' }}{{ skill.attachedBuff.value }} · {{ skill.attachedBuff.duration }} 回合
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillConfig } from '../../config/skill_config'
import type { PassiveTrigger } from '../../config/skill_config'

const props = defineProps<{
  skills: SkillConfig[]
}>()

const activeCount = computed(() => props.skills.filter(s => s.type !== 'passive').length)

/** 技能类型标签 */
function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    active_attack: '攻击',
    active_heal: '治疗',
    active_buff: '增益',
    passive: '被动'
  }
  return labels[type] ?? type
}

/** 被动触发时机标签 */
function triggerLabel(trigger: PassiveTrigger): string {
  const labels: Record<PassiveTrigger, string> = {
    on_battle_start: '战斗开始',
    on_turn_start: '回合开始',
    on_attack: '攻击时',
    on_attacked: '被攻击时',
    on_kill: '击杀时',
    on_hp_below_30: 'HP<30%',
    on_ally_death: '友方死亡',
    on_crit: '暴击时'
  }
  return labels[trigger] ?? trigger
}

/** Buff 属性名标签 */
function buffStatLabel(stat: string): string {
  const labels: Record<string, string> = {
    physicalAttack: '物攻',
    magicAttack: '魔攻',
    defense: '防御',
    speed: '速度',
    dodgeRate: '闪避率',
    criticalRate: '暴击率',
    maxHp: '生命'
  }
  return labels[stat] ?? stat
}
</script>

<style scoped>
.skill-info-panel {
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-subtle);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-title {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.skill-count {
  font-size: var(--font-size-caption);
  color: var(--accent-blue);
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.skill-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-panel-light);
  transition: all 0.2s ease;
}

.skill-card:hover {
  border-color: var(--accent-blue);
}

.skill-card.passive {
  border-left: 3px solid var(--accent-gold);
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.skill-name {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-primary);
}

.skill-type-badge {
  font-size: var(--font-size-caption);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.skill-type-badge.active_attack { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }
.skill-type-badge.active_heal { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
.skill-type-badge.active_buff { background: rgba(0, 113, 227, 0.1); color: var(--accent-blue); }
.skill-type-badge.passive { background: rgba(245, 158, 11, 0.1); color: var(--accent-gold); }

.skill-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.meta-tag {
  font-size: var(--font-size-caption);
  padding: 1px 5px;
  border-radius: 3px;
}

.meta-tag.mp { background: rgba(0, 113, 227, 0.08); color: var(--accent-blue); }
.meta-tag.cd { background: rgba(245, 158, 11, 0.08); color: var(--accent-gold); }
.meta-tag.power { background: rgba(255, 59, 48, 0.08); color: var(--accent-red); }
.meta-tag.trigger { background: rgba(175, 82, 222, 0.08); color: #af52de; }

.skill-desc {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  line-height: 1.4;
}

.skill-buff {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-caption);
}

.buff-label {
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(52, 199, 89, 0.08);
  color: var(--accent-green);
  font-weight: 500;
}

.buff-label.debuff {
  background: rgba(255, 59, 48, 0.08);
  color: var(--accent-red);
}

.buff-detail {
  color: var(--text-muted);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .skill-info-panel { padding: 10px 12px; }
  .panel-title { font-size: 10px; }
  .skill-count { font-size: 10px; }
  .skill-list { max-height: 220px; }
  .skill-card { padding: 8px 10px; }
  .skill-name { font-size: var(--font-size-caption); }
}

@media (max-width: 375px) {
  .skill-info-panel { padding: 8px 10px; border-radius: 12px; }
  .panel-header { margin-bottom: 6px; }
  .panel-title { font-size: 9px; letter-spacing: 0.1rem; }
  .skill-count { font-size: 9px; }
  .skill-list { gap: 4px; max-height: 180px; }
  .skill-card { padding: 6px 8px; border-radius: 8px; }
  .skill-header { margin-bottom: 2px; }
  .skill-name { font-size: 11px; }
  .skill-type-badge { font-size: 9px; padding: 1px 4px; }
  .skill-meta { gap: 4px; margin-bottom: 2px; }
  .meta-tag { font-size: 9px; padding: 1px 3px; }
  .skill-desc { font-size: 10px; line-height: 1.3; }
  .skill-buff { margin-top: 2px; gap: 4px; font-size: 9px; }
  .buff-label { padding: 1px 3px; }
  .buff-detail { font-size: 9px; }
}
</style>
