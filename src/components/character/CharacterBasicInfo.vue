<!--
  CharacterBasicInfo.vue
  角色基本信息展示组件
  显示角色名称、等级、职业等基础信息
-->
<template>
  <div class="char-basic">
    <div class="char-basic__header">
      <div
        class="char-basic__avatar"
        :style="{ background: jobConfig.color }"
      >
        <component :is="jobIcon" :size="22" :stroke-width="1.5" />
      </div>
      <div class="char-basic__info">
        <div class="char-basic__name">{{ character.characterName }}</div>
        <div class="char-basic__meta">
          <span class="char-basic__level">Lv.{{ character.level }}</span>
          <span
            class="char-basic__job-tag"
            :style="{
              background: jobConfig.colorLight,
              color: jobConfig.color
            }"
          >
            {{ jobConfig.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Sword, Sparkles, Target } from 'lucide-vue-next'
import type { CharacterInfo } from '../../api/character'
import { getJobConfigByProfession } from '../../config/job_config'

/**
 * 角色基本信息组件
 * @param character - 角色完整数据
 */

interface Props {
  character: CharacterInfo
}

const props = defineProps<Props>()

/**
 * 获取职业配置
 */
const jobConfig = computed(() => {
  return getJobConfigByProfession(props.character.profession)
})

/**
 * 获取职业图标组件
 */
const jobIcon = computed<Component>(() => {
  const iconMap: Record<number, Component> = {
    1: Sword,    // 战士
    2: Sparkles, // 法师
    3: Target    // 猎人
  }
  return iconMap[props.character.profession] || Sword
})
</script>

<style scoped>
.char-basic {
  padding-bottom: 12px;
}

.char-basic__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-basic__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.char-basic__info {
  flex: 1;
  min-width: 0;
}

.char-basic__name {
  font-size: var(--font-size-base, 17px);
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.char-basic__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.char-basic__level {
  font-size: var(--font-size-small, 14px);
  font-weight: 500;
  color: var(--text-muted, rgba(0, 0, 0, 0.56));
}

.char-basic__job-tag {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>