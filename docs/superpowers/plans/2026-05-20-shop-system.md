# Shop System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first usable shop system on the frontend: gold purchases for supplies/materials, arena/PVP currency redemption for invoke profession skins, shop and equipment-page skin switching, and a backend integration document.

**Architecture:** API-shape-first frontend implementation. `src/api/shop.ts` exposes the contract and Mock behavior; `src/stores/shop.ts` centralizes shop state; `ShopPanel.vue` renders the usable shop; `HomeView.vue` wires navigation and operation refreshes; `CharacterEquipmentGrid.vue` adds skin switching UI. No backend/database/server code is generated.

**Tech Stack:** Vue 3 + TypeScript + Pinia + Vite + existing Liquid Glass UI tokens from `DESIGN.md` + existing test runner under `src/testing`.

---

## Reference Requirements

- Follow `开发方案.md`: core authoritative game data should be backend-owned in production; frontend Mock is presentation/demo only.
- Follow `DESIGN.md`: use existing CSS variables (`--bg-panel`, `--bg-panel-light`, `--border-light`, `--accent-blue`, `--accent-gold`, `--accent-green`, `--text-primary`, `--text-muted`, `--shadow-card`, spacing rules).
- Add function-level comments for every new or changed frontend function.
- Scope is frontend only. Backend handoff is documentation only.
- Approved product choices:
  - Gold belongs to current character.
  - PVP/arena currency belongs to account.
  - Arena currency redeems skins only in this version.
  - Skin ownership is account + profession.
  - Shop supports purchase/quick equip; equipment page supports normal skin switching.
  - Implementation uses API shape first + Mock implementation.

---

## Expected Files

- [ ] Create `src/types/shop.ts`
- [ ] Create `src/config/shop_config.ts`
- [ ] Create `src/api/shop.ts`
- [ ] Create `src/stores/shop.ts`
- [ ] Create `src/components/shop/ShopPanel.vue`
- [ ] Create `src/testing/suites/shopTests.ts`
- [ ] Update `src/testing/registry.ts`
- [ ] Update `src/api/index.ts`
- [ ] Update `src/api/inventory.ts`
- [ ] Update `src/api/character.ts`
- [ ] Update `src/components/character/CharacterPanel.vue`
- [ ] Update `src/components/character/CharacterEquipmentGrid.vue`
- [ ] Update `src/views/HomeView.vue`
- [ ] Create `商店系统-后端对接文档.md`

---

## Step 1: Add Shop Types And Config, Then Write Failing Tests

**Intent:** Lock the public data shape before implementation. Tests should fail first because `src/api/shop.ts` does not exist yet.

- [ ] Add `src/types/shop.ts`:

```ts
/**
 * 商店系统类型定义
 * 覆盖多货币商品、账号职业皮肤与操作结果
 */

export type ShopCurrencyType = 'gold' | 'pvp_coin'
export type ShopItemKind = 'inventory_item' | 'skin'
export type ShopCategory = 'supply' | 'material' | 'skin'
export type SkinSource = 'default' | 'pvp_shop'
export type ShopProfession = 1 | 2 | 3
export type ShopItemRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

export interface ShopPrice {
  currency: ShopCurrencyType
  amount: number
}

export interface ShopBalances {
  characterGold: number
  accountPvpCoin: number
}

export interface ShopItem {
  id: string
  kind: ShopItemKind
  name: string
  description: string
  category: ShopCategory
  rarity: ShopItemRarity
  price: ShopPrice
  maxPurchaseQuantity: number
  itemId?: number
  skinId?: string
  profession?: ShopProfession
  previewImageUrl?: string
  owned?: boolean
  enabled?: boolean
}

export interface CharacterSkin {
  skinId: string
  name: string
  profession: ShopProfession
  portraitUrl: string | null
  source: SkinSource
  owned: boolean
  enabled: boolean
  description?: string
  price?: ShopPrice
}

export interface ShopOverview {
  balances: ShopBalances
  items: ShopItem[]
  skins: CharacterSkin[]
  activeSkinId: string
}

export interface PurchaseShopItemParams {
  characterId: string
  shopItemId: string
  quantity: number
}

export interface RedeemSkinParams {
  characterId: string
  shopItemId: string
}

export interface EquipSkinParams {
  characterId: string
  skinId: string
}

export interface ShopActionResult {
  message: string
  balances: ShopBalances
  items?: ShopItem[]
  skins?: CharacterSkin[]
  activeSkin?: CharacterSkin
  inventoryChanged?: boolean
}
```

- [ ] Add `src/config/shop_config.ts`:

