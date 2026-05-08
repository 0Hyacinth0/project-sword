import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MAP_AREAS } from '../config/map_config'
import type { MapArea, AreaStatus } from '../types/map'

/**
 * 地图状态管理
 * 管理区域选中状态和展开面板
 */
export const useMapStore = defineStore('map', () => {
  // ── 状态 ──

  /** 当前展开详情的区域 ID（null 表示全部折叠） */
  const expandedAreaId = ref<string | null>(null)

  // ── 计算属性 ──

  /** 所有区域 */
  const areas = computed(() => MAP_AREAS)

  /** 当前展开的区域 */
  const expandedArea = computed<MapArea | null>(() =>
    MAP_AREAS.find(a => a.id === expandedAreaId.value) ?? null
  )

  /**
   * 根据角色等级获取区域状态
   * @param area - 区域
   * @param characterLevel - 角色等级
   * @returns 区域状态
   */
  function getAreaStatus(area: MapArea, characterLevel: number): AreaStatus {
    const [minLv, maxLv] = area.levelRange
    if (characterLevel >= minLv && characterLevel <= maxLv) {
      return 'current'
    }
    if (characterLevel >= area.unlockLevel) {
      return 'unlocked'
    }
    // 判断是否为"未发现"：距离已解锁区域超过 1 级
    const nextUnlockArea = MAP_AREAS.find(a => a.unlockLevel > characterLevel)
    if (nextUnlockArea && area.unlockLevel > nextUnlockArea.unlockLevel) {
      return 'undiscovered'
    }
    return 'locked'
  }

  /**
   * 切换区域展开/折叠
   * @param areaId - 区域 ID
   */
  function toggleArea(areaId: string) {
    expandedAreaId.value = expandedAreaId.value === areaId ? null : areaId
  }

  /** 折叠所有区域 */
  function collapseAll() {
    expandedAreaId.value = null
  }

  return {
    expandedAreaId,
    areas,
    expandedArea,
    getAreaStatus,
    toggleArea,
    collapseAll
  }
})