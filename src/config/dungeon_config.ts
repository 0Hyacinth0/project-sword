/**
 * 副本静态配置
 * 4个区域各2个副本（普通+精英），共8个副本
 */
import type { DungeonConfig } from '../types/dungeon'

/** 副本配置列表 */
export const DUNGEON_CONFIGS: DungeonConfig[] = [
  // ── 迷雾森林 ──
  {
    id: 'mist_forest_normal',
    name: '迷雾密林',
    areaId: 'mist_forest',
    difficulty: 'normal',
    staminaCost: 10,
    levelRequirement: 1,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'slime', name: '史莱姆', level: 3, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'fairy', name: '小精灵', level: 5, type: 'normal' }, { id: 'slime', name: '史莱姆', level: 3, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'treant', name: '古树守卫', level: 10, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 2007, name: '木盾碎片', rarity: 'Rare', quantity: 2 }],
      bonusExp: 50,
      bonusGold: 30
    }
  },
  {
    id: 'mist_forest_elite',
    name: '暗影树海',
    areaId: 'mist_forest',
    difficulty: 'elite',
    staminaCost: 20,
    levelRequirement: 8,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'forest_spider', name: '森林蜘蛛', level: 8, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'forest_spider', name: '森林蜘蛛', level: 8, type: 'elite' }, { id: 'fairy', name: '小精灵', level: 5, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'slime', name: '史莱姆', level: 3, type: 'normal' }, { id: 'forest_spider', name: '森林蜘蛛', level: 8, type: 'elite' }, { id: 'fairy', name: '小精灵', level: 5, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'treant', name: '古树守卫', level: 10, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3008, name: '树心法杖', rarity: 'Epic', quantity: 1 }],
      bonusExp: 120,
      bonusGold: 80
    }
  },
  // ── 白骨荒野 ──
  {
    id: 'bone_wasteland_normal',
    name: '亡者墓地',
    areaId: 'bone_wasteland',
    difficulty: 'normal',
    staminaCost: 15,
    levelRequirement: 11,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'skeleton', name: '骷髅', level: 12, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'zombie', name: '僵尸', level: 15, type: 'normal' }, { id: 'skeleton', name: '骷髅', level: 12, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'skeleton_general', name: '骷髅将军', level: 20, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3009, name: '骨剑', rarity: 'Rare', quantity: 2 }],
      bonusExp: 100,
      bonusGold: 60
    }
  },
  {
    id: 'bone_wasteland_elite',
    name: '骨龙王座',
    areaId: 'bone_wasteland',
    difficulty: 'elite',
    staminaCost: 25,
    levelRequirement: 17,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'bone_mage', name: '骨法师', level: 17, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'zombie', name: '僵尸', level: 15, type: 'normal' }, { id: 'bone_mage', name: '骨法师', level: 17, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'skeleton', name: '骷髅', level: 12, type: 'normal' }, { id: 'bone_mage', name: '骨法师', level: 17, type: 'elite' }, { id: 'zombie', name: '僵尸', level: 15, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'skeleton_general', name: '骷髅将军', level: 20, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3010, name: '将军战盔', rarity: 'Legendary', quantity: 1 }],
      bonusExp: 200,
      bonusGold: 150
    }
  },
  // ── 火焰山谷 ──
  {
    id: 'fire_valley_normal',
    name: '熔岩裂隙',
    areaId: 'fire_valley',
    difficulty: 'normal',
    staminaCost: 20,
    levelRequirement: 21,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'fire_elemental', name: '火元素', level: 22, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'flame_imp', name: '炎魔', level: 25, type: 'normal' }, { id: 'fire_elemental', name: '火元素', level: 22, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'inferno_lord', name: '炼狱领主', level: 30, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3011, name: '烈焰之刃', rarity: 'Epic', quantity: 1 }],
      bonusExp: 180,
      bonusGold: 120
    }
  },
  {
    id: 'fire_valley_elite',
    name: '炼狱深渊',
    areaId: 'fire_valley',
    difficulty: 'elite',
    staminaCost: 30,
    levelRequirement: 27,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'magma_golem', name: '熔岩石魔', level: 27, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'flame_imp', name: '炎魔', level: 25, type: 'normal' }, { id: 'magma_golem', name: '熔岩石魔', level: 27, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'fire_elemental', name: '火元素', level: 22, type: 'normal' }, { id: 'magma_golem', name: '熔岩石魔', level: 27, type: 'elite' }, { id: 'flame_imp', name: '炎魔', level: 25, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'inferno_lord', name: '炼狱领主', level: 30, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3012, name: '炼狱权杖', rarity: 'Legendary', quantity: 1 }],
      bonusExp: 320,
      bonusGold: 240
    }
  },
  // ── 冰霜雪原 ──
  {
    id: 'frost_snowfield_normal',
    name: '冰晶洞窟',
    areaId: 'frost_snowfield',
    difficulty: 'normal',
    staminaCost: 25,
    levelRequirement: 31,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'ice_giant', name: '冰巨人', level: 32, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'snow_wolf', name: '雪狼', level: 35, type: 'normal' }, { id: 'ice_giant', name: '冰巨人', level: 32, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'frost_dragon', name: '霜龙', level: 40, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3013, name: '霜之哀伤', rarity: 'Epic', quantity: 1 }],
      bonusExp: 280,
      bonusGold: 200
    }
  },
  {
    id: 'frost_snowfield_elite',
    name: '龙眠冰殿',
    areaId: 'frost_snowfield',
    difficulty: 'elite',
    staminaCost: 35,
    levelRequirement: 37,
    totalFloors: 5,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'snow_wolf', name: '雪狼', level: 35, type: 'normal' }, { id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'ice_giant', name: '冰巨人', level: 32, type: 'normal' }, { id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' }, { id: 'snow_wolf', name: '雪狼', level: 35, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' }, { id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 5, enemies: [{ id: 'frost_dragon', name: '霜龙', level: 40, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3014, name: '龙魂之心', rarity: 'Legendary', quantity: 1 }],
      bonusExp: 500,
      bonusGold: 380
    }
  }
]