```ts
/**
 * 商店静态配置
 * 仅描述前端展示和 Mock 默认商品；真实价格与上架状态以后端为准。
 */
import type { ShopItem } from '../types/shop'

export const DEFAULT_SHOP_BALANCES = {
  characterGold: 1800,
  accountPvpCoin: 2400
}

export const SHOP_GOLD_ITEMS: ShopItem[] = [
  {
    id: 'gold-small-hp-potion',
    kind: 'inventory_item',
    name: '小型生命药水',
    description: '恢复 50 点生命值，适合日常冒险补给。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 35 },
    maxPurchaseQuantity: 20,
    itemId: 1001
  },
  {
    id: 'gold-mana-potion',
    kind: 'inventory_item',
    name: '魔法药水',
    description: '恢复 30 点魔法值，适合施法职业常备。',
    category: 'supply',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 45 },
    maxPurchaseQuantity: 20,
    itemId: 1004
  },
  {
    id: 'gold-small-exp-scroll',
    kind: 'inventory_item',
    name: '经验卷轴（小）',
    description: '使用后获得 100 点经验值。',
    category: 'supply',
    rarity: 'Rare',
    price: { currency: 'gold', amount: 180 },
    maxPurchaseQuantity: 5,
    itemId: 1006
  },
  {
    id: 'gold-iron-ore',
    kind: 'inventory_item',
    name: '铁矿石',
    description: '基础强化材料，可用于低阶装备强化。',
    category: 'material',
    rarity: 'Normal',
    price: { currency: 'gold', amount: 25 },
    maxPurchaseQuantity: 30,
    itemId: 2001
  },
  {
    id: 'gold-steel-ore',
    kind: 'inventory_item',
    name: '精钢矿石',
    description: '进阶强化材料，适合稀有装备强化。',
    category: 'material',
    rarity: 'Rare',
    price: { currency: 'gold', amount: 90 },
    maxPurchaseQuantity: 15,
    itemId: 2002
  }
]

export const SHOP_SKIN_ITEMS: ShopItem[] = [
  {
    id: 'arena-warrior-invoke',
    kind: 'skin',
    name: '战士·英灵召唤',
    description: '竞技场兑换的战士职业 invoke 皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'warrior_invoke',
    profession: 1,
    previewImageUrl: '/assets/portraits/warrior_invoke.png'
  },
  {
    id: 'arena-mage-invoke',
    kind: 'skin',
    name: '法师·英灵召唤',
    description: '竞技场兑换的法师职业 invoke 皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'mage_invoke',
    profession: 2,
    previewImageUrl: '/assets/portraits/mage_invoke.png'
  },
  {
    id: 'arena-hunter-invoke',
    kind: 'skin',
    name: '猎人·英灵召唤',
    description: '竞技场兑换的猎人职业 invoke 皮肤。',
    category: 'skin',
    rarity: 'Epic',
    price: { currency: 'pvp_coin', amount: 800 },
    maxPurchaseQuantity: 1,
    skinId: 'hunter_invoke',
    profession: 3,
    previewImageUrl: '/assets/portraits/hunter_invoke.png'
  }
]
```

- [ ] Add `src/testing/suites/shopTests.ts` with failing imports:

```ts
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
import { enableMock } from '../../utils/mockConfig'
import { testContext, safeCall } from '../utils/testHelper'

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
          enableMock()
          const res = await getShopOverviewApi(testContext.characterId)
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
          enableMock()
          const beforeOverview = await getShopOverviewApi(testContext.characterId)
          const beforeCount = await countInventoryItem(testContext.characterId, 1001)
          const res = await purchaseShopItemApi({
            characterId: testContext.characterId,
            shopItemId: 'gold-small-hp-potion',
            quantity: 2
          })
          expect(res.code).toBe(200)
          expect(res.data.balances.characterGold).toBeLessThan(beforeOverview.data.balances.characterGold)
          const afterCount = await countInventoryItem(testContext.characterId, 1001)
          expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 2)
        }
      },
      {
        name: '金币不足时购买失败',
        fn: async () => {
          enableMock()
          const { error } = await safeCall(() => purchaseShopItemApi({
            characterId: testContext.characterId,
            shopItemId: 'gold-small-exp-scroll',
            quantity: 999
          }))
          expect(error).toBeDefined()
        }
      },
      {
        name: '竞技币兑换并启用当前职业皮肤',
        fn: async () => {
          enableMock()
          const redeem = await redeemShopSkinApi({
            characterId: testContext.characterId,
            shopItemId: 'arena-warrior-invoke'
          })
          expect(redeem.code).toBe(200)

          const equip = await equipCharacterSkinApi({
            characterId: testContext.characterId,
            skinId: 'warrior_invoke'
          })
          expect(equip.code).toBe(200)
          expect(equip.data.activeSkin?.enabled).toBeTruthy()
        }
      },
      {
        name: '重复兑换皮肤失败',
        fn: async () => {
          enableMock()
          const { error } = await safeCall(() => redeemShopSkinApi({
            characterId: testContext.characterId,
            shopItemId: 'arena-warrior-invoke'
          }))
          expect(error).toBeDefined()
        }
      },
      {
        name: '职业不匹配时无法启用皮肤',
        fn: async () => {
          enableMock()
          const { error } = await safeCall(() => equipCharacterSkinApi({
            characterId: testContext.characterId,
            skinId: 'mage_invoke'
          }))
          expect(error).toBeDefined()
        }
      }
    ]
  }
}
```

- [ ] Update `src/testing/registry.ts`:

```ts
import { createShopTestSuite } from './suites/shopTests'

// register after inventory, before equipment:
testRunner.register(createInventoryTestSuite())
testRunner.register(createShopTestSuite())
testRunner.register(createEquipmentTestSuite())
```

- [ ] Run:

```bash
npm run build
```

Expected result: fails because `../../api/shop` does not exist. This is the red step.

---

## Step 2: Implement Shop API Contract And Mock State

**Intent:** Make shop operations usable without backend, while preserving a clean real-backend contract.

- [ ] Update `src/api/inventory.ts` by exporting a narrow helper:

```ts
/**
 * 向 Mock 背包加入指定物品，供商店等前端 Mock 模块复用。
 * @param characterId - 接收物品的角色 ID
 * @param itemId - 物品模板 ID
 * @param quantity - 加入数量
 * @returns 是否成功找到模板并写入
 */
export function addMockInventoryItemToCharacter(
  characterId: string,
  itemId: number,
  quantity: number
): boolean {
  const template = mockItemTemplates.find(item => item.itemId === itemId)
  if (!template || quantity <= 0) return false
  addMockInventoryItem(characterId, itemId, quantity)
  return true
}
```

