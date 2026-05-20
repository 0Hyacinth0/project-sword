# 商店系统与职业皮肤设计

## 目标

实现首版商店系统，替换主页底部导航中的商店占位反馈。商店支持多货币购买：当前角色金币购买补给和基础材料，账号竞技币兑换职业皮肤。竞技币首版仅兑换 `*_invoke` 职业皮肤，并新增皮肤切换功能。所有实现限定在前端范围内，后端以对接文档为准承接最终扣费、发货和状态持久化。

## 已确认范围

- 商店采用 API 形状先行 + Mock 实现。
- 金币归属当前角色，竞技币归属账号。
- 竞技币首版只兑换皮肤，不兑换装备、材料或属性资源。
- 皮肤按账号 + 职业解锁：账号解锁 `warrior_invoke` 后，该账号下所有战士角色都可使用。
- 商店内可购买和快速启用皮肤；角色装备页可日常切换皮肤。
- 首版竞技皮肤使用现有资源：
  - `/assets/portraits/warrior_invoke.png`
  - `/assets/portraits/mage_invoke.png`
  - `/assets/portraits/hunter_invoke.png`
- `hunter_raiden.png` 不进入本首版范围，后续可作为第二批皮肤配置。

## 非目标

- 不实现真实后端、数据库脚本、服务器配置或支付系统。
- 不实现充值、人民币道具、折扣活动、每日刷新、复杂订单流水 UI。
- 不改变职业、战斗、装备、战宠或 PVP 积分规则。
- 不把竞技币用于除皮肤外的商品。

## 页面与交互设计

### 主页商店入口

`HomeView.vue` 的底部导航将「商店」从 toast 占位改为真实中栏视图。点击后设置 `centerView = 'shop'`，中栏展示 `ShopPanel`，右侧背包保持可见，使玩家购买补给或材料后能立刻看到背包变化。

### ShopPanel 结构

`ShopPanel` 使用现有 Liquid Glass 设计语言和 UI 基础组件，不新增设计 token。

商店分为三块：

1. 顶部资产条
   - 展示当前角色金币。
   - 展示账号竞技币。
   - 展示当前角色职业。
   - 展示当前启用皮肤名称或默认皮肤。

2. 商品标签
   - 金币商店：生命药水、魔法药水、经验卷轴、基础强化材料。
   - 竞技商店：三张职业 invoke 皮肤。
   - 已拥有：账号已解锁皮肤，支持当前职业可用皮肤快速启用。

3. 商品卡片与操作区
   - 金币商品支持数量选择，默认数量为 1。
   - 金币商品显示单价、库存/限购提示、总价和购买按钮。
   - 竞技皮肤显示职业、预览图、竞技币价格、兑换按钮或已解锁状态。
   - 已拥有且职业匹配的皮肤显示启用按钮。
   - 职业不匹配的皮肤可展示但禁用启用，提示切换到对应职业角色后可使用。

### 角色装备页皮肤切换

`CharacterEquipmentGrid.vue` 在纸娃娃立绘附近增加轻量皮肤选择区：

- 默认皮肤永远可用。
- 当前职业已解锁皮肤可选。
- 当前启用皮肤高亮。
- 点击已解锁皮肤触发 `equip-skin` 事件。
- 组件只负责展示与派发事件，不直接调用 API。

## 数据模型设计

### 货币

```ts
export type ShopCurrencyType = 'gold' | 'pvp_coin'

export interface ShopBalances {
  characterGold: number
  accountPvpCoin: number
}
```

`characterGold` 属于当前角色。`accountPvpCoin` 属于账号。

### 商品

```ts
export type ShopItemKind = 'inventory_item' | 'skin'

export interface ShopPrice {
  currency: ShopCurrencyType
  amount: number
}

export interface ShopItem {
  id: string
  kind: ShopItemKind
  name: string
  description: string
  category: 'supply' | 'material' | 'skin'
  rarity: 'Normal' | 'Rare' | 'Epic' | 'Legendary'
  price: ShopPrice
  previewImageUrl?: string
  itemId?: number
  skinId?: string
  profession?: 1 | 2 | 3
  maxPurchaseQuantity: number
  owned?: boolean
  enabled?: boolean
}
```

金币商品通过 `itemId` 指向现有 `BaseItem` 模板。皮肤商品通过 `skinId` 指向皮肤配置。

### 皮肤

```ts
export interface CharacterSkin {
  skinId: string
  name: string
  profession: 1 | 2 | 3
  portraitUrl: string
  source: 'default' | 'pvp_shop'
  owned: boolean
  enabled: boolean
}
```

默认皮肤由职业配置提供，`owned = true`。竞技皮肤兑换后在账号维度拥有，启用状态在角色维度保存。

## 前端模块边界

### `src/types/shop.ts`

新增商店相关类型，包括：

- `ShopCurrencyType`
- `ShopBalances`
- `ShopPrice`
- `ShopItem`
- `CharacterSkin`
- `ShopOverview`
- `PurchaseShopItemParams`
- `RedeemSkinParams`
- `EquipSkinParams`
- `ShopActionResult`

### `src/api/shop.ts`

新增 API 形状和 Mock 实现：

- `getShopOverviewApi(characterId)`
- `getShopItemsApi(characterId)`
- `purchaseShopItemApi(params)`
- `redeemShopSkinApi(params)`
- `equipCharacterSkinApi(params)`

Mock 模式负责：

- 提供演示金币和竞技币余额。
- 提供金币商品和 invoke 皮肤商品。
- 购买金币商品时扣除当前角色金币，并向 `mockInventoryItems` 添加或叠加背包物品。
- 兑换皮肤时扣除账号竞技币，并写入账号已拥有皮肤集合。
- 启用皮肤时更新当前角色 `portraitUrl`，使角色详情和纸娃娃立绘同步。