/**
 * 根据区域 ID 获取副本配置列表
 * @param areaId - 区域 ID
 * @returns 该区域的副本配置数组
 */
export function getDungeonsByArea(areaId: string): DungeonConfig[] {
  return DUNGEON_CONFIGS.filter(d => d.areaId === areaId)
}

/**
 * 根据副本 ID 获取配置
 * @param dungeonId - 副本 ID
 * @returns 副本配置或 undefined
 */
export function getDungeonConfig(dungeonId: string): DungeonConfig | undefined {
  return DUNGEON_CONFIGS.find(d => d.id === dungeonId)
}

// ─────────────────────────────────────────────────────
// 团队 Boss 副本（多人高难度）
// ─────────────────────────────────────────────────────

/** 团队 Boss 副本列表 */
export const TEAM_BOSS_DUNGEONS: DungeonConfig[] = [
  {
    id: 'team-boss-shadow-dragon',
    name: '暗影龙巢穴',
    areaId: 'shadow-forest',
    difficulty: 'elite',
    staminaCost: 50,
    levelRequirement: 25,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-shadow-dragon',
            name: '暗影龙',
            level: 30,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 500,
      bonusGold: 200,
      guaranteedItems: [
        { itemId: 3010, name: '暗影龙鳞', quantity: 1, rarity: 'Epic' },
        { itemId: 3011, name: '龙牙戒指', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-flame-lord',
    name: '炎魔深渊',
    areaId: 'flame-mountain',
    difficulty: 'elite',
    staminaCost: 60,
    levelRequirement: 28,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-flame-lord',
            name: '炎魔领主',
            level: 35,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 600,
      bonusGold: 250,
      guaranteedItems: [
        { itemId: 3012, name: '炎魔之心', quantity: 1, rarity: 'Epic' },
        { itemId: 3013, name: '烈焰战甲', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-ancient-guardian',
    name: '远古遗迹',
    areaId: 'mystery-ruins',
    difficulty: 'elite',
    staminaCost: 80,
    levelRequirement: 35,
    totalFloors: 1,
    floors: [
      {
        floorNumber: 1,
        isBossFloor: true,
        enemies: [
          {
            id: 'boss-ancient-guardian',
            name: '远古守护者',
            level: 40,
            type: 'boss',
            drops: []
          }
        ]
      }
    ],
    rewards: {
      bonusExp: 800,
      bonusGold: 350,
      guaranteedItems: [
        { itemId: 3014, name: '远古符文', quantity: 1, rarity: 'Legendary' },
        { itemId: 3015, name: '守护者之盾', quantity: 1, rarity: 'Legendary' }
      ]
    }
  }
]