- [ ] Update `src/api/character.ts` by adding helper near other Mock helpers:

```ts
/**
 * 更新 Mock 角色立绘 URL，供皮肤系统启用后同步角色详情。
 * @param characterId - 角色 ID
 * @param portraitUrl - 立绘 URL；null 表示恢复职业默认皮肤
 * @returns 是否成功找到角色并更新
 */
export function setMockCharacterPortrait(characterId: string, portraitUrl: string | null): boolean {
  const char = mockCharacters.find(item => item.id === characterId)
  if (!char) return false
  char.portraitUrl = portraitUrl
  char.updateTime = new Date().toISOString()
  return true
}
```

- [ ] Create `src/api/shop.ts`:

```ts
/**
 * 商店系统 API
 * 提供商品概览、金币购买、竞技币皮肤兑换和皮肤启用能力
 */
import request from './request'
import type { ApiResponse } from './request'
import {
  DEFAULT_SHOP_BALANCES,
  SHOP_GOLD_ITEMS,
  SHOP_SKIN_ITEMS
} from '../config/shop_config'
import { getJobConfigByProfession } from '../config/job_config'
import { isMockEnabled } from '../utils/mockConfig'
import { addMockInventoryItemToCharacter } from './inventory'
import { getCharacterInfoApi, setMockCharacterPortrait } from './character'
import type {
  CharacterSkin,
  EquipSkinParams,
  PurchaseShopItemParams,
  RedeemSkinParams,
  ShopActionResult,
  ShopBalances,
  ShopItem,
  ShopOverview,
  ShopProfession
} from '../types/shop'

const mockCharacterBalances = new Map<string, ShopBalances>()
const mockOwnedSkinIds = new Set<string>()
const mockEquippedSkinByCharacter = new Map<string, string>()

/**
 * 创建 Mock API 延迟。
 * @param ms - 延迟毫秒数
 * @returns 延迟 Promise
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 读取或初始化某个角色的 Mock 货币余额。
 * @param characterId - 角色 ID
 * @returns Mock 货币余额
 */
function getMockBalances(characterId: string): ShopBalances {
  if (!mockCharacterBalances.has(characterId)) {
    mockCharacterBalances.set(characterId, { ...DEFAULT_SHOP_BALANCES })
  }
  return mockCharacterBalances.get(characterId)!
}

/**
 * 根据皮肤 ID 获取竞技商店皮肤商品。
 * @param skinId - 皮肤 ID
 * @returns 匹配的皮肤商品，未找到时返回 undefined
 */
function findSkinItemBySkinId(skinId: string): ShopItem | undefined {
  return SHOP_SKIN_ITEMS.find(item => item.skinId === skinId)
}

/**
 * 构建某职业的默认皮肤配置。
 * @param profession - 职业编号
 * @param enabled - 是否当前启用
 * @returns 默认皮肤配置
 */
function buildDefaultSkin(profession: ShopProfession, enabled: boolean): CharacterSkin {
  const job = getJobConfigByProfession(profession)
  return {
    skinId: `default_${job.nameEn.toLowerCase()}`,
    name: `${job.name}默认`,
    profession,
    portraitUrl: job.portrait,
    source: 'default',
    owned: true,
    enabled,
    description: '职业默认立绘'
  }
}

/**
 * 根据角色职业与 Mock 拥有状态构建皮肤列表。
 * @param characterId - 角色 ID
 * @param profession - 当前角色职业
 * @returns 当前账号可见的皮肤列表
 */
function buildMockSkins(characterId: string, profession: ShopProfession): CharacterSkin[] {
  const equippedSkinId = mockEquippedSkinByCharacter.get(characterId)
  const defaultSkin = buildDefaultSkin(profession, !equippedSkinId)
  const pvpSkins = SHOP_SKIN_ITEMS.map(item => ({
    skinId: item.skinId!,
    name: item.name,
    profession: item.profession as ShopProfession,
    portraitUrl: item.previewImageUrl ?? null,
    source: 'pvp_shop' as const,
    owned: mockOwnedSkinIds.has(item.skinId!),
    enabled: equippedSkinId === item.skinId,
    description: item.description,
    price: item.price
  }))
  return [defaultSkin, ...pvpSkins]
}

/**
 * 使用当前拥有状态补全商品 owned/enabled 字段。
 * @param characterId - 角色 ID
 * @returns 商品列表
 */
function buildMockItems(characterId: string): ShopItem[] {
  const equippedSkinId = mockEquippedSkinByCharacter.get(characterId)
  const skinItems = SHOP_SKIN_ITEMS.map(item => ({
    ...item,
    owned: item.skinId ? mockOwnedSkinIds.has(item.skinId) : false,
    enabled: item.skinId === equippedSkinId
  }))
  return [...SHOP_GOLD_ITEMS, ...skinItems]
}

/**
 * 获取商店概览。
 * @param characterId - 当前角色 ID
 * @returns 商店概览响应
 */
export async function getShopOverviewApi(characterId: string): Promise<ApiResponse<ShopOverview>> {
  if (isMockEnabled()) return mockGetShopOverview(characterId)
  const res = await request.get<ApiResponse<ShopOverview>>('/shop/overview', { params: { characterId } })
  return res.data
}

/**
 * 获取商店商品列表。
 * @param characterId - 当前角色 ID
 * @returns 商品列表响应
 */
export async function getShopItemsApi(characterId: string): Promise<ApiResponse<ShopItem[]>> {
  if (isMockEnabled()) return mockGetShopItems(characterId)
  const res = await request.get<ApiResponse<ShopItem[]>>('/shop/items', { params: { characterId } })
  return res.data
}

/**
 * 购买金币商品。
 * @param params - 购买参数
 * @returns 操作结果响应
 */
export async function purchaseShopItemApi(params: PurchaseShopItemParams): Promise<ApiResponse<ShopActionResult>> {
  if (isMockEnabled()) return mockPurchaseShopItem(params)
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/purchase', params)
  return res.data
}

/**
 * 兑换竞技皮肤。
 * @param params - 兑换参数
 * @returns 操作结果响应
 */
export async function redeemShopSkinApi(params: RedeemSkinParams): Promise<ApiResponse<ShopActionResult>> {
  if (isMockEnabled()) return mockRedeemShopSkin(params)
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/skins/redeem', params)
  return res.data
}

/**
 * 启用角色皮肤。
 * @param params - 启用参数
 * @returns 操作结果响应
 */
export async function equipCharacterSkinApi(params: EquipSkinParams): Promise<ApiResponse<ShopActionResult>> {
  if (isMockEnabled()) return mockEquipCharacterSkin(params)
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/skins/equip', params)
  return res.data
}

/**
 * Mock：获取商店概览。
 * @param characterId - 当前角色 ID
 * @returns 商店概览响应
 */
async function mockGetShopOverview(characterId: string): Promise<ApiResponse<ShopOverview>> {
  await delay(300)
  const characterRes = await getCharacterInfoApi(characterId)
  if (characterRes.code !== 200) {
    return { code: 404, message: '角色不存在', data: null as unknown as ShopOverview }
  }
  const profession = characterRes.data.profession as ShopProfession
  const activeSkinId = mockEquippedSkinByCharacter.get(characterId) ?? buildDefaultSkin(profession, true).skinId
  return {
    code: 200,
    message: '获取成功',
    data: {
      balances: { ...getMockBalances(characterId) },
      items: buildMockItems(characterId),
      skins: buildMockSkins(characterId, profession),
      activeSkinId
    }
  }
}

/**
 * Mock：获取商品列表。
 * @param characterId - 当前角色 ID
 * @returns 商品列表响应
 */
async function mockGetShopItems(characterId: string): Promise<ApiResponse<ShopItem[]>> {
  await delay(200)
  return { code: 200, message: '获取成功', data: buildMockItems(characterId) }
}

/**
 * Mock：购买金币商品。
 * @param params - 购买参数
 * @returns 操作结果响应
 */
async function mockPurchaseShopItem(params: PurchaseShopItemParams): Promise<ApiResponse<ShopActionResult>> {
  await delay(300)
  const item = SHOP_GOLD_ITEMS.find(entry => entry.id === params.shopItemId)
  if (!item || item.kind !== 'inventory_item' || !item.itemId) {
    return { code: 404, message: '商品不存在或已下架', data: null as unknown as ShopActionResult }
  }
  if (params.quantity < 1 || params.quantity > item.maxPurchaseQuantity) {
    return { code: 400, message: '购买数量不合法', data: null as unknown as ShopActionResult }
  }
  const balances = getMockBalances(params.characterId)
  const totalPrice = item.price.amount * params.quantity
  if (balances.characterGold < totalPrice) {
    return { code: 400, message: '金币不足', data: null as unknown as ShopActionResult }
  }
  const added = addMockInventoryItemToCharacter(params.characterId, item.itemId, params.quantity)
  if (!added) {
    return { code: 400, message: '物品模板不存在', data: null as unknown as ShopActionResult }
  }
  balances.characterGold -= totalPrice
  return {
    code: 200,
    message: '购买成功',
    data: {
      message: `购买 ${item.name} ×${params.quantity} 成功`,
      balances: { ...balances },
      items: buildMockItems(params.characterId),
      inventoryChanged: true
    }
  }
}

/**
 * Mock：兑换竞技皮肤。
 * @param params - 兑换参数
 * @returns 操作结果响应
 */
async function mockRedeemShopSkin(params: RedeemSkinParams): Promise<ApiResponse<ShopActionResult>> {
  await delay(300)
  const item = SHOP_SKIN_ITEMS.find(entry => entry.id === params.shopItemId)
  if (!item || !item.skinId) {
    return { code: 404, message: '皮肤商品不存在或已下架', data: null as unknown as ShopActionResult }
  }
  if (mockOwnedSkinIds.has(item.skinId)) {
    return { code: 400, message: '已拥有该皮肤', data: null as unknown as ShopActionResult }
  }
  const balances = getMockBalances(params.characterId)
  if (balances.accountPvpCoin < item.price.amount) {
    return { code: 400, message: '竞技币不足', data: null as unknown as ShopActionResult }
  }
  const characterRes = await getCharacterInfoApi(params.characterId)
  if (characterRes.code !== 200) {
    return { code: 404, message: '角色不存在', data: null as unknown as ShopActionResult }
  }
  balances.accountPvpCoin -= item.price.amount
  mockOwnedSkinIds.add(item.skinId)
  return {
    code: 200,
    message: '兑换成功',
    data: {
      message: `${item.name} 已解锁`,
      balances: { ...balances },
      items: buildMockItems(params.characterId),
      skins: buildMockSkins(params.characterId, characterRes.data.profession as ShopProfession)
    }
  }
}

/**
 * Mock：启用角色皮肤。
 * @param params - 启用参数
 * @returns 操作结果响应
 */
async function mockEquipCharacterSkin(params: EquipSkinParams): Promise<ApiResponse<ShopActionResult>> {
  await delay(250)
  const characterRes = await getCharacterInfoApi(params.characterId)
  if (characterRes.code !== 200) {
    return { code: 404, message: '角色不存在', data: null as unknown as ShopActionResult }
  }
  const profession = characterRes.data.profession as ShopProfession
  const defaultSkin = buildDefaultSkin(profession, true)
  let targetSkin: CharacterSkin

  if (params.skinId === defaultSkin.skinId) {
    mockEquippedSkinByCharacter.delete(params.characterId)
    setMockCharacterPortrait(params.characterId, null)
    targetSkin = defaultSkin
  } else {
    const item = findSkinItemBySkinId(params.skinId)
    if (!item || !item.skinId || !item.profession) {
      return { code: 404, message: '皮肤不存在', data: null as unknown as ShopActionResult }
    }
    if (!mockOwnedSkinIds.has(item.skinId)) {
      return { code: 403, message: '尚未拥有该皮肤', data: null as unknown as ShopActionResult }
    }
    if (item.profession !== profession) {
      return { code: 400, message: '该皮肤不适用于当前职业', data: null as unknown as ShopActionResult }
    }
    mockEquippedSkinByCharacter.set(params.characterId, item.skinId)
    setMockCharacterPortrait(params.characterId, item.previewImageUrl ?? null)
    targetSkin = {
      skinId: item.skinId,
      name: item.name,
      profession: item.profession,
      portraitUrl: item.previewImageUrl ?? null,
      source: 'pvp_shop',
      owned: true,
      enabled: true,
      description: item.description,
      price: item.price
    }
  }

  return {
    code: 200,
    message: '皮肤已启用',
    data: {
      message: `${targetSkin.name} 已启用`,
      balances: { ...getMockBalances(params.characterId) },
      items: buildMockItems(params.characterId),
      skins: buildMockSkins(params.characterId, profession),
      activeSkin: targetSkin
    }
  }
}
```

