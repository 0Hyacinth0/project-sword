<!--
  LevelUpEffect.vue
  升级成功庆祝动效组件
  包含粒子爆炸、光芒扩散、文字动画效果
-->
<template>
  <Teleport to="body">
    <div v-if="visible" class="levelup-effect" @click="handleClose">
      <!-- 光芒扩散背景 -->
      <div class="levelup-effect__burst" :class="{ 'levelup-effect__burst--active': active }" />

      <!-- 粒子效果 -->
      <div class="levelup-effect__particles">
        <div
          v-for="(p, i) in particles"
          :key="i"
          class="levelup-effect__particle"
          :style="p.style"
        />
      </div>

      <!-- 升级文字 -->
      <div class="levelup-effect__text" :class="{ 'levelup-effect__text--active': active }">
        <div class="levelup-effect__label">LEVEL UP</div>
        <div class="levelup-effect__level">
          <span class="levelup-effect__old">{{ oldLevel }}</span>
          <ArrowRight :size="24" class="levelup-effect__arrow" />
          <span class="levelup-effect__new">{{ newLevel }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight } from 'lucide-vue-next'

/**
 * 升级庆祝动效组件
 * @param visible - 是否显示
 * @param oldLevel - 升级前等级
 * @param newLevel - 升级后等级
 * @param duration - 动效持续时间（毫秒）
 * @emits close - 动效结束或点击关闭
 */

interface Props {
  visible: boolean
  oldLevel: number
  newLevel: number
  duration?: number
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2500
})
const emit = defineEmits<Emits>()

/** 动效激活状态 */
const active = ref(false)

/** 粒子列表 */
const particles = ref<Array<{ style: Record<string, string> }>>([])

/** 生成随机粒子 */
function generateParticles(count: number = 24) {
  const colors = ['#f59e0b', '#ffd60a', '#34c759', '#0071e3', '#ff6b35', '#af52de']
  const result: Array<{ style: Record<string, string> }> = []

  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i + Math.random() * 30
    const distance = 100 + Math.random() * 150
    const size = 4 + Math.random() * 8
    const color = colors[Math.floor(Math.random() * colors.length)]
    const delay = Math.random() * 0.3

    result.push({
      style: {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--size': `${size}px`,
        '--color': color,
        '--delay': `${delay}s`
      }
    })
  }

  return result
}

/** 自动关闭定时器 */
let closeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.visible) {
    // 延迟启动动画（等待 CSS 过渡准备）
    requestAnimationFrame(() => {
      active.value = true
      particles.value = generateParticles()
    })

    // 自动关闭
    closeTimer = setTimeout(() => {
      handleClose()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
})

/**
 * 关闭动效
 */
function handleClose() {
  active.value = false
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>