Mock 数据只用于前端演示；真实环境由后端保证扣费、发货和并发安全。

### `src/stores/shop.ts`

新增 Pinia store：

- `overview`
- `items`
- `balances`
- `ownedSkins`
- `activeSkin`
- `loading`
- `actionLoading`
- `errorMsg`

主要方法：

- `fetchOverview(characterId)`
- `fetchItems(characterId)`
- `purchaseItem(characterId, shopItemId, quantity)`
- `redeemSkin(characterId, shopItemId)`
- `equipSkin(characterId, skinId)`
- `clear()`

购买或启用成功后，store 返回结构化结果，由 `HomeView` 负责触发 toast，并刷新背包与角色详情：

- `inventory.fetchInventory(characterId)`
- `charStore.fetchCharacterDetail(characterId)`

### `src/components/shop/ShopPanel.vue`

新增商店面板组件：

- 接收当前角色 ID、职业、余额、商品、拥有皮肤和加载状态。
- 通过事件请求购买、兑换、启用皮肤。
- 包含购买数量 UI、商品筛选标签、余额不足禁用态。
- 所有函数需有函数级注释。

### `src/components/character/CharacterEquipmentGrid.vue`

扩展现有纸娃娃组件：

- 接收 `skins?: CharacterSkin[]`。
- 新增 `equip-skin` 事件。
- 展示默认皮肤与当前职业已解锁皮肤。
- 只处理 UI 展示，不持有商店业务状态。

### `src/views/HomeView.vue`

接入商店：

- 扩展 `BattleReturnView` 或中栏视图类型，加入 `shop`。
- 底部导航加入商店项。
- 中栏新增 `<ShopPanel />` 分支。
- 调用 `useShopStore()`。
- 在角色切换、页面加载或商店打开时加载商店 overview。
- 处理购买/兑换/启用事件，成功后刷新背包和角色详情，并用主页级 toast 展示结果。

## 购买规则

### 金币商品

- 数量默认 1。
- 数量范围为 `1..maxPurchaseQuantity`。
- 总价为 `unitPrice * quantity`。
- 当前角色金币不足时购买按钮禁用。
- 后端最终校验：
  - 当前角色是否存在。
  - 商品是否上架。
  - 数量是否合法。
  - 金币是否足够。
  - 背包是否可容纳。
- 成功后返回新余额、背包变更和提示文案。

### 竞技皮肤

- 只消耗账号竞技币。
- 已拥有皮肤不可重复兑换。
- 非当前职业皮肤可以兑换，但不能启用。
- 启用皮肤时必须校验皮肤职业与当前角色职业一致。
- 成功启用后，当前角色 `portraitUrl` 立即更新。

### 默认皮肤

- 默认皮肤永远可用。
- 不需要购买。
- 可以从装备页切回默认皮肤。
- 启用默认皮肤时后端可保存空 `skinId` 或保存职业默认皮肤 ID；前端最终以返回的 `portraitUrl` 为准。

## 错误处理

所有操作使用 toast 反馈：

- 成功：购买成功、兑换成功、皮肤已启用。
- 错误：余额不足、竞技币不足、商品下架、已拥有、职业不匹配、背包容量不足、网络失败。
- 信息：非当前职业皮肤不可启用时使用轻量提示，不阻断浏览。

按钮状态：

- `loading` 时显示骨架或加载提示。
- `actionLoading` 时禁用正在操作的商品按钮。
- 余额不足时按钮禁用并显示缺口。
- 已拥有皮肤显示已解锁，不展示兑换按钮。
- 当前已启用皮肤显示已启用，不展示重复启用按钮。

## 后端对接文档范围

新增 `商店系统-后端对接文档.md`，包含：

- 数据模型建议：
  - `shop_items`
  - `character_currencies`
  - `user_currencies`
  - `user_skins`
  - `character_skin_state`
- 接口：
  - `GET /shop/overview`
  - `GET /shop/items`
  - `POST /shop/purchase`
  - `POST /shop/skins/redeem`
  - `POST /shop/skins/equip`
- 请求参数、响应 JSON 示例、错误码。
- 前端 Mock 字段与后端字段映射。
- 并发与安全要求：
  - 扣费和发货必须在后端事务中完成。
  - 前端传入价格仅用于展示，后端必须以服务端商品配置为准。
  - 皮肤拥有关系必须按账号校验，启用状态按角色校验。

## 测试与验证

### 类型与构建

- `npm run build` 必须通过。

### 前端测试页

新增或扩展测试套件，覆盖：

- 商店 overview 返回金币、竞技币、皮肤状态。
- 金币商品购买成功后余额减少，背包增加。
- 金币不足时返回错误。
- 竞技币兑换皮肤成功后拥有状态变更。
- 重复兑换返回错误。
- 职业匹配时可启用皮肤。
- 职业不匹配时启用失败。

### 浏览器验证

Mock 模式下验证：

- 登录、选角后进入主页。
- 点击底部「商店」显示商店面板。
- 金币商品可购买，右侧背包刷新。
- 竞技皮肤可兑换，已拥有状态刷新。
- 商店内可快速启用当前职业皮肤。
- 角色装备页可切换默认皮肤和已拥有皮肤。
- 切换后纸娃娃立绘立即变化。

## 交付物

- 前端商店类型、API、store、面板组件和样式。
- 主页商店入口接入。
- 角色装备页皮肤切换入口。
- Mock 演示数据与购买/兑换/启用流程。
- `商店系统-后端对接文档.md`。
- 构建和浏览器验证记录。