- [ ] Update `src/api/index.ts`:

```ts
export * from './shop'
```

- [ ] Run:

```bash
npm run build
```

Expected result: compile passes or exposes small typing issues to fix in this step.

---

## Step 3: Add Shop Store

**Intent:** Keep UI components presentational and centralize action state/error handling.

- [ ] Create `src/stores/shop.ts`:

```ts
/**
 * 商店状态管理
 * 管理商品、货币、皮肤拥有状态与购买/兑换/启用动作
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  equipCharacterSkinApi,
  getShopItemsApi,
  getShopOverviewApi,
  purchaseShopItemApi,
  redeemShopSkinApi
} from '../api/shop'
import type { CharacterSkin, ShopActionResult, ShopBalances, ShopItem, ShopOverview } from '../types/shop'

/** 创建空货币余额。 */
function createEmptyBalances(): ShopBalances {
  return { characterGold: 0, accountPvpCoin: 0 }
}

export const useShopStore = defineStore('shop', () => {
  const overview = ref<ShopOverview | null>(null)
  const items = ref<ShopItem[]>([])
  const skins = ref<CharacterSkin[]>([])
  const balances = ref<ShopBalances>(createEmptyBalances())
  const activeSkinId = ref('')
  const loading = ref(false)
  const actionLoading = ref(false)
  const errorMsg = ref('')
  const actionErrorMsg = ref('')

  const goldItems = computed(() => items.value.filter(item => item.price.currency === 'gold'))
  const arenaSkinItems = computed(() => items.value.filter(item => item.price.currency === 'pvp_coin'))
  const ownedSkins = computed(() => skins.value.filter(skin => skin.owned))
  const activeSkin = computed(() => skins.value.find(skin => skin.skinId === activeSkinId.value) ?? null)

  /**
   * 使用商店概览同步 store 状态。
   * @param data - 商店概览数据
   * @returns 无返回值
   */
  function applyOverview(data: ShopOverview): void {
    overview.value = data
    items.value = data.items
    skins.value = data.skins
    balances.value = data.balances
    activeSkinId.value = data.activeSkinId
  }

  /**
   * 使用商店动作结果同步 store 状态。
   * @param result - 购买、兑换或启用返回结果
   * @returns 无返回值
   */
  function applyActionResult(result: ShopActionResult): void {
    balances.value = result.balances
    if (result.items) items.value = result.items
    if (result.skins) skins.value = result.skins
    if (result.activeSkin) activeSkinId.value = result.activeSkin.skinId
  }

  /**
   * 获取当前角色商店概览。
   * @param characterId - 当前角色 ID
   * @returns 是否成功
   */
  async function fetchOverview(characterId: string): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getShopOverviewApi(characterId)
      if (res.code === 200) {
        applyOverview(res.data)
        return true
      }
      errorMsg.value = res.message
      return false
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '获取商店数据失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前角色可见商品。
   * @param characterId - 当前角色 ID
   * @returns 是否成功
   */
  async function fetchItems(characterId: string): Promise<boolean> {
    loading.value = true
    errorMsg.value = ''
    try {
      const res = await getShopItemsApi(characterId)
      if (res.code === 200) {
        items.value = res.data
        return true
      }
      errorMsg.value = res.message
      return false
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : '获取商品列表失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 购买金币商品。
   * @param characterId - 当前角色 ID
   * @param shopItemId - 商品 ID
   * @param quantity - 购买数量
   * @returns 操作结果，失败时返回 null
   */
  async function purchaseItem(characterId: string, shopItemId: string, quantity: number): Promise<ShopActionResult | null> {
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await purchaseShopItemApi({ characterId, shopItemId, quantity })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '购买失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 兑换竞技皮肤。
   * @param characterId - 当前角色 ID
   * @param shopItemId - 皮肤商品 ID
   * @returns 操作结果，失败时返回 null
   */
  async function redeemSkin(characterId: string, shopItemId: string): Promise<ShopActionResult | null> {
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await redeemShopSkinApi({ characterId, shopItemId })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '兑换失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 启用角色皮肤。
   * @param characterId - 当前角色 ID
   * @param skinId - 皮肤 ID
   * @returns 操作结果，失败时返回 null
   */
  async function equipSkin(characterId: string, skinId: string): Promise<ShopActionResult | null> {
    actionLoading.value = true
    actionErrorMsg.value = ''
    try {
      const res = await equipCharacterSkinApi({ characterId, skinId })
      if (res.code === 200) {
        applyActionResult(res.data)
        return res.data
      }
      actionErrorMsg.value = res.message
      return null
    } catch (err: unknown) {
      actionErrorMsg.value = err instanceof Error ? err.message : '启用皮肤失败'
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * 清空商店状态。
   * @returns 无返回值
   */
  function clear(): void {
    overview.value = null
    items.value = []
    skins.value = []
    balances.value = createEmptyBalances()
    activeSkinId.value = ''
    errorMsg.value = ''
    actionErrorMsg.value = ''
  }

  return {
    overview,
    items,
    skins,
    balances,
    activeSkinId,
    loading,
    actionLoading,
    errorMsg,
    actionErrorMsg,
    goldItems,
    arenaSkinItems,
    ownedSkins,
    activeSkin,
    fetchOverview,
    fetchItems,
    purchaseItem,
    redeemSkin,
    equipSkin,
    clear
  }
})
```

