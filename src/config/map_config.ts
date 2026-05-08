/**
 * 地图区域静态配置
 * 包含 4 个区域的基础数据：迷雾森林、白骨荒野、火焰山谷、冰霜雪原
 */
import type { MapArea } from '../types/map'

/** 世界地图区域配置 */
export const MAP_AREAS: MapArea[] = [
  {
    id: 'mist_forest',
    name: '迷雾森林',
    icon: '🌲',
    levelRange: [1, 10],
    description: '笼罩在浓雾中的古老森林，新手冒险者的起点。林间栖息着温和的史莱姆和调皮的小精灵。',
    unlockLevel: 1,
    monsters: [
      { id: 'slime', name: '史莱姆', level: 3, type: 'normal' },
      { id: 'fairy', name: '小精灵', level: 5, type: 'normal' },
      { id: 'forest_spider', name: '森林蜘蛛', level: 8, type: 'elite' },
      { id: 'treant', name: '古树守卫', level: 10, type: 'boss' }
    ],
    drops: [
      { itemId: 2001, name: '木盾碎片', rarity: 'Rare' },
      { itemId: 2002, name: '精灵之尘', rarity: 'Rare' },
      { itemId: 2003, name: '树心法杖', rarity: 'Epic' }
    ]
  },
  {
    id: 'bone_wasteland',
    name: '白骨荒野',
    icon: '💀',
    levelRange: [11, 20],
    description: '遍布白骨的荒凉大地，亡灵在夜幕下徘徊。只有经历过初战洗礼的冒险者才敢踏足此地。',
    unlockLevel: 11,
    monsters: [
      { id: 'skeleton', name: '骷髅', level: 12, type: 'normal' },
      { id: 'zombie', name: '僵尸', level: 15, type: 'normal' },
      { id: 'bone_mage', name: '骨法师', level: 17, type: 'elite' },
      { id: 'skeleton_general', name: '骷髅将军', level: 20, type: 'boss' }
    ],
    drops: [
      { itemId: 3001, name: '骨剑', rarity: 'Rare' },
      { itemId: 3002, name: '亡灵护符', rarity: 'Epic' },
      { itemId: 3003, name: '将军战盔', rarity: 'Legendary' }
    ]
  },
  {
    id: 'fire_valley',
    name: '火焰山谷',
    icon: '🔥',
    levelRange: [21, 30],
    description: '炽热的岩浆从地裂中喷涌，空气中弥漫着硫磺的气息。火元素生物在此肆意横行。',
    unlockLevel: 21,
    monsters: [
      { id: 'fire_elemental', name: '火元素', level: 22, type: 'normal' },
      { id: 'flame_imp', name: '炎魔', level: 25, type: 'normal' },
      { id: 'magma_golem', name: '熔岩石魔', level: 27, type: 'elite' },
      { id: 'inferno_lord', name: '炼狱领主', level: 30, type: 'boss' }
    ],
    drops: [
      { itemId: 4001, name: '烈焰之刃', rarity: 'Epic' },
      { itemId: 4002, name: '熔岩核心', rarity: 'Epic' },
      { itemId: 4003, name: '炼狱权杖', rarity: 'Legendary' }
    ]
  },
  {
    id: 'frost_snowfield',
    name: '冰霜雪原',
    icon: '❄️',
    levelRange: [31, 40],
    description: '终年不化的冰雪覆盖大地，刺骨的寒风能冻结一切生命。传说深处沉睡着远古霜龙。',
    unlockLevel: 31,
    monsters: [
      { id: 'ice_giant', name: '冰巨人', level: 32, type: 'normal' },
      { id: 'snow_wolf', name: '雪狼', level: 35, type: 'normal' },
      { id: 'frost_witch', name: '冰霜女巫', level: 37, type: 'elite' },
      { id: 'frost_dragon', name: '霜龙', level: 40, type: 'boss' }
    ],
    drops: [
      { itemId: 5001, name: '霜之哀伤', rarity: 'Epic' },
      { itemId: 5002, name: '冰晶护甲', rarity: 'Epic' },
      { itemId: 5003, name: '龙魂之心', rarity: 'Legendary' }
    ]
  }
]