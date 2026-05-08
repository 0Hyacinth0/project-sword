<template>
  <div class="battle-log" ref="logContainer">
    <!-- 头部：标题 + 控制 -->
    <div class="log-header">
      <div class="header-left">
        <span class="log-title">战斗日志</span>
        <span class="round-badge">R{{ currentRound }}</span>
        <span class="count-badge">{{ entries.length }}条</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" :class="{ active: showTimestamp }" @click="showTimestamp = !showTimestamp" title="显示时间">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        <button class="icon-btn" :class="{ active: groupByRound }" @click="groupByRound = !groupByRound" title="按回合分组">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <button class="icon-btn" @click="copyLog" title="复制日志">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.key"
        class="filter-btn"
        :class="{ active: activeFilter === filter.key }"
        @click="activeFilter = filter.key"
      >
        <span class="filter-icon">{{ filter.icon }}</span>
        <span class="filter-label">{{ filter.label }}</span>
        <span class="filter-count" v-if="filter.key !== 'all'">{{ getFilterCount(filter.key) }}</span>
      </button>
    </div>

    <!-- 日志内容 -->
    <div class="log-entries" ref="scrollContainer">
      <template v-if="groupByRound">
        <div
          v-for="group in groupedEntries"
          :key="group.round"
          class="round-group"
        >
          <div class="round-divider">
            <div class="divider-line"></div>
            <span class="divider-text">第 {{ group.round }} 回合</span>
            <div class="divider-line"></div>
          </div>
          <div
            v-for="(entry, index) in group.entries"
            :key="`${group.round}-${index}`"
            class="log-entry"
            :class="entry.type"
          >
            <span class="entry-icon">{{ typeIcon(entry.type) }}</span>
            <span class="entry-time" v-if="showTimestamp">{{ formatTime(entry.timestamp) }}</span>
            <span class="entry-badge" :class="entry.type">{{ typeLabel(entry.type) }}</span>
            <span class="entry-text">{{ entry.message }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div
          v-for="(entry, index) in filteredEntries"
          :key="index"
          class="log-entry"
          :class="entry.type"
        >
          <span class="entry-icon">{{ typeIcon(entry.type) }}</span>
          <span class="entry-round">R{{ entry.round }}</span>
          <span class="entry-time" v-if="showTimestamp">{{ formatTime(entry.timestamp) }}</span>
          <span class="entry-badge" :class="entry.type">{{ typeLabel(entry.type) }}</span>
          <span class="entry-text">{{ entry.message }}</span>
        </div>
      </template>
      <div v-if="filteredEntries.length === 0 && entries.length > 0" class="log-empty">
        当前筛选条件下无日志
      </div>
      <div v-if="entries.length === 0" class="log-empty">
        等待战斗开始...
      </div>
    </div>

    <!-- 复制成功提示 -->
    <Transition name="fade">
      <div v-if="showCopyToast" class="copy-toast">已复制到剪贴板</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { BattleLogEntry, LogEntryType } from '../../types/battle'

const props = defineProps<{
  /** 日志条目列表 */
  entries: BattleLogEntry[]
  /** 当前回合 */
  currentRound: number
}>()

// ── 状态 ──

/** 是否显示时间戳 */
const showTimestamp = ref(false)
/** 是否按回合分组 */
const groupByRound = ref(true)
/** 当前筛选类型 */
const activeFilter = ref<string>('all')
/** 复制成功提示 */
const showCopyToast = ref(false)

/** 滚动容器 */
const scrollContainer = ref<HTMLElement | null>(null)

// ── 筛选配置 ──

/** 筛选标签配置 */
const filters = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'damage', label: '伤害', icon: '⚔' },
  { key: 'heal', label: '治疗', icon: '💚' },
  { key: 'buff', label: 'Buff', icon: '✨' },
  { key: 'system', label: '系统', icon: '📢' }
]

