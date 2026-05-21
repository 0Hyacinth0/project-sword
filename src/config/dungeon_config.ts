/**
 * 副本静态配置
 * 4个区域各2个副本（普通+精英），共8个副本
 */
import type { DungeonConfig } from '../types/dungeon'

/** 副本配置列表 */
export const DUNGEON_CONFIGS: DungeonConfig[] = [
  // ── 迷雾林海 ──
  {
    id: 'mist_forest_normal',
    name: '幽林深处',
    areaId: 'mist_forest',
    difficulty: 'normal',
    staminaCost: 10,
    levelRequirement: 1,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'slime', name: '幽灵菇', level: 3, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'fairy', name: '灵狐', level: 5, type: 'normal' }, { id: 'slime', name: '幽灵菇', level: 3, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'treant', name: '千年古木', level: 10, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 2007, name: '古木盾片', rarity: 'Rare', quantity: 2 }],
      bonusExp: 50,
      bonusGold: 30
    }
  },
  {
    id: 'mist_forest_elite',
    name: '幽冥树海',
    areaId: 'mist_forest',
    difficulty: 'elite',
    staminaCost: 20,
    levelRequirement: 8,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'forest_spider', name: '剧毒蛛', level: 8, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'forest_spider', name: '剧毒蛛', level: 8, type: 'elite' }, { id: 'fairy', name: '灵狐', level: 5, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'slime', name: '幽灵菇', level: 3, type: 'normal' }, { id: 'forest_spider', name: '剧毒蛛', level: 8, type: 'elite' }, { id: 'fairy', name: '灵狐', level: 5, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'treant', name: '千年古木', level: 10, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3008, name: '万木心杖', rarity: 'Epic', quantity: 1 }],
      bonusExp: 120,
      bonusGold: 80
    }
  },
  // ── 枯骨荒原 ──
  {
    id: 'bone_wasteland_normal',
    name: '乱葬岗',
    areaId: 'bone_wasteland',
    difficulty: 'normal',
    staminaCost: 15,
    levelRequirement: 11,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'skeleton', name: '白骨兵', level: 12, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'zombie', name: '行尸', level: 15, type: 'normal' }, { id: 'skeleton', name: '白骨兵', level: 12, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'skeleton_general', name: '鬼将', level: 20, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3009, name: '白骨剑', rarity: 'Rare', quantity: 2 }],
      bonusExp: 100,
      bonusGold: 60
    }
  },
  {
    id: 'bone_wasteland_elite',
    name: '白骨王座',
    areaId: 'bone_wasteland',
    difficulty: 'elite',
    staminaCost: 25,
    levelRequirement: 17,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'bone_mage', name: '尸巫', level: 17, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'zombie', name: '行尸', level: 15, type: 'normal' }, { id: 'bone_mage', name: '尸巫', level: 17, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'skeleton', name: '白骨兵', level: 12, type: 'normal' }, { id: 'bone_mage', name: '尸巫', level: 17, type: 'elite' }, { id: 'zombie', name: '行尸', level: 15, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'skeleton_general', name: '鬼将', level: 20, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3010, name: '鬼将战盔', rarity: 'Legendary', quantity: 1 }],
      bonusExp: 200,
      bonusGold: 150
    }
  },
  // ── 赤焰山 ──
  {
    id: 'fire_valley_normal',
    name: '烈焰地宫',
    areaId: 'fire_valley',
    difficulty: 'normal',
    staminaCost: 20,
    levelRequirement: 21,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'fire_elemental', name: '火灵', level: 22, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'flame_imp', name: '赤炎鬼', level: 25, type: 'normal' }, { id: 'fire_elemental', name: '火灵', level: 22, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'inferno_lord', name: '炼狱魔王', level: 30, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3011, name: '烈焰刀', rarity: 'Epic', quantity: 1 }],
      bonusExp: 180,
      bonusGold: 120
    }
  },
  {
    id: 'fire_valley_elite',
    name: '九幽地府',
    areaId: 'fire_valley',
    difficulty: 'elite',
    staminaCost: 30,
    levelRequirement: 27,
    totalFloors: 4,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'magma_golem', name: '烈焰石魔', level: 27, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'flame_imp', name: '赤炎鬼', level: 25, type: 'normal' }, { id: 'magma_golem', name: '烈焰石魔', level: 27, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'fire_elemental', name: '火灵', level: 22, type: 'normal' }, { id: 'magma_golem', name: '烈焰石魔', level: 27, type: 'elite' }, { id: 'flame_imp', name: '赤炎鬼', level: 25, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'inferno_lord', name: '炼狱魔王', level: 30, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3012, name: '炼狱法杖', rarity: 'Legendary', quantity: 1 }],
      bonusExp: 320,
      bonusGold: 240
    }
  },
  // ── 凛冬雪域 ──
  {
    id: 'frost_snowfield_normal',
    name: '冰魄寒洞',
    areaId: 'frost_snowfield',
    difficulty: 'normal',
    staminaCost: 25,
    levelRequirement: 31,
    totalFloors: 3,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'ice_giant', name: '冰魄巨人', level: 32, type: 'normal' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'snow_wolf', name: '灵雪狼', level: 35, type: 'normal' }, { id: 'ice_giant', name: '冰魄巨人', level: 32, type: 'normal' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'frost_dragon', name: '冰霜巨龙', level: 40, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3013, name: '霜寒剑', rarity: 'Epic', quantity: 1 }],
      bonusExp: 280,
      bonusGold: 200
    }
  },
  {
    id: 'frost_snowfield_elite',
    name: '龙眠冰宫',
    areaId: 'frost_snowfield',
    difficulty: 'elite',
    staminaCost: 35,
    levelRequirement: 37,
    totalFloors: 5,
    floors: [
      { floorNumber: 1, enemies: [{ id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 2, enemies: [{ id: 'snow_wolf', name: '灵雪狼', level: 35, type: 'normal' }, { id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 3, enemies: [{ id: 'ice_giant', name: '冰魄巨人', level: 32, type: 'normal' }, { id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' }, { id: 'snow_wolf', name: '灵雪狼', level: 35, type: 'normal' }], isBossFloor: false },
      { floorNumber: 4, enemies: [{ id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' }, { id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' }], isBossFloor: false },
      { floorNumber: 5, enemies: [{ id: 'frost_dragon', name: '冰霜巨龙', level: 40, type: 'boss' }], isBossFloor: true }
    ],
    rewards: {
      guaranteedItems: [{ itemId: 3014, name: '龙魄玄珠', rarity: 'Legendary', quantity: 1 }],
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
    name: '幽冥龙窟',
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
            name: '幽冥毒龙',
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
        { itemId: 3010, name: '幽冥龙鳞', quantity: 1, rarity: 'Epic' },
        { itemId: 3011, name: '龙牙扳指', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-flame-lord',
    name: '炼魔深渊',
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
            name: '炎魔尊',
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
        { itemId: 3012, name: '炎魔内丹', quantity: 1, rarity: 'Epic' },
        { itemId: 3013, name: '烈焰战袍', quantity: 1, rarity: 'Legendary' }
      ]
    }
  },
  {
    id: 'team-boss-ancient-guardian',
    name: '上古遗迹',
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
            name: '上古神将',
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
        { itemId: 3014, name: '上古玉简', quantity: 1, rarity: 'Legendary' },
        { itemId: 3015, name: '神将玄盾', quantity: 1, rarity: 'Legendary' }
      ]
    }
  }
]
