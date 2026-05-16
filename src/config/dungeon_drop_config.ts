/**
 * 副本掉落表配置
 * 为 8 个副本定义专属掉落表，按楼层类型（普通/Boss）分组
 */
import type { DungeonDropTable } from '../types/dungeon'

/** 迷雾森林普通副本掉落表 */
const mistForestNormal: DungeonDropTable = {
  dropRateMultiplier: 1.0,
  floorDrops: [
    { itemId: 2001, name: '铁矿石', itemType: 'material', quality: 'common', dropRate: 0.25, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.10, minQuantity: 1, maxQuantity: 2 },
    { itemId: 3004, name: '疾风护腿', itemType: 'equipment', quality: 'common', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2001, name: '铁矿石', itemType: 'material', quality: 'common', dropRate: 0.40, minQuantity: 2, maxQuantity: 5 },
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.25, minQuantity: 1, maxQuantity: 3 },
    { itemId: 3004, name: '疾风护腿', itemType: 'equipment', quality: 'common', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6002, name: '风狼蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6005, name: '光辉精灵蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.02, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 迷雾森林精英副本掉落表 */
const mistForestElite: DungeonDropTable = {
  dropRateMultiplier: 1.5,
  floorDrops: [
    { itemId: 2001, name: '铁矿石', itemType: 'material', quality: 'common', dropRate: 0.30, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.20, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.45, minQuantity: 2, maxQuantity: 5 },
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2006, name: '秘银碎片', itemType: 'material', quality: 'rare', dropRate: 0.20, minQuantity: 1, maxQuantity: 2, eliteOnly: true },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.18, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3006, name: '暗影护盾', itemType: 'equipment', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 6002, name: '风狼蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6005, name: '光辉精灵蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.04, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 白骨荒野普通副本掉落表 */
const boneWastelandNormal: DungeonDropTable = {
  dropRateMultiplier: 1.0,
  floorDrops: [
    { itemId: 2001, name: '铁矿石', itemType: 'material', quality: 'common', dropRate: 0.20, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.15, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3004, name: '疾风护腿', itemType: 'equipment', quality: 'common', dropRate: 0.07, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.35, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6004, name: '土岩兽蛋', itemType: 'pet_egg', quality: 'common', dropRate: 0.04, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6006, name: '暗影猫蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 白骨荒野精英副本掉落表 */
const boneWastelandElite: DungeonDropTable = {
  dropRateMultiplier: 1.5,
  floorDrops: [
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.25, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.30, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.08, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 2 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3006, name: '暗影护盾', itemType: 'equipment', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 3007, name: '龙牙戒指', itemType: 'equipment', quality: 'legendary', dropRate: 0.03, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 6004, name: '土岩兽蛋', itemType: 'pet_egg', quality: 'common', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6006, name: '暗影猫蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 火焰山谷普通副本掉落表 */
const fireValleyNormal: DungeonDropTable = {
  dropRateMultiplier: 1.0,
  floorDrops: [
    { itemId: 2002, name: '精钢矿石', itemType: 'material', quality: 'rare', dropRate: 0.20, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 2 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.30, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6001, name: '火焰精灵蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.04, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6008, name: '雷鹰蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 火焰山谷精英副本掉落表 */
const fireValleyElite: DungeonDropTable = {
  dropRateMultiplier: 1.5,
  floorDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.40, minQuantity: 2, maxQuantity: 5 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.12, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2006, name: '秘银碎片', itemType: 'material', quality: 'rare', dropRate: 0.25, minQuantity: 1, maxQuantity: 3, eliteOnly: true },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.18, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3007, name: '龙牙戒指', itemType: 'equipment', quality: 'legendary', dropRate: 0.03, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 6001, name: '火焰精灵蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6008, name: '雷鹰蛋', itemType: 'pet_egg', quality: 'rare', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 冰霜雪原普通副本掉落表 */
const frostSnowfieldNormal: DungeonDropTable = {
  dropRateMultiplier: 1.0,
  floorDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.12, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3002, name: '秘银头盔', itemType: 'equipment', quality: 'rare', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.35, minQuantity: 2, maxQuantity: 4 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.08, minQuantity: 1, maxQuantity: 2 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.12, minQuantity: 1, maxQuantity: 2 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6003, name: '冰晶凤凰蛋', itemType: 'pet_egg', quality: 'epic', dropRate: 0.03, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6007, name: '水灵龟蛋', itemType: 'pet_egg', quality: 'common', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 冰霜雪原精英副本掉落表 */
const frostSnowfieldElite: DungeonDropTable = {
  dropRateMultiplier: 1.5,
  floorDrops: [
    { itemId: 2003, name: '秘法水晶', itemType: 'material', quality: 'epic', dropRate: 0.18, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.06, minQuantity: 1, maxQuantity: 1 }
  ],
  bossDrops: [
    { itemId: 2004, name: '龙鳞碎片', itemType: 'material', quality: 'legendary', dropRate: 0.20, minQuantity: 1, maxQuantity: 3 },
    { itemId: 2005, name: '战宠进化石', itemType: 'material', quality: 'epic', dropRate: 0.20, minQuantity: 1, maxQuantity: 2 },
    { itemId: 3001, name: '烈焰之刃', itemType: 'equipment', quality: 'epic', dropRate: 0.20, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3005, name: '灵巧之戒', itemType: 'equipment', quality: 'epic', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3003, name: '守护胸甲', itemType: 'equipment', quality: 'rare', dropRate: 0.18, minQuantity: 1, maxQuantity: 1 },
    { itemId: 3006, name: '暗影护盾', itemType: 'equipment', quality: 'epic', dropRate: 0.10, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 3007, name: '龙牙戒指', itemType: 'equipment', quality: 'legendary', dropRate: 0.05, minQuantity: 1, maxQuantity: 1, eliteOnly: true },
    { itemId: 6003, name: '冰晶凤凰蛋', itemType: 'pet_egg', quality: 'epic', dropRate: 0.08, minQuantity: 1, maxQuantity: 1 },
    { itemId: 6007, name: '水灵龟蛋', itemType: 'pet_egg', quality: 'common', dropRate: 0.10, minQuantity: 1, maxQuantity: 1 }
  ]
}

/** 副本掉落表映射 */
const DUNGEON_DROP_TABLES: Record<string, DungeonDropTable> = {
  mist_forest_normal: mistForestNormal,
  mist_forest_elite: mistForestElite,
  bone_wasteland_normal: boneWastelandNormal,
  bone_wasteland_elite: boneWastelandElite,
  fire_valley_normal: fireValleyNormal,
  fire_valley_elite: fireValleyElite,
  frost_snowfield_normal: frostSnowfieldNormal,
  frost_snowfield_elite: frostSnowfieldElite
}

/**
 * 获取副本掉落表
 * @param dungeonId - 副本 ID
 * @returns 掉落表配置，未找到时返回 undefined
 */
export function getDungeonDropTable(dungeonId: string): DungeonDropTable | undefined {
  return DUNGEON_DROP_TABLES[dungeonId]
}