/** 伤害相关类型 */
const damageTypes: LogEntryType[] = ['damage', 'critical', 'dodge', 'miss']
/** 治疗相关类型 */
const healTypes: LogEntryType[] = ['heal']
/** Buff 相关类型 */
const buffTypes: LogEntryType[] = ['buff']
/** 系统相关类型 */
const systemTypes: LogEntryType[] = ['system', 'action', 'death', 'flee', 'reward']

/**
 * 获取筛选类别下的日志数量
 * @param filterKey - 筛选类别 key
 * @returns 匹配的日志条数
 */
function getFilterCount(filterKey: string): number {
  const types = getFilterTypes(filterKey)
  return props.entries.filter(e => types.includes(e.type)).length
}

/**
 * 将筛选 key 映射到具体日志类型列表
 * @param key - 筛选 key
 * @returns 匹配的日志类型数组
 */
function getFilterTypes(key: string): LogEntryType[] {
  switch (key) {
    case 'damage': return damageTypes
    case 'heal': return healTypes
    case 'buff': return buffTypes
    case 'system': return systemTypes
    default: return []
  }
}

// ── 计算属性 ──

/** 经过筛选的日志条目 */
const filteredEntries = computed(() => {
  const slice = props.entries.slice(-100)
  if (activeFilter.value === 'all') return slice
  const types = getFilterTypes(activeFilter.value)
  return slice.filter(e => types.includes(e.type))
})

/** 按回合分组的日志条目 */
const groupedEntries = computed(() => {
  const filtered = filteredEntries.value
  const map = new Map<number, BattleLogEntry[]>()

  for (const entry of filtered) {
    const list = map.get(entry.round) ?? []
    list.push(entry)
    map.set(entry.round, list)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, entries]) => ({ round, entries }))
})

// ── 格式化 ──

/** 日志类型图标映射 */
const typeIconMap: Record<string, string> = {
  system: '📢',
  action: '⚡',
  damage: '⚔',
  heal: '💚',
  buff: '✨',
  death: '💀',
  dodge: '💨',
  critical: '💥',
  miss: '❌',
  flee: '🏃',
  reward: '🎁'
}

/** 日志类型标签映射 */
const typeLabelMap: Record<string, string> = {
  system: '系统',
  action: '行动',
  damage: '伤害',
  heal: '治疗',
  buff: '增益',
  death: '阵亡',
  dodge: '闪避',
  critical: '暴击',
  miss: '未命中',
  flee: '逃跑',
  reward: '奖励'
}

/**
 * 获取日志类型图标
 * @param type - 日志类型
 * @returns 对应图标
 */
function typeIcon(type: LogEntryType): string {
  return typeIconMap[type] ?? '📋'
}

/**
 * 获取日志类型标签
 * @param type - 日志类型
 * @returns 中文标签
 */
function typeLabel(type: LogEntryType): string {
  return typeLabelMap[type] ?? type
}

/**
 * 格式化时间戳为 mm:ss 格式
 * @param ts - 时间戳
 * @returns 格式化后的时间字符串
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ── 操作 ──

/**
 * 复制战斗日志到剪贴板
 */
async function copyLog(): Promise<void> {
  const lines = props.entries.map(e =>
    `[R${e.round}] [${typeLabel(e.type)}] ${e.message}`
  )
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    showCopyToast.value = true
    setTimeout(() => { showCopyToast.value = false }, 1500)
  } catch {
    // 剪贴板不可用时静默失败
  }
}

// ── 自动滚动 ──

watch(() => props.entries.length, async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
})
</script>

<style scoped>
.battle-log {
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--bg-panel-light);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  position: relative;
}

/* ── 头部 ── */
.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-title {
  font-size: var(--font-size-label);
  letter-spacing: 0.15rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 500;
}

.round-badge {
  font-size: var(--font-size-caption);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
}

.count-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-primary);
}

.icon-btn.active {
  background: rgba(0, 113, 227, 0.1);
  color: var(--accent-blue);
  border-color: rgba(0, 113, 227, 0.2);
}

/* ── 筛选栏 ── */
.filter-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  background: none;
  color: var(--text-muted);
  font-size: var(--font-size-caption);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
}

