# API 接口文档

> 版本：v1.0.0
> 更新日期：2026-05-20
> 说明：本文档整合了所有后端对接接口，按功能模块分类

---

## 目录

1. [概述](#概述)
2. [角色模块](#一角色模块)
3. [装备模块](#二装备模块)
4. [背包模块](#三背包模块)
5. [技能模块](#四技能模块)
6. [战宠模块](#五战宠模块)
7. [战斗模块](#六战斗模块)
8. [副本模块](#七副本模块)
9. [多人副本房间模块](#八多人副本房间模块)
10. [团队副本Boss模块](#九团队副本boss模块)
11. [组队模块](十组队模块)
12. [竞技场/PVP模块](#十一竞技场pvp模块)
13. [社交模块](#十二社交模块)
14. [聊天模块](#十三聊天模块)
15. [地图模块](#十四地图模块)
16. [排行榜模块](#十五排行榜模块)
17. [商店模块](#十六商店模块)
18. [附录](#附录)

---

## 概述

### 统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 认证方式

- **请求头**: `X-Access-Token: {JWT_TOKEN}`
- **Base URL**: `/jeecg-boot/webgame`

### 错误响应格式

```json
{
  "code": 400,
  "message": "错误描述",
  "data": null,
  "errorCode": "ERROR_CODE"
}
```

---

## 一、角色模块

### 1.1 获取角色详情

| 项目 | 内容 |
|---|---|
| **方法** | `GET` |
| **路径** | `/character/info/{characterId}` |
| **说明** | 获取角色完整信息，含基础属性、装备(六槽位)、出战战宠 |

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色ID |

**主要响应字段**:

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 角色ID |
| characterName | String | 角色名称 |
| profession | Number | 职业编号: 1-战士, 2-法师, 3-猎人 |
| level | Number | 当前等级 |
| experience | Number | 当前经验值 |
| nextLevelExp | Number | 升级所需经验 |
| availablePoints | Number | 可用属性点数 |
| strength | Number | 力量值 |
| intelligence | Number | 智力值 |
| agility | Number | 敏捷值 |
| hp / maxHp | Number | 当前/最大生命值 |
| mp / maxMp | Number | 当前/最大魔法值 |
| physicalAttack | Number | 物理攻击力 |
| magicAttack | Number | 魔法攻击力 |
| defense | Number | 防御力 |
| dodgeRate | Number | 闪避率(0-1小数) |
| criticalRate | Number | 暴击率(0-1小数) |
| equipment | Object | 六槽位装备对象 |
| activePet | Object/null | 出战战宠信息 |

---

### 1.2 属性加点

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/character/update-attributes` |
| **说明** | 分配属性点 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色ID |
| str | Number | 是 | 力量增加值(非负整数) |
| int | Number | 是 | 智力增加值(非负整数) |
| agi | Number | 是 | 敏捷增加值(非负整数) |

**校验规则**: `str + int + agi` 不超过 `availablePoints`

**错误码**: 400(可用属性点不足), 404(角色不存在)

---

### 1.3 增加经验

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/character/add-experience` |
| **说明** | 增加角色经验，处理升级逻辑 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| expToAdd | Number | 是 | 要增加的经验值(>=0) |

**响应字段**:

| 字段 | 类型 | 说明 |
|---|---|---|
| character | Object | 更新后的完整角色数据 |
| levelUp | Object/null | 升级结果，未升级时为null |

**LevelUpResult**: `{ oldLevel, newLevel, levelsGained, pointsGained, overflowExp, isNewMaxLevel }`

---

## 二、装备模块

### 2.1 穿戴装备

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/equipment/equip` |
| **说明** | 将背包中的装备穿戴到对应槽位，自动替换旧装备 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| inventoryId | String | 是 | 背包中装备物品的记录ID |

**错误码**: 400(该物品不是装备/角色等级不足/背包已满), 404(物品不存在)

---

### 2.2 卸下装备

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/equipment/unequip` |
| **说明** | 将指定槽位的装备卸下放回背包 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| slotType | String | 是 | 槽位类型(weapon/helmet/chest/legs/accessory1/accessory2) |

**错误码**: 400(该槽位没有装备/背包已满), 404(角色不存在)

---

### 2.3 强化装备

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/equipment/enhance` |
| **说明** | 消耗材料和金币提升装备强化等级(+0~+10)，有成功率机制 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| slotType | String | 是 | 装备槽位类型 |

**响应**: `{ success: boolean, newLevel: number, message: string, character: {...} }`

**强化规则**:

| 等级区间 | 消耗材料 | 金币 | 成功率 |
|---|---|---|---|
| +0 -> +3 | 铁矿石 x3 | 100 | 100% |
| +3 -> +6 | 精钢矿石 x2 | 300 | 90% |
| +6 -> +8 | 秘法水晶 x1 | 800 | 70% |
| +8 -> +10 | 秘法水晶 x2 + 龙鳞碎片 x1 | 2000 | 50% |

---

## 三、背包模块

### 3.1 获取背包物品列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/inventory/list/{characterId}` |
| **说明** | 获取角色完整背包物品列表 |

**响应字段** (数组):

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | 背包记录唯一标识 |
| characterId | UUID | 所属角色 |
| itemId | Number | 物品模板ID |
| item | Object | 物品详情(JOIN items表) |
| quantity | Number | 持有数量 |
| obtainedAt | String | 获取时间(ISO格式) |
| extraStats | Array | 随机词条(装备类) |

**ItemDetail**: `{ itemId, name, category, rarity, description, iconUrl, maxStack, sellPrice, effects?, source?, usage? }`

---

### 3.2 使用消耗品

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/inventory/use` |
| **说明** | 使用消耗品类物品(药水/经验卷轴/复活卷轴) |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| inventoryId | String | 是 | 背包记录唯一ID |
| quantity | Int | 是 | 使用数量(>=1) |

**响应**: `{ effects: string[], message: string }`

**错误码**: 400(该物品无法使用/数量不足/HP已满/MP已满), 404(物品不存在)

---

### 3.3 丢弃物品

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/inventory/discard` |
| **说明** | 丢弃背包中的物品(不可撤销) |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | UUID | 是 | 角色UUID |
| inventoryId | String | 是 | 背包记录唯一ID |
| quantity | Int | 是 | 丢弃数量(>=1) |

**错误码**: 400(数量不足), 404(物品不存在), 403(无权操作)

---

## 四、技能模块

### 4.1 获取角色技能列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/skills/{characterId}` |
| **说明** | 获取指定角色的已解锁技能列表(分主动/被动两组) |

**响应**:

```typescript
{
  activeSkills: Array<{
    id: number; name: string
    type: 'active_attack' | 'active_heal' | 'active_buff'
    power: number; cooldown: number; mpCost: number
    targetType: 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies'
    description: string
    attachedBuff: BuffTemplate | null
    element: number  // 0-无, 1-火, 2-水, 3-风, 4-地, 5-光, 6-暗
  }>,
  passiveSkills: Array<{
    id: number; name: string
    type: 'passive'
    passiveTrigger: string
    triggerChance: number
    attachedBuff: BuffTemplate
  }>
}
```

---

## 五、战宠模块

### 5.1 获取战宠列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/pet/list` |
| **说明** | 获取角色战宠列表 |

**Query参数**: `characterId` (string, 必填)

**响应字段** (数组):

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 战宠实例ID |
| petTypeId | Number | 战宠类型ID |
| nickname | String | 昵称 |
| level | Number | 等级 |
| exp / maxExp | Number | 经验值 |
| rarity | Number | 品质(1-N, 2-R, 3-SR, 4-SSR) |
| isActive | Boolean | 是否出战 |
| stats | Object | 属性(hp, maxHp, attack, defense, speed) |
| bonusToOwner | Object | 给主人加成(hp, attack, defense) |
| skillSlots | Array | 技能槽(最多3个) |
| equipment | Object | 装备(armor, accessory) |

---

### 5.2 获取战宠详情

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/pet/{id}` |
| **说明** | 获取战宠完整详情 |

**路径参数**: `id` - 战宠实例UUID

**响应**: 包含列表接口所有字段，额外包含 `learnedSkills`, `evolveInfo`

---

### 5.3 重命名战宠

| 项目 | 内容 |
|---|---|---|
| **方法** | `PUT` |
| **路径** | `/pet/rename` |
| **说明** | 重命名战宠昵称 |

**请求体**: `{ petId: string, nickname: string(1-12字符) }`

---

### 5.4 设置出战战宠

| 项目 | 内容 |
|---|---|---|
| **方法** | `PUT` |
| **路径** | `/pet/set-active` |
| **说明** | 设置出战战宠，petId为空则取消出战 |

**请求体**: `{ petId: string | null }`

---

### 5.5 喂食经验道具

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/feed` |
| **说明** | 喂食经验道具，增加战宠经验 |

**请求体**: `{ petId: string, itemId: number, quantity: number }`

---

### 5.6 战宠进化

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/evolve` |
| **说明** | 战宠进化，消耗材料提升品质 |

**请求体**: `{ petId: string }`

---

### 5.7 装备技能

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/equip-skill` |
| **说明** | 将已学会的技能装备到技能槽 |

**请求体**: `{ petId: string, skillId: number, slotIndex: number(0-2) }`

---

### 5.8 卸下技能

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/unequip-skill` |
| **说明** | 从技能槽卸下技能 |

**请求体**: `{ petId: string, slotIndex: number(0-2) }`

---

### 5.9 战宠穿戴装备

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/equip-item` |
| **说明** | 将背包装备穿戴到战宠 |

**请求体**: `{ petId: string, inventoryId: string, slotType: "armor" | "accessory" }`

---

### 5.10 战宠卸下装备

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/pet/unequip-item` |
| **说明** | 从战宠卸下装备回背包 |

**请求体**: `{ petId: string, slotType: "armor" | "accessory" }`

---

### 5.11 获取战宠图鉴

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/pet/types` |
| **说明** | 获取所有战宠类型静态数据 |

**响应**: `{ total: number, types: PetTypeConfig[] }`

---

### 5.12 获取已拥有战宠类型

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/pet/owned-types/{characterId}` |
| **说明** | 获取角色已拥有的战宠类型ID列表 |

**响应**: `{ ownedTypeIds: number[] }`

---

## 六、战斗模块

### 6.1 发起战斗

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/battle/start` |
| **说明** | 发起一场新战斗，后端创建战斗实例并返回敌人数据 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| characterId | String | 是 | 角色ID |
| dungeonId | String | 否 | 副本ID |
| stageId | String | 否 | 关卡ID |
| enemyGroupId | String | 否 | 怪物组ID(野外遭遇) |
| activePetId | String | 否 | 出战战宠ID |

**响应**: `{ battleId, enemies[], pet? }`

---

### 6.2 提交玩家行动

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/battle/action` |
| **说明** | 玩家每回合提交一次行动 |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| battleId | String | 是 | 战斗实例ID |
| action.type | String | 是 | 行动类型(attack/skill/item/defend/flee) |
| action.actorUid | String | 是 | 行动者UID |
| action.targetUid | String | 否 | 目标UID |
| action.skillId | Number | 否 | 技能ID |
| action.itemId | String | 否 | 物品ID |

**响应**: `{ battleState: { phase, round, combatants[], actionOrder[], log[], outcome, rewards, lastDamageResults[], lastBuffResults[] } }`

---

### 6.3 结束战斗

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/battle/end/{battleId}` |
| **说明** | 战斗结束后领取奖励 |

**响应**:

```typescript
{
  outcome: 'victory' | 'defeat' | 'fled',
  rewards: {
    exp: number; gold: number
    items: Array<{ itemId, name, quantity, quality? }>
    petExp?: number; levelUp?: boolean; newLevel?: number
  },
  statistics: {
    totalRounds: number; totalDamageDealt: number
    totalDamageTaken: number; totalHealed: number
    criticalHits: number; dodgeCount: number; enemiesKilled: number
  }
}
```

---

### 6.4 Boss战复活

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/battle/revive` |
| **说明** | 在Boss战中复活角色 |

**请求体**: `{ battleId: string, targetUid: string }`

**响应**: `{ targetUid, newHp, reviveCount }`

---

## 七、副本模块

### 7.1 进入单人副本

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/enter` |
| **说明** | 进入单人副本 |

**请求体**: `{ characterId: string, dungeonId: string }`

**响应**: `{ runId, staminaConsumed }`

---

### 7.2 单人副本楼层结算

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/floor/complete` |
| **说明** | 结算单人副本某一层 |

**请求体**: `{ runId, floorNumber, outcome, rewards, playerHpPercent, playerMpPercent }`

---

### 7.3 单人副本撤退

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/retreat` |
| **说明** | 撤退副本，发放累积奖励 |

**请求体**: `{ runId }`

---

### 7.4 单人副本通关

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/complete` |
| **说明** | 通关副本，发放全部奖励 |

**请求体**: `{ runId }`

---

### 7.5 多人副本战斗开始

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/multi-battle/start` |
| **说明** | 多人副本战斗开始，后端返回已缩放的怪物 |

**请求体**: `{ roomId, dungeonId, floor, members[] }`

**响应**: `{ battleId, enemies[], scaledBy }`

---

### 7.6 多人副本楼层结算

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/multi-battle/floor-complete` |
| **说明** | 多人副本楼层结算 |

**响应**: `{ exp, gold, memberDrops[] }`

---

### 7.7 多人副本通关

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon/multi-battle/complete` |
| **说明** | 多人副本通关结算 |

**响应**: `{ bonusExp, bonusGold, guaranteedItems[], memberTotalDrops[] }`

---

### 7.8 获取副本掉落表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/dungeon/drop-table/{dungeonId}` |
| **说明** | 获取副本掉落配置 |

**响应**: `{ dungeonId, dropRateMultiplier, floorDrops[], bossDrops[] }`

---

### 7.9 获取精英副本配置

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/dungeon/elite-config/{dungeonId}` |
| **说明** | 获取精英副本特殊配置 |

**响应**: `{ dungeonId, isElite, statMultiplier, skillGroupId, skills[] }`

---

## 八、多人副本房间模块

### 8.1 创建房间

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon-room/create` |
| **说明** | 创建多人副本房间 |

**请求体**: `{ teamId, dungeonId }`

---

### 8.2 获取房间详情

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/dungeon-room/:roomId` |
| **说明** | 获取房间详情 |

---

### 8.3 切换准备状态

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon-room/ready` |
| **说明** | 切换准备状态 |

**请求体**: `{ roomId }`

---

### 8.4 开始挑战

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon-room/start` |
| **说明** | 队长开始挑战 |

**请求体**: `{ roomId }`

**错误码**: 400(成员未准备), 403(不是队长)

---

### 8.5 离开房间

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/dungeon-room/leave` |
| **说明** | 离开房间 |

**请求体**: `{ roomId }`

---

### 8.6 取消房间

| 项目 | 内容 |
|---|---|---|
| **方法** | `DELETE` |
| **路径** | `/dungeon-room/cancel/:roomId` |
| **说明** | 队长取消房间 |

---

### WebSocket 事件

**连接地址**: `ws://{host}/jeecg-boot/webgame/ws/dungeon-room?token={jwt_token}`

| 方向 | 事件名 | 说明 |
|---|---|---|
| 客户端发送 | `room:create` | 创建房间 |
| 客户端发送 | `room:ready` | 切换准备状态 |
| 客户端发送 | `room:start` | 开始挑战 |
| 客户端发送 | `room:leave` | 离开房间 |
| 客户端发送 | `room:cancel` | 取消房间 |
| 服务端推送 | `room:created` | 房间创建成功 |
| 服务端推送 | `room:member_ready_changed` | 成员准备状态变更 |
| 服务端推送 | `room:status_changed` | 房间状态变更 |
| 服务端推送 | `room:started` | 战斗开始 |
| 服务端推送 | `room:member_left` | 成员离开 |
| 服务端推送 | `room:cancelled` | 房间已取消 |

---

## 九、团队副本Boss模块

### 9.1 获取Boss配置

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/boss/:bossId/config` |
| **说明** | 获取Boss多阶段配置 |

**响应**:

```typescript
{
  bossId, bossName,
  phases: [{ phase, hpThreshold, attackMultiplier, skillIds[] }],
  enrage: { enrageRound, attackMultiplier, speedMultiplier },
  revive: { reviveHpPercent, mpCost, maxRevives },
  aoeSkillIds[]
}
```

---

### WebSocket 事件

| 事件类型 | 数据 | 说明 |
|---|---|---|
| `boss_phase_change` | `{ battleId, newPhase, attackMultiplier }` | Boss阶段变更 |
| `boss_enrage` | `{ battleId, attackMultiplier, speedMultiplier }` | Boss狂暴 |

---

## 十、组队模块

### 10.1 创建队伍

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/create` |
| **说明** | 创建新队伍，创建者自动成为队长 |

**响应**: TeamInfo对象

**错误码**: 400(已在队伍中)

---

### 10.2 获取队伍列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/team/list` |
| **说明** | 获取所有开放中的队伍列表 |

**响应**: TeamInfo[] 数组

---

### 10.3 获取我的队伍

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/team/my` |
| **说明** | 获取当前角色所在队伍信息 |

**响应**: TeamInfo对象 或 `null`

---

### 10.4 邀请玩家

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/invite` |
| **说明** | 邀请玩家加入队伍 |

**请求体**: `{ characterId }` (被邀请者角色ID)

**错误码**: 400(未在队伍/队伍已满/该玩家已在队伍), 403(不是队长)

---

### 10.5 申请加入

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/apply` |
| **说明** | 申请加入队伍 |

**请求体**: `{ teamId }`

**错误码**: 400(已在队伍/已申请/队伍已满/已关闭), 404(队伍不存在)

---

### 10.6 获取申请列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/team/applications/:teamId` |
| **说明** | 队长获取队伍申请列表 |

**错误码**: 403(不是队长)

---

### 10.7 接受申请

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/accept` |
| **说明** | 队长接受申请 |

**请求体**: `{ applicationId }`

**错误码**: 400(队伍已满), 403(不是队长), 404(申请不存在)

---

### 10.8 拒绝申请

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/reject` |
| **说明** | 队长拒绝申请 |

**请求体**: `{ applicationId }`

---

### 10.9 踢出成员

| 项目 | 内容 |
|---|---|---|
| **方法** | `DELETE` |
| **路径** | `/team/kick/:characterId` |
| **说明** | 队长踢出成员 |

**错误码**: 403(不是队长/不能踢自己), 404(成员不在队伍)

---

### 10.10 离开队伍

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/leave` |
| **说明** | 离开当前队伍，队长离开自动转让 |

**错误码**: 400(未在队伍)

---

### 10.11 解散队伍

| 项目 | 内容 |
|---|---|---|
| **方法** | `DELETE` |
| **路径** | `/team/disband` |
| **说明** | 队长解散队伍 |

**错误码**: 400(未在队伍), 403(不是队长)

---

### 10.12 转让队长

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/change-leader` |
| **说明** | 队长转让给其他成员 |

**请求体**: `{ characterId }` (新队长角色ID)

**错误码**: 400(目标不是成员/不能转让给自己), 403(不是队长)

---

### 10.13 更改队伍状态

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/team/status` |
| **说明** | 更改队伍开放状态 |

**请求体**: `{ status: "open" | "closed" }`

**错误码**: 400(未在队伍/无效状态), 403(不是队长)

---

## 十一、竞技场/PVP模块

### 11.1 获取当前赛季信息

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/arena/season` |
| **说明** | 获取当前赛季信息 |

**响应**: `{ seasonId, seasonName, seasonNumber, startDate, endDate, isActive }`

---

### 11.2 获取玩家竞技数据

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/arena/me` |
| **说明** | 获取当前玩家竞技数据 |

**响应**: `{ tier, subTier, score, wins, losses, winRate, seasonId }`

---

### 11.3 发起匹配

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/arena/match` |
| **说明** | 发起PVP匹配 |

**请求体**: `{ score }`

**响应**: `{ characterId, characterName, profession, level, tier, subTier, score }` (匹配到的对手信息)

---

### 11.4 提交战斗结算

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/arena/settle` |
| **说明** | 提交PVP战斗结果 |

**请求体**: `{ opponentId, won }`

**响应**: `{ scoreChange, oldScore, newScore, tierChanged, oldTier, newTier }`

---

**段位体系**: 青铜(0-599) / 白银(600-1199) / 黄金(1200-1799) / 铂金(1800-2399) / 钻石(2400-2799) / 王者(2800+)

---

## 十二、社交模块

### 12.1 获取好友列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/social/friends` |
| **说明** | 获取好友列表、待处理请求、已发送请求 |

**响应**: `{ friends: FriendInfo[], pendingRequests: FriendRequest[], sentRequests: FriendRequest[] }`

---

### 12.2 搜索玩家

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/social/search` |
| **说明** | 搜索玩家 |

**Query参数**: `keyword` (string, >=2字符)

**响应**: `SearchPlayerResult[]`

---

### 12.3 发送好友请求

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/social/request` |
| **说明** | 发送好友请求 |

**请求体**: `{ toCharacterId }`

---

### 12.4 接受好友请求

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/social/accept` |
| **说明** | 接受好友请求 |

**请求体**: `{ requestId }`

---

### 12.5 拒绝好友请求

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/social/reject` |
| **说明** | 拒绝好友请求 |

**请求体**: `{ requestId }`

---

### 12.6 删除好友

| 项目 | 内容 |
|---|---|---|
| **方法** | `DELETE` |
| **路径** | `/social/remove` |
| **说明** | 删除好友 |

**Query参数**: `friendCharacterId`

---

### 12.7 取消好友请求

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/social/cancel` |
| **说明** | 取消已发送的好友请求 |

**请求体**: `{ requestId }`

---

## 十三、聊天模块

### 13.1 获取世界频道消息

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/chat/world` |
| **说明** | 获取世界频道消息历史 |

**Query参数**: `limit`(默认100, 最大200), `before`(游标)

---

### 13.2 获取私聊会话列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/chat/conversations` |
| **说明** | 获取私聊会话列表 |

---

### 13.3 获取私聊记录

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/chat/private/:targetId` |
| **说明** | 获取与指定玩家的私聊记录 |

**Query参数**: `limit`, `before`

---

### 13.4 发送消息

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/chat/send` |
| **说明** | 发送消息 |

**请求体**: `{ channel: "world" | "private", content, targetId? }`

---

### WebSocket

**连接地址**: `ws://{host}/jeecg-boot/webgame/ws/chat?token={jwt_token}`

| 方向 | 事件名 | 说明 |
|---|---|---|
| 服务端推送 | `chat:world` | 世界频道消息 |
| 服务端推送 | `chat:private` | 私聊消息 |
| 服务端推送 | `chat:system` | 系统消息 |
| 客户端发送 | `chat:send` | 发送消息 |

---

## 十四、地图模块

### 14.1 获取所有区域列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/map/areas` |
| **说明** | 获取所有地图区域列表 |

**响应**: `MapArea[]`

**MapArea**: `{ id, name, icon, levelRange[min,max], description, monsters[], drops[], unlockLevel }`

---

### 14.2 获取区域详情

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/map/area/{areaId}` |
| **说明** | 获取区域详情和今日探索次数 |

**响应**: `{ area: MapArea, exploreCount: number }`

---

### 14.3 进入区域探索

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/map/enter` |
| **说明** | 进入区域探索，触发野外战斗 |

**请求体**: `{ characterId, areaId }`

**响应**: `{ areaId, message }`

**错误码**: 403(等级不足), 404(区域不存在), 429(探索次数达上限)

---

### 14.4 进入副本

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/map/dungeon/enter` |
| **说明** | 进入副本(后续功能预留) |

**请求体**: `{ characterId, areaId, dungeonId }`

---

## 十五、排行榜模块

### 15.1 获取排行榜

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/leaderboard/:category` |
| **说明** | 获取排行榜数据 |

**路径参数**: `category` = `level`(等级) / `power`(战力) / `arena`(竞技积分)

**Query参数**: `scope` = `all`(全部) / `friends`(好友)

**响应**: `{ entries: [{ rank, characterId, characterName, profession, level, value, isOnline }], myRank, myValue }`

---

## 十六、商店模块

### 16.1 获取商店概览

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/shop/overview` |
| **说明** | 获取商店概览，包括余额、商品、皮肤列表 |

**Query参数**: `characterId`

**响应**: `ShopOverview { balances, items[], skins[], activeSkinId }`

---

### 16.2 获取商品列表

| 项目 | 内容 |
|---|---|---|
| **方法** | `GET` |
| **路径** | `/shop/items` |
| **说明** | 获取当前可见商品列表 |

**Query参数**: `characterId`

**响应**: `ShopItem[]`

---

### 16.3 金币购买商品

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/shop/purchase` |
| **说明** | 使用金币购买背包物品 |

**请求体**: `{ characterId, shopItemId, quantity }`

**响应**: `ShopActionResult { message, balances, items?, inventoryChanged? }`

---

### 16.4 竞技币兑换皮肤

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/shop/skins/redeem` |
| **说明** | 使用账号竞技币兑换皮肤 |

**请求体**: `{ characterId, shopItemId }`

**响应**: `ShopActionResult { message, balances, items?, skins? }`

---

### 16.5 启用皮肤

| 项目 | 内容 |
|---|---|---|
| **方法** | `POST` |
| **路径** | `/shop/skins/equip` |
| **说明** | 为当前角色启用已拥有皮肤 |

**请求体**: `{ characterId, skinId }`

**响应**: `ShopActionResult { message, balances, skins?, activeSkin? }`

---

**商店错误码**:

| errorCode | 说明 |
|---|---|
| `INVALID_QUANTITY` | 数量不合法 |
| `INSUFFICIENT_GOLD` | 金币不足 |
| `INSUFFICIENT_PVP_COIN` | 竞技币不足 |
| `SKIN_ALREADY_OWNED` | 重复兑换 |
| `SKIN_PROFESSION_MISMATCH` | 皮肤职业不匹配 |
| `SKIN_NOT_OWNED` | 启用未拥有的皮肤 |
| `SHOP_ITEM_NOT_FOUND` | 商品不存在或已下架 |
| `CHARACTER_NOT_FOUND` | 角色不存在 |

---

## 附录

### A. 角色属性计算公式

| 公式 | 说明 |
|---|---|
| `maxHp = floor((80 + str*5) * hpMultiplier)` | 最大生命值 |
| `maxMp = floor((20 + int*5) * mpMultiplier)` | 最大魔法值 |
| `physicalAttack = floor((str*2 + agi*0.5) * physicalAttackMultiplier)` | 物理攻击 |
| `magicAttack = floor(int*2 * magicAttackMultiplier)` | 魔法攻击 |
| `defense = 5 + defenseBonus` | 防御力 |
| `dodgeRate = agi * 0.005` | 闪避率 |
| `criticalRate = agi * 0.004` | 暴击率 |

**职业加成系数**:

| 职业 | hpMultiplier | mpMultiplier | physicalAttackMultiplier | magicAttackMultiplier | defenseBonus |
|---|---|---|---|---|---|
| 战士(1) | 1.2 | 0.8 | 1.15 | 0.8 | 3 |
| 法师(2) | 0.8 | 1.3 | 0.7 | 1.2 | 0 |
| 猎人(3) | 0.9 | 0.9 | 1.0 | 0.9 | 1 |

---

### B. 战斗伤害计算公式

| 公式 | 说明 |
|---|---|
| `effectiveStat = baseStat + Σ(buffValue) + Σ(debuffValue)` | 属性修正 |
| `baseDamage = max(0, floor(attacker.physicalAttack * skillMultiplier) - floor(defender.defense * 0.5))` | 基础伤害 |
| `damageAfterVariance = max(1, floor(baseDamage * (1 + random(-0.1, 0.1))))` | 随机波动 |
| 克制倍率: 1.3 / 被克制: 0.7 / 无关系: 1.0 | 元素克制 |
| 暴击伤害: *1.5 | 暴击 |

**常量**:

| 常量 | 值 |
|---|---|
| DEFENSE_EFFICIENCY | 0.5 |
| DAMAGE_VARIANCE | 0.1 |
| MIN_DAMAGE | 1 |
| CRIT_MULTIPLIER | 1.5 |
| MAX_CRIT_RATE | 0.8 |
| MAX_DODGE_RATE | 0.8 |
| ACTION_VALUE_THRESHOLD | 1000 |

---

### C. 稀有度/品质体系

**装备稀有度**:

| 稀有度 | 枚举值 | 颜色(亮色) | 颜色(暗色) |
|---|---|---|---|
| 普通 | Normal | #6e6e73 | #f4f1ff |
| 稀有 | Rare | #0071e3 | #59a6ff |
| 史诗 | Epic | #af52de | #c282ff |
| 传说 | Legendary | #ff9500 | #ff9b52 |

**战宠品质**:

| 品质 | 编码 | 标签 | 颜色(亮色) |
|---|---|---|---|
| N | 1 | N | #8e8e93 |
| R | 2 | R | #0071e3 |
| SR | 3 | SR | #af52de |
| SSR | 4 | SSR | #ff9500 |

---

### D. 消耗品效果类型

| effect_type | 说明 | 使用逻辑 |
|---|---|---|
| `heal_hp` | 恢复HP | `hp = min(hp + value*quantity, maxHp)` |
| `heal_mp` | 恢复MP | `mp = min(mp + value*quantity, maxMp)` |
| `add_exp` | 增加经验 | 调用经验增加接口，可能触发升级 |
| `revive` | 复活角色 | 仅死亡状态可用，恢复value%最大HP |

---

### E. 职业编码对照表

| 职业编号 | 职业名称 | 英文名 |
|---|---|---|
| 1 | 战士 | WARRIOR |
| 2 | 法师 | MAGE |
| 3 | 猎人 | HUNTER |

---

### F. 元素克制关系

火克风 → 风克地 → 地克水 → 水克火 → 光暗互克

---

### G. 前端节流配置

| 接口路径 | 节流间隔 |
|---|---|
| `/battle/action` | 300ms |
| `/inventory/use` | 500ms |
| `/inventory/discard` | 500ms |
| `/character/attributes` | 500ms |
| `/arena/match` | 2000ms |
| `/arena/settle` | 1000ms |
| `/pet/feed` | 500ms |
| `/pet/evolve` | 1000ms |

---

*文档版本: 2026-05-20*