- [ ] Run:

```bash
npm run build
```

Expected result: store compiles.

---

## Step 4: Build `ShopPanel.vue`

**Intent:** Replace the placeholder with a usable, design-consistent shop panel.

- [ ] Create folder `src/components/shop`.
- [ ] Create `src/components/shop/ShopPanel.vue`.

Implementation requirements:

- Use `UiTabs`, `UiButton`, `UiBadge`.
- Use lucide icons like `Coins`, `Trophy`, `ShoppingBag`, `Check`, `Shirt`, `Minus`, `Plus`, `Loader2`.
- Keep layout dense and app-like:
  - top asset bar
  - tabs
  - grid of item cards
  - owned skins view
- Use only `DESIGN.md` tokens and existing colors.
- No explanatory tutorial text in the app.
- Add comments to all local functions.

Core script shape:

```ts
type ShopTab = 'gold' | 'arena' | 'owned'

interface Props {
  characterId: string | null
  profession: number
  balances: ShopBalances
  items: ShopItem[]
  skins: CharacterSkin[]
  loading?: boolean
  actionLoading?: boolean
}

interface Emits {
  (e: 'purchase', item: ShopItem, quantity: number): void
  (e: 'redeem-skin', item: ShopItem): void
  (e: 'equip-skin', skin: CharacterSkin): void
  (e: 'refresh'): void
}
```

