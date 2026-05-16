/**
 * 测试套件注册中心
 * 将所有模块测试套件统一注册到 TestRunner 实例中
 * 按依赖顺序注册：认证 → 角色 → 背包 → 装备 → 战宠 → 战斗 → 地图 → 副本 → 社交 → 组队 → 聊天 → 排行榜 → 竞技场 → PVP
 */

import { testRunner } from './core/TestRunner'
import { createAuthTestSuite } from './suites/authTests'
import { createCharacterTestSuite } from './suites/characterTests'
import { createInventoryTestSuite } from './suites/inventoryTests'
import { createEquipmentTestSuite } from './suites/equipmentTests'
import { createPetTestSuite } from './suites/petTests'
import { createBattleTestSuite } from './suites/battleTests'
import { createMapTestSuite } from './suites/mapTests'
import { createDungeonTestSuite } from './suites/dungeonTests'
import { createSocialTestSuite } from './suites/socialTests'
import { createTeamTestSuite } from './suites/teamTests'
import { createChatTestSuite } from './suites/chatTests'
import { createLeaderboardTestSuite } from './suites/leaderboardTests'
import { createArenaTestSuite } from './suites/arenaTests'
import { createPvpTestSuite } from './suites/pvpTests'

/**
 * 注册所有测试套件到 TestRunner
 * 按依赖顺序注册：认证 → 角色 → 背包 → 装备 → 战宠 → 战斗 → 地图 → 副本 → 社交 → 组队 → 聊天 → 排行榜 → 竞技场 → PVP
 */
export function registerAllSuites(): void {
  testRunner.register(createAuthTestSuite())
  testRunner.register(createCharacterTestSuite())
  testRunner.register(createInventoryTestSuite())
  testRunner.register(createEquipmentTestSuite())
  testRunner.register(createPetTestSuite())
  testRunner.register(createBattleTestSuite())
  testRunner.register(createMapTestSuite())
  testRunner.register(createDungeonTestSuite())
  testRunner.register(createSocialTestSuite())
  testRunner.register(createTeamTestSuite())
  testRunner.register(createChatTestSuite())
  testRunner.register(createLeaderboardTestSuite())
  testRunner.register(createArenaTestSuite())
  testRunner.register(createPvpTestSuite())
}

export { testRunner } from './core/TestRunner'
