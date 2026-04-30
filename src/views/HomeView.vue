<!-- 游戏主页 - 三栏布局 -->
<template>
  <div class="game-home">
    <!-- 顶部通栏 -->
    <header class="game-header">
      <div class="game-header__left">
        <Swords :size="20" :stroke-width="1.5" class="game-header__logo" />
        <span class="game-header__title">剑之传说</span>
      </div>
      <div class="game-header__center" @mouseenter="pauseAnnouncement" @mouseleave="resumeAnnouncement">
        <Transition name="announce" mode="out-in">
          <div class="announcement" :key="currentAnnouncement.id">
            <component :is="currentAnnouncement.icon" :size="14" class="announcement__icon" :style="{ color: currentAnnouncement.color }" />
            <span class="announcement__text">{{ currentAnnouncement.text }}</span>
          </div>
        </Transition>
      </div>
      <div class="game-header__right">
        <button class="game-header__btn game-header__btn--round" title="退出登录" @click="handleLogout">
          <LogOut :size="16" :stroke-width="1.8" />
        </button>
        <ThemeToggle />
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="game-loading game-panel">
      <Loader2 :size="28" class="game-loading__spinner" />
      <span>正在加载角色数据...</span>
    </div>

    <div v-else class="game-body">
      <!-- ═══ 左侧面板 ═══ -->
      <div class="game-left">
        <!-- 装备栏 -->
        <div class="game-panel">
          <div class="game-panel__title">装备栏</div>
          <div class="equipment-grid">
            <!-- 武器 -->
            <div class="equip-slot" title="武器">
              <Sword :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">武器</span>
            </div>
            <!-- 头盔 -->
            <div class="equip-slot" title="头盔">
              <Crown :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">头盔</span>
            </div>
            <!-- 胸甲 -->
            <div class="equip-slot" title="胸甲">
              <Shield :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">胸甲</span>
            </div>
            <!-- 护腿 -->
            <div class="equip-slot" title="护腿">
              <Footprints :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">护腿</span>
            </div>
            <!-- 饰品1 -->
            <div class="equip-slot" title="饰品">
              <Gem :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">饰品</span>
            </div>
            <!-- 饰品2 -->
            <div class="equip-slot" title="饰品">
              <Gem :size="20" class="equip-slot__icon" />
              <span class="equip-slot__label">饰品</span>
            </div>
          </div>
        </div>

        <!-- 角色详情 -->
        <div class="game-panel">
          <div class="game-panel__title">角色信息</div>
          <template v-if="charDetail">
            <!-- 头部信息 -->
            <div class="char-info__header">
              <div
                class="char-info__avatar"
                :style="{ background: jobConfig.color }"
              >
                <component :is="jobIcon" :size="22" :stroke-width="1.5" />
              </div>
              <div>
                <div class="char-info__name">{{ charDetail.characterName }}</div>
                <div class="char-info__meta">
                  <span>Lv.{{ charDetail.level }}</span>
                  <span
                    class="char-info__job-tag"
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

            <!-- HP条 -->
            <div class="stat-bar">
              <div class="stat-bar__header">
                <span class="stat-bar__label" style="color: var(--accent-green)">HP</span>
                <span class="stat-bar__value">{{ charDetail.hp }} / {{ charDetail.maxHp }}</span>
              </div>
              <div class="stat-bar__track">
                <div
                  class="stat-bar__fill stat-bar__fill--hp"
                  :class="{
                    'low': hpPercent < 25,
                    'warning': hpPercent >= 25 && hpPercent < 50
                  }"
                  :style="{ width: hpPercent + '%' }"
                />
              </div>
            </div>

            <!-- MP条 -->
            <div class="stat-bar">
              <div class="stat-bar__header">
                <span class="stat-bar__label" style="color: var(--accent-blue)">MP</span>
                <span class="stat-bar__value">{{ charDetail.mp }} / {{ charDetail.maxMp }}</span>
              </div>
              <div class="stat-bar__track">
                <div
                  class="stat-bar__fill stat-bar__fill--mp"
                  :style="{ width: mpPercent + '%' }"
                />
              </div>
            </div>

            <!-- 经验条 -->
            <div class="stat-bar">
              <div class="stat-bar__header">
                <span class="stat-bar__label" style="color: var(--accent-gold)">EXP</span>
                <span class="stat-bar__value">{{ charDetail.experience }} / {{ charDetail.nextLevelExp }}</span>
              </div>
              <div class="stat-bar__track">
                <div
                  class="stat-bar__fill stat-bar__fill--exp"
                  :style="{ width: expPercent + '%' }"
                />
              </div>
            </div>

            <!-- 属性面板 -->
            <div style="margin-top: 12px">
              <div class="game-panel__title">属性</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-item__label">力量</span>
                  <span class="stat-item__value">{{ charDetail.strength }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">智力</span>
                  <span class="stat-item__value">{{ charDetail.intelligence }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">敏捷</span>
                  <span class="stat-item__value">{{ charDetail.agility }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">物攻</span>
                  <span class="stat-item__value">{{ charDetail.physicalAttack }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">魔攻</span>
                  <span class="stat-item__value">{{ charDetail.magicAttack }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">防御</span>
                  <span class="stat-item__value">{{ charDetail.defense }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">闪避</span>
                  <span class="stat-item__value">{{ (charDetail.dodgeRate * 100).toFixed(1) }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item__label">暴击</span>
                  <span class="stat-item__value">{{ (charDetail.criticalRate * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="char-info__empty">
            <span style="color: var(--text-muted)">未选择角色</span>
          </div>
        </div>
      </div>

      <!-- ═══ 中间面板 ═══ -->
      <div class="game-center">
        <div class="game-panel game-main">
          <div class="game-main__welcome">
            欢迎，{{ auth.user?.username }}
          </div>
          <p class="game-main__desc">
            这里是您的冒险起点。选择角色后，您可以探索世界、挑战副本、与其他玩家对战。
          </p>
          <div class="game-main__actions">
            <button class="game-main__btn game-main__btn--primary">
              <Map :size="16" />
              开始探索
            </button>
            <button class="game-main__btn game-main__btn--secondary">
              <Swords :size="16" />
              进入副本
            </button>
          </div>
        </div>

        <!-- 底部快捷导航 -->
        <div class="game-bottom-nav">
          <div class="game-panel">
            <Map :size="16" />
            <span>地图</span>
          </div>
          <div class="game-panel">
            <Swords :size="16" />
            <span>战斗</span>
          </div>
          <div class="game-panel">
            <Users :size="16" />
            <span>组队</span>
          </div>
          <div class="game-panel">
            <Store :size="16" />
            <span>商店</span>
          </div>
        </div>
      </div>

      <!-- ═══ 右侧面板 ═══ -->
      <div class="game-right">
        <div class="game-panel" style="display: flex; flex-direction: column">
          <div class="game-panel__title">背包</div>
          <!-- 标签切换 -->
          <div class="backpack-tabs">
            <button
              class="backpack-tab backpack-tab--active"
            >
              全部
            </button>
            <button class="backpack-tab">装备</button>
            <button class="backpack-tab">消耗</button>
            <button class="backpack-tab">材料</button>
          </div>
          <!-- 背包网格 -->
          <div class="backpack-grid">
            <!-- 暂时显示空格子 -->
            <div
              v-for="i in 32"
              :key="i"
              class="backpack-cell backpack-cell--empty"
            />
          </div>
          <!-- 空背包提示 -->
          <div class="backpack-empty" style="display: none">
            <Package :size="32" class="backpack-empty__icon" />
            <span>背包空空如也</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCharacterStore } from '../stores/character'
import { getJobConfigByProfession } from '../config/job_config'
import ThemeToggle from '../components/ThemeToggle.vue'
import {
  Sword, Crown, Shield, Footprints, Gem,
  Map, Swords, Users, Store, Package,
  LogOut, Loader2, Sparkles, Target,
  Bell, Lightbulb, Trophy, Wrench
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const charStore = useCharacterStore()

const loading = ref(false)

/* ── 公告轮播 ── */
interface Announcement {
  id: number
  text: string
  icon: Component
  color: string
}

const announcements: Announcement[] = [
  { id: 1, text: '服务器将于 5 月 2 日 02:00-06:00 进行维护，请提前下线', icon: markRaw(Wrench), color: 'var(--accent-gold)' },
  { id: 2, text: '五一限时活动「勇者试炼」已开启，通关副本可获传说装备', icon: markRaw(Trophy), color: 'var(--accent-red)' },
  { id: 3, text: '当前在线冒险者：1,284 人', icon: markRaw(Users), color: 'var(--accent-green)' },
  { id: 4, text: '欢迎来到剑之传说！选择角色即可开始你的冒险之旅', icon: markRaw(Sparkles), color: 'var(--accent-blue)' },
  { id: 5, text: '小贴士：闪避率影响被攻击时的回避概率，敏捷属性可提升闪避', icon: markRaw(Lightbulb), color: 'var(--accent-gold)' },
  { id: 6, text: '公告：新赛季排位赛将于 5 月 5 日开放，敬请期待', icon: markRaw(Bell), color: 'var(--accent-blue)' },
]

const currentIndex = ref(0)
let announceTimer: ReturnType<typeof setInterval> | null = null

/**
 * 当前显示的公告
 */
const currentAnnouncement = computed(() => announcements[currentIndex.value])

/**
 * 切换到下一条公告
 */
function nextAnnouncement() {
  currentIndex.value = (currentIndex.value + 1) % announcements.length
}

/**
 * 鼠标悬停时暂停轮播
 */
function pauseAnnouncement() {
  if (announceTimer) {
    clearInterval(announceTimer)
    announceTimer = null
  }
}

/**
 * 鼠标离开时恢复轮播
 */
function resumeAnnouncement() {
  startAnnouncementTimer()
}

/**
 * 启动公告轮播定时器
 */
function startAnnouncementTimer() {
  if (announceTimer) clearInterval(announceTimer)
  announceTimer = setInterval(nextAnnouncement, 4000)
}

/**
 * 获取角色详情数据
 */
const charDetail = computed(() => charStore.characterDetail)

/**
 * 获取职业配置
 */
const jobConfig = computed(() => {
  if (!charDetail.value) return getJobConfigByProfession(1)
  return getJobConfigByProfession(charDetail.value.profession)
})

/**
 * 获取职业图标组件
 */
const jobIcon = computed<Component>(() => {
  const iconMap: Record<number, Component> = {
    1: Sword,
    2: Sparkles,
    3: Target
  }
  return iconMap[charDetail.value?.profession || 1]
})

/**
 * HP百分比
 */
const hpPercent = computed(() => {
  if (!charDetail.value) return 100
  return Math.max(0, Math.min(100, (charDetail.value.hp / charDetail.value.maxHp) * 100))
})

/**
 * MP百分比
 */
const mpPercent = computed(() => {
  if (!charDetail.value) return 100
  return Math.max(0, Math.min(100, (charDetail.value.mp / charDetail.value.maxMp) * 100))
})

/**
 * 经验百分比
 */
const expPercent = computed(() => {
  if (!charDetail.value) return 0
  return Math.max(0, Math.min(100, (charDetail.value.experience / charDetail.value.nextLevelExp) * 100))
})

/**
 * 退出登录
 */
function handleLogout() {
  auth.logout()
  charStore.clear()
  router.push({ name: 'login' })
}

/**
 * 加载角色详情
 */
async function loadCharacterDetail() {
  const characterId = charStore.selectedCharacterId
  if (!characterId) {
    router.push({ name: 'characters' })
    return
  }
  loading.value = true
  await charStore.fetchCharacterDetail(characterId)
  loading.value = false
}

onMounted(() => {
  loadCharacterDetail()
  startAnnouncementTimer()
})

onUnmounted(() => {
  if (announceTimer) clearInterval(announceTimer)
})
</script>

<style scoped>
@import '../assets/styles/home.css';
</style>

<style>
/* 在 header 中覆盖 ThemeToggle 的 fixed 定位和尺寸 */
.game-header__right .theme-toggle {
  position: static;
}

.game-header__right .theme-toggle__btn {
  width: 36px;
  height: 36px;
  border-radius: 980px;
}

.game-header__right .theme-toggle__btn:hover {
  transform: scale(1.08) rotate(15deg);
}
</style>