Important functions:

```ts
/**
 * 读取商品当前选择数量。
 * @param itemId - 商品 ID
 * @returns 当前数量，默认 1
 */
function getQuantity(itemId: string): number

/**
 * 调整商品购买数量并限制在合法范围内。
 * @param item - 商品配置
 * @param delta - 增减数量
 * @returns 无返回值
 */
function adjustQuantity(item: ShopItem, delta: number): void

/**
 * 计算当前商品总价。
 * @param item - 商品配置
 * @returns 当前数量下的总价
 */
function totalPrice(item: ShopItem): number

/**
 * 判断当前余额是否足够购买商品。
 * @param item - 商品配置
 * @returns 是否可支付
 */
function canAfford(item: ShopItem): boolean

/**
 * 处理金币商品购买按钮。
 * @param item - 被购买商品
 * @returns 无返回值
 */
function handlePurchase(item: ShopItem): void

/**
 * 处理皮肤兑换按钮。
 * @param item - 被兑换皮肤商品
 * @returns 无返回值
 */
function handleRedeem(item: ShopItem): void

/**
 * 处理皮肤启用按钮。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
function handleEquipSkin(skin: CharacterSkin): void
```

Template behavior:

- `gold` tab renders only `item.price.currency === 'gold'`.
- `arena` tab renders only `item.price.currency === 'pvp_coin'`.
- `owned` tab renders `skins.filter(s => s.owned)`.
- Skin cards show image preview when `previewImageUrl` or `portraitUrl` exists.
- Disable equip when `skin.profession !== profession`.
- Show `已启用`, `已解锁`, `竞技币不足`, `金币不足` states with buttons/badges.

CSS constraints:

- Cards: `border-radius: 16px` because `DESIGN.md` allows card/panel 16-20px.
- Buttons use `UiButton`; custom small quantity buttons are 32px square, `border-radius: 8px`.
- Use grid `repeat(auto-fit, minmax(220px, 1fr))`.
- Add responsive rule at `max-width: 720px` to single column and full-width actions.

- [ ] Run:

```bash
npm run build
```

Expected result: component compiles, unused imports cleaned.

---

## Step 5: Wire Shop Into HomeView