.filter-btn.active {
  background: rgba(0, 113, 227, 0.08);
  color: var(--accent-blue);
  border-color: rgba(0, 113, 227, 0.25);
  font-weight: 500;
}

.filter-icon {
  font-size: 12px;
}

.filter-label {
  font-size: var(--font-size-caption);
}

.filter-count {
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-muted);
  min-width: 16px;
  text-align: center;
}

.filter-btn.active .filter-count {
  background: rgba(0, 113, 227, 0.15);
  color: var(--accent-blue);
}

/* ── 日志内容 ── */
.log-entries {
  max-height: 240px;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding-right: 4px;
}

/* ── 回合分组 ── */
.round-group {
  margin-bottom: 4px;
}

.round-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0 4px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}

.divider-text {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ── 日志条目 ── */
.log-entry {
  padding: 4px 0;
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  line-height: 1.5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.log-entry:last-child {
  border-bottom: none;
}

.entry-icon {
  flex-shrink: 0;
  font-size: 11px;
  width: 14px;
  text-align: center;
  line-height: 1.5;
}

.entry-round {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.04);
  padding: 0 4px;
  border-radius: 3px;
  line-height: 1.6;
}

.entry-time {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-muted);
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
}

.entry-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  padding: 0 5px;
  border-radius: 3px;
  line-height: 1.7;
  white-space: nowrap;
}

.entry-badge.system { background: rgba(142, 142, 147, 0.1); color: #8e8e93; }
.entry-badge.action { background: rgba(0, 113, 227, 0.1); color: var(--accent-blue); }
.entry-badge.damage { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }
.entry-badge.heal { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
.entry-badge.buff { background: rgba(175, 82, 222, 0.1); color: #af52de; }
.entry-badge.death { background: rgba(255, 59, 48, 0.15); color: var(--accent-red); }
.entry-badge.dodge { background: rgba(142, 142, 147, 0.1); color: #8e8e93; }
.entry-badge.critical { background: rgba(255, 149, 0, 0.12); color: var(--accent-gold); }
.entry-badge.miss { background: rgba(142, 142, 147, 0.1); color: #8e8e93; }
.entry-badge.flee { background: rgba(255, 149, 0, 0.1); color: var(--accent-gold); }
.entry-badge.reward { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }

.entry-text {
  flex: 1;
  min-width: 0;
}

/* 日志类型着色 */
.log-entry.system .entry-text { color: var(--text-muted); font-style: italic; }
.log-entry.action .entry-text { color: var(--text-primary); }
.log-entry.damage .entry-text { color: var(--accent-red); }
.log-entry.heal .entry-text { color: var(--accent-green); }
.log-entry.buff .entry-text { color: #af52de; }
.log-entry.death .entry-text { color: var(--accent-red); font-weight: 600; }
.log-entry.dodge .entry-text { color: var(--text-muted); }
.log-entry.critical .entry-text { color: var(--accent-gold); font-weight: 600; }
.log-entry.miss .entry-text { color: var(--text-muted); }
.log-entry.flee .entry-text { color: var(--accent-gold); }
.log-entry.reward .entry-text { color: var(--accent-green); font-weight: 500; }

/* ── 空状态 ── */
.log-empty {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  text-align: center;
  padding: 24px 0;
}

/* ── 复制成功提示 ── */
.copy-toast {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: var(--font-size-caption);
  font-weight: 500;
  pointer-events: none;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── 自定义滚动条 ── */
.log-entries::-webkit-scrollbar {
  width: 4px;
}

.log-entries::-webkit-scrollbar-track {
  background: transparent;
}

.log-entries::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}

/* ── 响应式 ── */
@media (max-width: 720px) {
  .battle-log { padding: 10px 12px; }
  .log-entries { max-height: 180px; }
  .filter-bar { gap: 3px; }
  .filter-btn { padding: 3px 8px; }
  .filter-icon { display: none; }
  .entry-time { display: none; }
  .header-actions { gap: 2px; }
}
</style>
