/**
 * 地图区域静态配置
 * 包含 4 个区域的基础数据：迷雾林海、枯骨荒原、赤焰山、凛冬雪域
 */
import type { MapArea } from '../types/map'

/** 世界地图区域配置 */
export const MAP_AREAS: MapArea[] = [
  {
    id: 'mist_forest',
    name: '迷雾林海',
    icon: '🌲',
    levelRange: [1, 10],
    description: '笼罩在浓雾中的古老林海，江湖新手的起点。林间栖息着幽灵菇和灵狐。',
    unlockLevel: 1,
    monsters: [
      { id: 'slime', name: '幽灵菇', level: 3, type: 'normal' },
      { id: 'fairy', name: '灵狐', level: 5, type: 'normal' },
      { id: 'forest_spider', name: '剧毒蛛', level: 8, type: 'elite' },
      { id: 'treant', name: '千年古木', level: 10, type: 'boss' }
    ],
    drops: [
      { itemId: 2001, name: '古木盾片', rarity: 'Rare' },
      { itemId: 2002, name: '灵狐之尘', rarity: 'Rare' },
      { itemId: 2003, name: '万木心杖', rarity: 'Epic' }
    ]
  },
  {
    id: 'bone_wasteland',
    name: '枯骨荒原',
    icon: '💀',
    levelRange: [11, 20],
    description: '遍布枯骨的荒凉大地，亡灵在夜幕下徘徊。只有经历过初战洗礼的侠士才敢踏足此地。',
    unlockLevel: 11,
    monsters: [
      { id: 'skeleton', name: '白骨兵', level: 12, type: 'normal' },
      { id: 'zombie', name: '行尸', level: 15, type: 'normal' },
      { id: 'bone_mage', name: '尸巫', level: 17, type: 'elite' },
      { id: 'skeleton_general', name: '鬼将', level: 20, type: 'boss' }
    ],
    drops: [
      { itemId: 3001, name: '白骨剑', rarity: 'Rare' },
      { itemId: 3002, name: '亡灵护符', rarity: 'Epic' },
      { itemId: 3003, name: '鬼将战盔', rarity: 'Legendary' }
    ]
  },
  {
    id: 'fire_valley',
    name: '赤焰山',
    icon: '🔥',
    levelRange: [21, 30],
    description: '炽热的岩浆从地裂中喷涌，空气中弥漫着硫磺的气息。火灵在此肆意横行。',
    unlockLevel: 21,
    monsters: [
      { id: 'fire_elemental', name: '火灵', level: 22, type: 'normal' },
      { id: 'flame_imp', name: '赤炎鬼', level: 25, type: 'normal' },
      { id: 'magma_golem', name: '烈焰石魔', level: 27, type: 'elite' },
      { id: 'inferno_lord', name: '炼狱魔王', level: 30, type: 'boss' }
    ],
    drops: [
      { itemId: 4001, name: '烈焰刀', rarity: 'Epic' },
      { itemId: 4002, name: '熔岩核心', rarity: 'Epic' },
      { itemId: 4003, name: '炼狱法杖', rarity: 'Legendary' }
    ]
  },
  {
    id: 'frost_snowfield',
    name: '凛冬雪域',
    icon: '❄️',
    levelRange: [31, 40],
    description: '终年不化的冰雪覆盖大地，刺骨的寒风能冻结一切生命。传说深处沉睡着冰霜巨龙。',
    unlockLevel: 31,
    monsters: [
      { id: 'ice_giant', name: '冰魄巨人', level: 32, type: 'normal' },
      { id: 'snow_wolf', name: '灵雪狼', level: 35, type: 'normal' },
      { id: 'frost_witch', name: '寒冰妖姬', level: 37, type: 'elite' },
      { id: 'frost_dragon', name: '冰霜巨龙', level: 40, type: 'boss' }
    ],
    drops: [
      { itemId: 5001, name: '霜寒剑', rarity: 'Epic' },
      { itemId: 5002, name: '冰晶护甲', rarity: 'Epic' },
      { itemId: 5003, name: '龙魄玄珠', rarity: 'Legendary' }
    ]
  }
]