**Intent:** Make the bottom nav shop entry open real UI and refresh affected panels.

- [ ] Update imports in `src/views/HomeView.vue`:

```ts
import { useShopStore } from '../stores/shop'
import ShopPanel from '../components/shop/ShopPanel.vue'
```

- [ ] Extend view types:

```ts
type CenterView = 'home' | 'map' | 'dungeon' | 'friend' | 'chat' | 'team' | 'leaderboard' | 'arena' | 'shop' | 'battle'
type BattleReturnView = Exclude<CenterView, 'home' | 'battle' | 'shop'>
```

`shop` is not a battle return view unless a future shop action starts combat.

- [ ] Create store:

```ts
const shop = useShopStore()
```

- [ ] Add shop to `bottomNavItems` and remove the separate placeholder `UiButton`:

```ts
{ value: 'shop', label: '商店', icon: markRaw(Store) }
```

- [ ] Add center branch before home branch:

```vue
<UiPanel v-else-if="centerView === 'shop'" class="game-main" stretch>
  <ShopPanel
    :character-id="charStore.selectedCharacterId"
    :profession="charDetail?.profession ?? 1"
    :balances="shop.balances"
    :items="shop.items"
    :skins="shop.skins"
    :loading="shop.loading"
    :action-loading="shop.actionLoading"
    @refresh="handleRefreshShop"
    @purchase="handlePurchaseShopItem"
    @redeem-skin="handleRedeemShopSkin"
    @equip-skin="handleEquipShopSkin"
  />
</UiPanel>
```

- [ ] Add functions:

```ts
/**
 * 刷新当前角色商店概览。
 * @returns 无返回值
 */
async function handleRefreshShop(): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return
  const ok = await shop.fetchOverview(characterId)
  if (!ok && shop.errorMsg) showToast(shop.errorMsg, 'error')
}

/**
 * 处理商店金币商品购买。
 * @param item - 被购买商品
 * @param quantity - 购买数量
 * @returns 无返回值
 */
async function handlePurchaseShopItem(item: ShopItem, quantity: number): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return
  const result = await shop.purchaseItem(characterId, item.id, quantity)
  if (result) {
    showToast(result.message, 'success')
    if (result.inventoryChanged) await inventory.fetchInventory(characterId)
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
  }
}

/**
 * 处理竞技币皮肤兑换。
 * @param item - 被兑换皮肤商品
 * @returns 无返回值
 */
async function handleRedeemShopSkin(item: ShopItem): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return
  const result = await shop.redeemSkin(characterId, item.id)
  if (result) {
    showToast(result.message, 'success')
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
  }
}

/**
 * 处理商店或装备页皮肤启用。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
async function handleEquipShopSkin(skin: CharacterSkin): Promise<void> {
  const characterId = charStore.selectedCharacterId
  if (!characterId) return
  const result = await shop.equipSkin(characterId, skin.skinId)
  if (result) {
    await charStore.fetchCharacterDetail(characterId)
    showToast(result.message, 'success')
  } else if (shop.actionErrorMsg) {
    showToast(shop.actionErrorMsg, 'error')
  }
}
```

- [ ] Update `loadCharacterDetail()` Promise:

```ts
await Promise.all([
  charStore.fetchCharacterDetail(characterId),
  inventory.fetchInventory(characterId),
  fetchPetList(characterId),
  shop.fetchOverview(characterId)
])
```

- [ ] Update `handleLogout()`:

```ts
shop.clear()
```

- [ ] Run:

```bash
npm run build
```

Expected result: shop is reachable from bottom nav.

---

## Step 6: Add Skin Switching To Character Panel And Equipment Grid

**Intent:** Let players switch unlocked skins from the equipment tab, where day-to-day appearance management belongs.

- [ ] Update `src/components/character/CharacterPanel.vue`.

Imports:

```ts
import type { CharacterSkin } from '../../types/shop'
```

Props:

```ts
skins?: CharacterSkin[]
```

Emits:

```ts
(e: 'equip-skin', skin: CharacterSkin): void
```

Pass to grid:

```vue
<CharacterEquipmentGrid
  ...
  :skins="skins"
  @equip-skin="handleEquipSkin"
/>
```

Function:

```ts
/**
 * 请求启用角色皮肤。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
function handleEquipSkin(skin: CharacterSkin): void {
  emit('equip-skin', skin)
}
```

- [ ] Update `src/components/character/CharacterEquipmentGrid.vue`.

Imports:

```ts
import type { CharacterSkin } from '../../types/shop'
```

Props:

```ts
skins?: CharacterSkin[]
```

Emits:

```ts
(e: 'equip-skin', skin: CharacterSkin): void
```

Computed:

```ts
/**
 * 当前职业可展示的皮肤列表。
 * @returns 当前职业默认皮肤与已拥有皮肤
 */
const availableSkins = computed(() =>
  props.skins.filter(skin => skin.profession === props.profession && skin.owned)
)
```

Function:

```ts
/**
 * 点击皮肤选项并派发启用请求。
 * @param skin - 被点击皮肤
 * @returns 无返回值
 */
function handleSkinClick(skin: CharacterSkin): void {
  if (!skin.owned || skin.enabled) return
  emit('equip-skin', skin)
}
```

Template location: directly under `.equip-doll__portrait` or immediately after `.equip-doll__body`, add a compact switcher:

```vue
<div v-if="availableSkins.length > 1" class="equip-skins" aria-label="角色皮肤">
  <button
    v-for="skin in availableSkins"
    :key="skin.skinId"
    class="equip-skin"
    :class="{ 'equip-skin--active': skin.enabled }"
    type="button"
    :disabled="skin.enabled"
    @click="handleSkinClick(skin)"
  >
    <img v-if="skin.portraitUrl" :src="skin.portraitUrl" :alt="skin.name" class="equip-skin__thumb" />
    <span class="equip-skin__name">{{ skin.name }}</span>
  </button>
</div>
```

CSS:

- Use `display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 8px;`
- Buttons use `background: var(--bg-panel-light)`, `border: 1px solid var(--border-light)`, `border-radius: 8px`.
- Thumbnail fixed to 44px square with `object-fit: contain`.
- Active state uses `border-color: var(--accent-blue)` and subtle `box-shadow`.

- [ ] Update `HomeView.vue` `CharacterPanel` usage:

```vue
:skins="shop.ownedSkins"
@equip-skin="handleEquipShopSkin"
```

- [ ] Run:

```bash
npm run build
```

Expected result: equipment tab compiles and displays skin switcher when owned skins exist.

---

## Step 7: Write Backend Integration Document

**Intent:** Provide the handoff requested by the user without generating backend code.

- [ ] Create root file `商店系统-后端对接文档.md`.

Required sections:

1. `# 商店系统后端对接文档`
2. `## 前端范围与后端职责`
3. `## 数据模型建议`
   - `shop_items`
   - `character_currencies`
   - `user_currencies`
   - `user_skins`
   - `character_skin_state`
4. `## 前端类型映射`
   - map `ShopItem`, `ShopBalances`, `CharacterSkin`, `ShopOverview`, `ShopActionResult`
5. `## 接口清单`
   - `GET /shop/overview?characterId=...`
   - `GET /shop/items?characterId=...`
   - `POST /shop/purchase`
   - `POST /shop/skins/redeem`
   - `POST /shop/skins/equip`
6. `## 请求与响应示例`
7. `## 错误码约定`
   - `400 INVALID_QUANTITY`
   - `400 INSUFFICIENT_GOLD`
   - `400 INSUFFICIENT_PVP_COIN`
   - `400 SKIN_ALREADY_OWNED`
   - `400 SKIN_PROFESSION_MISMATCH`
   - `403 SKIN_NOT_OWNED`
   - `404 SHOP_ITEM_NOT_FOUND`
   - `404 CHARACTER_NOT_FOUND`
8. `## 安全与并发要求`
   - price must come from server config
   - purchase/redeem must be transactional
   - idempotency recommendation for purchase/redeem
   - frontend balances are display-only
9. `## Mock 与真实接口替换点`

Use JSON examples matching the actual frontend types.

- [ ] Run:

```bash
npm run build
```

Expected result: docs do not affect build.

---

## Step 8: Verification

**Intent:** Prove the feature works before claiming completion.

- [ ] Run type/build verification:

```bash
npm run build
```

Expected result: `vue-tsc -b && vite build` succeeds.

- [ ] Use the in-app Browser skill against the existing local URL `http://localhost:64413/` or current dev server:
  - Enable Mock mode if needed.
  - Login/select character if the app is not already in game.
  - Click bottom nav `商店`.
  - Verify gold tab renders products and balances.
  - Buy `小型生命药水` quantity 1 or 2.
  - Verify toast appears and right-side backpack count changes.
  - Redeem `战士·英灵召唤` with arena currency.
  - Click quick equip in shop.
  - Verify character portrait/纸娃娃 changes to `/assets/portraits/warrior_invoke.png`.
  - Open character `装备` tab.
  - Switch back to default skin, then back to invoke skin.
  - Verify no text overlaps at desktop viewport.

- [ ] Optional small-screen browser check:
  - Set viewport to around 390 x 844.
  - Confirm shop cards become single column and action text fits.

- [ ] Inspect changed files:

```bash
git diff -- src/types/shop.ts src/config/shop_config.ts src/api/shop.ts src/stores/shop.ts src/components/shop/ShopPanel.vue src/testing/suites/shopTests.ts src/testing/registry.ts src/api/index.ts src/api/inventory.ts src/api/character.ts src/components/character/CharacterPanel.vue src/components/character/CharacterEquipmentGrid.vue src/views/HomeView.vue 商店系统-后端对接文档.md
```

Expected result: no unrelated dirty changes included.

---

## Step 9: Commit

Only stage files from this task. There are existing unrelated dirty files in the worktree; do not stage them.

```bash
git add src/types/shop.ts \
  src/config/shop_config.ts \
  src/api/shop.ts \
  src/stores/shop.ts \
  src/components/shop/ShopPanel.vue \
  src/testing/suites/shopTests.ts \
  src/testing/registry.ts \
  src/api/index.ts \
  src/api/inventory.ts \
  src/api/character.ts \
  src/components/character/CharacterPanel.vue \
  src/components/character/CharacterEquipmentGrid.vue \
  src/views/HomeView.vue \
  商店系统-后端对接文档.md
git commit -m "feat: add shop and skin switching"
```

If the user chooses to commit only after manual review, stop after verification and report the exact file list.

---

## Notes For Implementer

- Keep all new/changed frontend functions documented with function-level comments.
- Do not add backend code, database migrations, server routes, or server config.
- `hunter_raiden.png` is intentionally not included in this first shop version.
- The current branch has unrelated dirty files. Work with the existing state and avoid reverting or staging unrelated changes.
- If tests fail because an earlier suite disables Mock mode, explicitly call `enableMock()` at the start of each shop test case.
