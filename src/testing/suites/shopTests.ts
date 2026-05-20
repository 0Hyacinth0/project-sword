/**
 * 商店系统测试套件
 * 覆盖商店概览、金币购买、竞技币皮肤兑换和皮肤启用流程
 */
import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import { getInventoryApi } from '../../api/inventory'
import {
  getShopOverviewApi,
  purchaseShopItemApi,
  redeemShopSkinApi,
  equipCharacterSkinApi
} from '../../api/shop'
import { getCharacterInfoApi } from '../../api/character'
import { testContext } from '../utils/testHelper'
import type { ShopProfession } from '../../types/shop'

const SHOP_TEST_DEFAULT_CHARACTER_ID = 'mock-char-1'

const INVOKE_SKIN_CASES: Record<ShopProfession, {
  shopItemId: string
  skinId: string
  defaultSkinId: string
}> = {
  1: {
    shopItemId: 'arena-warrior-invoke',
    skinId: 'warrior_invoke',
    defaultSkinId: 'default_warrior'
  },
  2: {
    shopItemId: 'arena-mage-invoke',
    skinId: 'mage_invoke',
    defaultSkinId: 'default_mage'
  },
  3: {
    shopItemId: 'arena-hunter-invoke',
    skinId: 'hunter_invoke',
    defaultSkinId: 'default_hunter'
  }
}

/**
 * 读取商店测试使用的角色 ID，缺省时使用 Mock 默认战士。
 * @returns 可用于商店 Mock API 的角色 ID
 */
function getShopTestCharacterId(): string {
  return testContext.characterId || SHOP_TEST_DEFAULT_CHARACTER_ID
}

/**
 * 根据角色职业解析对应的 invoke 皮肤测试参数。
 * @param characterId - 角色 ID
 * @returns 当前职业对应的兑换商品、皮肤和默认皮肤 ID
 */
async function resolveInvokeSkinCase(characterId: string): Promise<{
  profession: ShopProfession
  shopItemId: string
  skinId: string
  defaultSkinId: string
}> {
  const characterRes = await getCharacterInfoApi(characterId)
  expect(characterRes.code).toBe(200)
  const profession = characterRes.data.profession as ShopProfession
  return {
    profession,
    ...INVOKE_SKIN_CASES[profession]
  }
}

/**
 * 解析一个与当前职业不匹配的 invoke 皮肤测试参数。
 * @param profession - 当前角色职业
 * @returns 不匹配职业的兑换商品和皮肤 ID
 */
function resolveMismatchedInvokeSkinCase(profession: ShopProfession): {
  shopItemId: string
  skinId: string
  defaultSkinId: string
} {
  const mismatchedProfession = ([1, 2, 3] as ShopProfession[]).find(item => item !== profession) ?? 2
  return INVOKE_SKIN_CASES[mismatchedProfession]
}

/**
 * 计算指定物品在背包中的总数量。
 * @param characterId - 角色 ID
 * @param itemId - 物品模板 ID
 * @returns 背包中该物品的总数量
 */
async function countInventoryItem(characterId: string, itemId: number): Promise<number> {
  const res = await getInventoryApi(characterId)
  expect(res.code).toBe(200)
  return res.data
    .filter(item => item.itemId === itemId || item.item.itemId === itemId)
    .reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * 创建商店系统测试套件。
 * @returns 商店系统 TestSuite 对象
 */
export function createShopTestSuite(): TestSuite {
  return {
    module: '商店系统',
    icon: '🛒',
    cases: [
      {
        name: '获取商店概览',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const res = await getShopOverviewApi(characterId)
          expect(res.code).toBe(200)
          expect(res.data.balances.characterGold).toBeGreaterThanOrEqual(0)
          expect(res.data.balances.accountPvpCoin).toBeGreaterThanOrEqual(0)
          expect(res.data.items.length).toBeGreaterThan(0)
          expect(res.data.skins.length).toBeGreaterThan(0)
        }
      },
      {
        name: '金币购买补给并写入背包',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const beforeOverview = await getShopOverviewApi(characterId)
          const beforeCount = await countInventoryItem(characterId, 1001)
          const res = await purchaseShopItemApi({
            characterId,
            shopItemId: 'gold-small-hp-potion',
            quantity: 2
          })
          expect(res.code).toBe(200)
          expect(res.data.balances.characterGold).toBeLessThan(beforeOverview.data.balances.characterGold)
          const afterCount = await countInventoryItem(characterId, 1001)
          expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 2)
        }
      },
      {
        name: '金币购买材料并写入背包',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const beforeOverview = await getShopOverviewApi(characterId)
          const beforeCount = await countInventoryItem(characterId, 2001)
          const res = await purchaseShopItemApi({
            characterId,
            shopItemId: 'gold-iron-ore',
            quantity: 3
          })
          expect(res.code).toBe(200)
          expect(res.data.balances.characterGold).toBeLessThan(beforeOverview.data.balances.characterGold)
          const afterCount = await countInventoryItem(characterId, 2001)
          expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 3)
        }
      },
      {
        name: '金币不足时购买失败',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          await purchaseShopItemApi({
            characterId,
            shopItemId: 'gold-steel-ore',
            quantity: 15
          })
          const res = await purchaseShopItemApi({
            characterId,
            shopItemId: 'gold-small-exp-scroll',
            quantity: 5
          })
          expect(res.code).toBe(400)
        }
      },
      {
        name: '竞技币兑换并启用当前职业皮肤',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const skinCase = await resolveInvokeSkinCase(characterId)
          const redeem = await redeemShopSkinApi({
            characterId,
            shopItemId: skinCase.shopItemId
          })
          expect(redeem.code).toBe(200)

          const equip = await equipCharacterSkinApi({
            characterId,
            skinId: skinCase.skinId
          })
          expect(equip.code).toBe(200)
          expect(equip.data.activeSkin?.enabled).toBeTruthy()
        }
      },
      {
        name: '默认皮肤可恢复启用',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const skinCase = await resolveInvokeSkinCase(characterId)
          const equip = await equipCharacterSkinApi({
            characterId,
            skinId: skinCase.defaultSkinId
          })
          expect(equip.code).toBe(200)
          expect(equip.data.activeSkin?.skinId).toBe(skinCase.defaultSkinId)
          expect(equip.data.activeSkin?.enabled).toBeTruthy()
        }
      },
      {
        name: '重复兑换皮肤失败',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const skinCase = await resolveInvokeSkinCase(characterId)
          const res = await redeemShopSkinApi({
            characterId,
            shopItemId: skinCase.shopItemId
          })
          expect(res.code).toBe(400)
        }
      },
      {
        name: '职业不匹配时无法启用皮肤',
        fn: async () => {

          const characterId = getShopTestCharacterId()
          const skinCase = await resolveInvokeSkinCase(characterId)
          const mismatch = resolveMismatchedInvokeSkinCase(skinCase.profession)
          const redeem = await redeemShopSkinApi({
            characterId,
            shopItemId: mismatch.shopItemId
          })
          expect([200, 400].includes(redeem.code)).toBeTruthy()

          const equip = await equipCharacterSkinApi({
            characterId,
            skinId: mismatch.skinId
          })
          expect(equip.code).toBe(400)
        }
      }
    ]
  }
}
