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

<style scoped>
.levelup-effect {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 光芒扩散 */
.levelup-effect__burst {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.6) 0%, rgba(255, 214, 10, 0.3) 40%, transparent 70%);
  transition: width 0.6s ease-out, height 0.6s ease-out;
}

.levelup-effect__burst--active {
  width: 600px;
  height: 600px;
}

/* 粒子 */
.levelup-effect__particles {
  position: absolute;
  width: 0;
  height: 0;
}

.levelup-effect__particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: var(--color);
  animation: particleFly 1s ease-out forwards;
  animation-delay: var(--delay);
  transform: rotate(var(--angle)) translateX(0);
}

@keyframes particleFly {
  0% {
    transform: rotate(var(--angle)) translateX(0);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateX(var(--distance));
    opacity: 0;
  }
}

/* 升级文字 */
.levelup-effect__text {
  position: relative;
  z-index: 1;
  text-align: center;
  opacity: 0;
  transform: scale(0.8) translateY(20px);
  transition: opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s;
}

.levelup-effect__text--active {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.levelup-effect__label {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-gold, #f59e0b);
  letter-spacing: 4px;
  text-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  animation: labelPulse 0.8s ease infinite alternate;
}

@keyframes labelPulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

.levelup-effect__level {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 48px;
  font-weight: 800;
}

.levelup-effect__old {
  color: rgba(255, 255, 255, 0.5);
  font-size: 32px;
}

.levelup-effect__arrow {
  color: var(--accent-gold, #f59e0b);
  animation: arrowBounce 0.6s ease infinite alternate;
}

@keyframes arrowBounce {
  from { transform: translateX(-4px); }
  to { transform: translateX(4px); }
}

.levelup-effect__new {
  color: #fff;
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4);
  animation: newLevelGlow 0.8s ease infinite alternate;
}

@keyframes newLevelGlow {
  from { text-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4); }
  to { text-shadow: 0 0 30px rgba(245, 158, 11, 1), 0 0 60px rgba(245, 158, 11, 0.6); }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .levelup-effect__burst {
    background: radial-gradient(circle, rgba(245, 158, 11, 0.7) 0%, rgba(255, 214, 10, 0.4) 40%, transparent 70%);
  }

  .levelup-effect__old {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>