<template>
  <component :is="as" class="ui-panel" :class="panelClasses">
    <div v-if="title || $slots.header" class="ui-panel__header">
      <slot name="header">
        <h2 class="ui-panel__title">{{ title }}</h2>
      </slot>
    </div>
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PanelPadding = 'none' | 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  as?: string
  title?: string
  padding?: PanelPadding
  elevated?: boolean
  scroll?: boolean
  stretch?: boolean
}>(), {
  as: 'div',
  title: undefined,
  padding: 'md',
  elevated: false,
  scroll: true,
  stretch: false
})

/** 生成玻璃面板的间距、滚动和层级类名。 */
const panelClasses = computed(() => [
  `ui-panel--padding-${props.padding}`,
  {
    'ui-panel--elevated': props.elevated,
    'ui-panel--scroll': props.scroll,
    'ui-panel--stretch': props.stretch
  }
])
</script>
