<template>
  <div class="shop-panel">
    <header class="shop-panel__header">
      <div class="shop-balance shop-balance--gold">
        <Coins class="shop-balance__icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
        <span class="shop-balance__label">金币</span>
        <strong class="shop-balance__value">{{ formatNumber(balances.characterGold) }}</strong>
      </div>

      <div class="shop-balance shop-balance--arena">
        <Trophy class="shop-balance__icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
        <span class="shop-balance__label">竞技币</span>
        <strong class="shop-balance__value">{{ formatNumber(balances.accountPvpCoin) }}</strong>
      </div>

      <UiButton
        class="shop-panel__refresh"
        variant="secondary"
        size="sm"
        :loading="loading"
        :disabled="loading || actionLoading"
        @click="handleRefresh"
      >
        <template #icon>
          <ShoppingBag :size="14" :stroke-width="1.8" />
        </template>
        刷新
      </UiButton>
    </header>

    <UiTabs
      class="shop-panel__tabs"
      :model-value="activeTab"
      :items="tabs"
      size="sm"
      @update:model-value="handleTabChange"
    />

    <div v-if="loading" class="shop-loading" aria-live="polite">
      <Loader2 class="shop-loading__icon" :size="20" :stroke-width="1.8" aria-hidden="true" />
      <span>加载中...</span>
    </div>

    <section v-else-if="activeTab === 'gold'" class="shop-grid">
      <article
        v-for="item in goldItems"
        :key="item.id"
        class="shop-card shop-card--gold"
      >
        <div class="shop-card__top">
          <div class="shop-card__icon shop-card__icon--gold">
            <ShoppingBag :size="22" :stroke-width="1.8" aria-hidden="true" />
          </div>
          <div class="shop-card__title-group">
            <h3 class="shop-card__title">{{ item.name }}</h3>
            <p class="shop-card__description">{{ item.description }}</p>
          </div>
        </div>

        <div class="shop-card__meta">
          <UiBadge :tone="rarityTone(item.rarity)" size="sm">{{ item.rarity }}</UiBadge>
          <UiBadge v-if="!canAfford(item)" tone="warning" size="sm">金币不足</UiBadge>
        </div>

        <div class="shop-purchase">
          <div class="shop-quantity" aria-label="购买数量">
            <button
              class="shop-quantity__button"
              type="button"
              :disabled="getQuantity(item.id) <= 1 || actionLoading"
              :aria-label="`${item.name} 数量减少`"
              @click="adjustQuantity(item, -1)"
            >
              <Minus :size="14" :stroke-width="1.8" aria-hidden="true" />
            </button>
            <span class="shop-quantity__value">{{ getQuantity(item.id) }}</span>
            <button
              class="shop-quantity__button"
              type="button"
              :disabled="getQuantity(item.id) >= item.maxPurchaseQuantity || actionLoading"
              :aria-label="`${item.name} 数量增加`"
              @click="adjustQuantity(item, 1)"
            >
              <Plus :size="14" :stroke-width="1.8" aria-hidden="true" />
            </button>
          </div>

          <div class="shop-price shop-price--gold">
            <Coins :size="14" :stroke-width="1.8" aria-hidden="true" />
            <span>{{ formatNumber(totalPrice(item)) }}</span>
          </div>
        </div>

        <UiButton
          block
          size="sm"
          :loading="actionLoading"
          :disabled="!characterId || !canAfford(item) || actionLoading"
          @click="handlePurchase(item)"
        >
          {{ canAfford(item) ? '购买' : '金币不足' }}
        </UiButton>
      </article>

      <div v-if="goldItems.length === 0" class="shop-empty">
        <ShoppingBag :size="24" :stroke-width="1.8" aria-hidden="true" />
        <span>暂无金币商品</span>
      </div>
    </section>

    <section v-else-if="activeTab === 'arena'" class="shop-grid">
      <article
        v-for="item in arenaItems"
        :key="item.id"
        class="shop-card shop-card--skin"
        :class="{ 'shop-card--enabled': isItemEnabled(item) }"
      >
        <div class="shop-skin-preview">
          <img
            v-if="item.previewImageUrl"
            class="shop-skin-preview__image"
            :src="item.previewImageUrl"
            :alt="item.name"
          />
          <Shirt v-else :size="32" :stroke-width="1.8" aria-hidden="true" />
        </div>

        <div class="shop-card__title-group">
          <h3 class="shop-card__title">{{ item.name }}</h3>
          <p class="shop-card__description">{{ item.description }}</p>
        </div>

        <div class="shop-card__meta">
          <UiBadge :tone="rarityTone(item.rarity)" size="sm">{{ item.rarity }}</UiBadge>
          <UiBadge v-if="isItemEnabled(item)" tone="success" size="sm">已启用</UiBadge>
          <UiBadge v-else-if="isItemOwned(item)" tone="success" size="sm">已拥有</UiBadge>
          <UiBadge v-else-if="!canAfford(item)" tone="warning" size="sm">竞技币不足</UiBadge>
        </div>

        <div class="shop-price shop-price--arena">
          <Trophy :size="14" :stroke-width="1.8" aria-hidden="true" />
          <span>{{ formatNumber(item.price.amount) }}</span>
        </div>

        <UiButton
          v-if="!isItemOwned(item)"
          block
          size="sm"
          :loading="actionLoading"
          :disabled="!characterId || !canAfford(item) || actionLoading"
          @click="handleRedeem(item)"
        >
          {{ canAfford(item) ? '兑换' : '竞技币不足' }}
        </UiButton>
        <UiButton
          v-else
          block
          size="sm"
          variant="secondary"
          :disabled="!canEquipItemSkin(item)"
          @click="handleEquipItemSkin(item)"
        >
          <template v-if="isItemEnabled(item)" #icon>
            <Check :size="14" :stroke-width="1.8" />
          </template>
          {{ arenaOwnedActionLabel(item) }}
        </UiButton>
      </article>

      <div v-if="arenaItems.length === 0" class="shop-empty">
        <Trophy :size="24" :stroke-width="1.8" aria-hidden="true" />
        <span>暂无竞技商品</span>
      </div>
    </section>

    <section v-else class="shop-grid">
      <article
        v-for="skin in ownedSkins"
        :key="skin.skinId"
        class="shop-card shop-card--skin"
        :class="{ 'shop-card--enabled': skin.enabled, 'shop-card--locked': skin.profession !== profession }"
      >
        <div class="shop-skin-preview">
          <img
            v-if="skin.portraitUrl"
            class="shop-skin-preview__image"
            :src="skin.portraitUrl"
            :alt="skin.name"
          />
          <Shirt v-else :size="32" :stroke-width="1.8" aria-hidden="true" />
        </div>

        <div class="shop-card__title-group">
          <h3 class="shop-card__title">{{ skin.name }}</h3>
          <p v-if="skin.description" class="shop-card__description">{{ skin.description }}</p>
        </div>

        <div class="shop-card__meta">
          <UiBadge tone="primary" size="sm">{{ professionLabel(skin.profession) }}</UiBadge>
          <UiBadge v-if="skin.enabled" tone="success" size="sm">已启用</UiBadge>
          <UiBadge v-else-if="skin.profession !== profession" tone="neutral" size="sm">非当前职业</UiBadge>
          <UiBadge v-else tone="success" size="sm">已解锁</UiBadge>
        </div>

        <UiButton
          block
          size="sm"
          variant="secondary"
          :disabled="!canEquipSkin(skin)"
          @click="handleEquipSkin(skin)"
        >
          <template v-if="skin.enabled" #icon>
            <Check :size="14" :stroke-width="1.8" />
          </template>
          {{ ownedActionLabel(skin) }}
        </UiButton>
      </article>

      <div v-if="ownedSkins.length === 0" class="shop-empty">
        <Shirt :size="24" :stroke-width="1.8" aria-hidden="true" />
        <span>暂无已拥有皮肤</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Check, Coins, Loader2, Minus, Plus, Shirt, ShoppingBag, Trophy } from 'lucide-vue-next'
import { UiBadge, UiButton, UiTabs, type BadgeTone, type UiTabItem } from '../ui'
import type { CharacterSkin, ShopBalances, ShopItem } from '../../types/shop'

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

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  actionLoading: false
})

const emit = defineEmits<Emits>()

const activeTab = ref<ShopTab>('gold')
const quantities = reactive<Record<string, number>>({})

const tabs: UiTabItem[] = [
  { value: 'gold', label: '金币商店', icon: Coins },
  { value: 'arena', label: '竞技商店', icon: Trophy },
  { value: 'owned', label: '已拥有', icon: Shirt }
]

/** 金币商品列表。 */
const goldItems = computed(getGoldItems)

/** 竞技币商品列表。 */
const arenaItems = computed(getArenaItems)

/** 已拥有皮肤列表。 */
const ownedSkins = computed(getOwnedSkins)

/**
 * 处理商店标签切换。
 * @param value - UiTabs 派发的标签值
 * @returns 无返回值
 */
function handleTabChange(value: string | number): void {
  activeTab.value = value as ShopTab
}

/**
 * 派发商店刷新事件。
 * @returns 无返回值
 */
function handleRefresh(): void {
  emit('refresh')
}

/**
 * 获取金币商品列表。
 * @returns 金币商品数组
 */
function getGoldItems(): ShopItem[] {
  return props.items.filter(isGoldItem)
}

/**
 * 获取竞技币商品列表。
 * @returns 竞技币商品数组
 */
function getArenaItems(): ShopItem[] {
  return props.items.filter(isArenaItem)
}

/**
 * 获取已拥有皮肤列表。
 * @returns 已拥有皮肤数组
 */
function getOwnedSkins(): CharacterSkin[] {
  return props.skins.filter(isOwnedSkin)
}

/**
 * 判断商品是否属于金币商店。
 * @param item - 商品配置
 * @returns 是否为金币商品
 */
function isGoldItem(item: ShopItem): boolean {
  return item.price.currency === 'gold'
}

/**
 * 判断商品是否属于竞技商店。
 * @param item - 商品配置
 * @returns 是否为竞技币商品
 */
function isArenaItem(item: ShopItem): boolean {
  return item.price.currency === 'pvp_coin'
}

/**
 * 判断皮肤是否已拥有。
 * @param skin - 角色皮肤
 * @returns 是否已解锁
 */
function isOwnedSkin(skin: CharacterSkin): boolean {
  return skin.owned
}

/**
 * 读取商品当前选择数量。
 * @param itemId - 商品 ID
 * @returns 当前数量，默认 1
 */
function getQuantity(itemId: string): number {
  return quantities[itemId] ?? 1
}

/**
 * 调整商品购买数量并限制在合法范围内。
 * @param item - 商品配置
 * @param delta - 增减数量
 * @returns 无返回值
 */
function adjustQuantity(item: ShopItem, delta: number): void {
  const maxQuantity = Math.max(1, item.maxPurchaseQuantity)
  const nextQuantity = Math.min(maxQuantity, Math.max(1, getQuantity(item.id) + delta))
  quantities[item.id] = nextQuantity
}

/**
 * 计算当前商品总价。
 * @param item - 商品配置
 * @returns 当前数量下的总价
 */
function totalPrice(item: ShopItem): number {
  const quantity = item.price.currency === 'gold' ? getQuantity(item.id) : 1
  return item.price.amount * quantity
}

/**
 * 判断当前余额是否足够购买商品。
 * @param item - 商品配置
 * @returns 是否可支付
 */
function canAfford(item: ShopItem): boolean {
  if (item.price.currency === 'gold') {
    return props.balances.characterGold >= totalPrice(item)
  }
  return props.balances.accountPvpCoin >= totalPrice(item)
}

/**
 * 处理金币商品购买按钮。
 * @param item - 被购买商品
 * @returns 无返回值
 */
function handlePurchase(item: ShopItem): void {
  if (!props.characterId || props.actionLoading || !canAfford(item)) return
  emit('purchase', item, getQuantity(item.id))
}

/**
 * 处理皮肤兑换按钮。
 * @param item - 被兑换皮肤商品
 * @returns 无返回值
 */
function handleRedeem(item: ShopItem): void {
  if (!props.characterId || props.actionLoading || isItemOwned(item) || !canAfford(item)) return
  emit('redeem-skin', item)
}

/**
 * 处理皮肤启用按钮。
 * @param skin - 被启用皮肤
 * @returns 无返回值
 */
function handleEquipSkin(skin: CharacterSkin): void {
  if (!canEquipSkin(skin)) return
  emit('equip-skin', skin)
}

/**
 * 处理竞技皮肤卡片的快速启用按钮。
 * @param item - 皮肤商品配置
 * @returns 无返回值
 */
function handleEquipItemSkin(item: ShopItem): void {
  const skin = findSkinForItem(item)
  if (!skin || !canEquipSkin(skin)) return
  emit('equip-skin', skin)
}

/**
 * 判断已拥有皮肤是否可为当前职业启用。
 * @param skin - 角色皮肤
 * @returns 是否允许启用
 */
function canEquipSkin(skin: CharacterSkin): boolean {
  return Boolean(props.characterId) && !props.actionLoading && skin.owned && !skin.enabled && skin.profession === props.profession
}

/**
 * 判断竞技商品对应皮肤是否可快速启用。
 * @param item - 皮肤商品配置
 * @returns 是否允许启用
 */
function canEquipItemSkin(item: ShopItem): boolean {
  const skin = findSkinForItem(item)
  return skin ? canEquipSkin(skin) : false
}

/**
 * 查找商品对应的账号皮肤。
 * @param item - 皮肤商品配置
 * @returns 匹配到的皮肤，找不到则返回 null
 */
function findSkinForItem(item: ShopItem): CharacterSkin | null {
  if (!item.skinId) return null
  for (const skin of props.skins) {
    if (skin.skinId === item.skinId) return skin
  }
  return null
}

/**
 * 判断竞技商品是否已拥有。
 * @param item - 皮肤商品配置
 * @returns 是否已拥有
 */
function isItemOwned(item: ShopItem): boolean {
  return Boolean(item.owned || findSkinForItem(item)?.owned)
}

/**
 * 判断竞技商品是否已启用。
 * @param item - 皮肤商品配置
 * @returns 是否已启用
 */
function isItemEnabled(item: ShopItem): boolean {
  return Boolean(item.enabled || findSkinForItem(item)?.enabled)
}

/**
 * 生成竞技商品已拥有状态下的按钮文案。
 * @param item - 皮肤商品配置
 * @returns 按钮文案
 */
function arenaOwnedActionLabel(item: ShopItem): string {
  const skin = findSkinForItem(item)
  if (isItemEnabled(item)) return '已启用'
  if (!skin) return '已拥有'
  if (skin.profession !== props.profession) return '非当前职业'
  return '启用'
}

/**
 * 生成已拥有皮肤卡片的按钮文案。
 * @param skin - 角色皮肤
 * @returns 按钮文案
 */
function ownedActionLabel(skin: CharacterSkin): string {
  if (skin.enabled) return '已启用'
  if (skin.profession !== props.profession) return '非当前职业'
  return '启用'
}

/**
 * 将职业编号转换为展示名称。
 * @param profession - 职业编号
 * @returns 职业名称
 */
function professionLabel(profession: number): string {
  const labels: Record<number, string> = {
    1: '战士',
    2: '法师',
    3: '猎人'
  }
  return labels[profession] ?? '未知'
}

/**
 * 将商品稀有度转换为徽章语义色。
 * @param rarity - 商品稀有度
 * @returns UiBadge 支持的色调
 */
function rarityTone(rarity: ShopItem['rarity']): BadgeTone {
  const toneMap: Record<ShopItem['rarity'], BadgeTone> = {
    Normal: 'neutral',
    Rare: 'rare',
    Epic: 'epic',
    Legendary: 'legendary'
  }
  return toneMap[rarity] ?? 'neutral'
}

/**
 * 格式化货币数字。
 * @param value - 数值
 * @returns 本地化后的数字字符串
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}
</script>

<style scoped>
.shop-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 12px;
  color: var(--text-primary);
  overflow: hidden;
}

.shop-panel__header {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: center;
}

.shop-panel__refresh {
  min-width: 76px;
}

.shop-balance {
  min-width: 0;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
  box-shadow: var(--shadow-card);
}

.shop-balance--gold .shop-balance__icon,
.shop-price--gold {
  color: var(--accent-gold);
}

.shop-balance--arena .shop-balance__icon,
.shop-price--arena {
  color: var(--accent-blue);
}

.shop-balance__label {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.shop-balance__value {
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-small);
  font-weight: 600;
}

.shop-panel__tabs {
  flex: 0 0 auto;
}

.shop-loading,
.shop-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  gap: 8px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
  color: var(--text-muted);
  font-size: var(--font-size-small);
}

.shop-loading {
  flex: 1;
}

.shop-loading__icon {
  color: var(--accent-blue);
  animation: shop-spin 0.9s linear infinite;
}

.shop-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-content: start;
  gap: 12px;
  overflow-y: auto;
  padding-right: 2px;
}

.shop-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
  box-shadow: var(--shadow-card);
}

.shop-card--enabled {
  border-color: var(--accent-green);
}

.shop-card--locked {
  opacity: 0.72;
}

.shop-card__top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.shop-card__icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
}

.shop-card__icon--gold {
  color: var(--accent-gold);
}

.shop-card__title-group {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.shop-card__title {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--text-primary);
  font-size: var(--font-size-small);
  font-weight: 600;
  line-height: 1.25;
}

.shop-card__description {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.shop-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.shop-purchase {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.shop-quantity {
  display: grid;
  grid-template-columns: 32px minmax(32px, auto) 32px;
  align-items: center;
  gap: 6px;
}

.shop-quantity__button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-panel-light);
  color: var(--text-primary);
  cursor: pointer;
}

.shop-quantity__button:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.55;
}

.shop-quantity__value {
  min-width: 32px;
  text-align: center;
  color: var(--text-primary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.shop-price {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  gap: 5px;
  overflow: hidden;
  font-size: var(--font-size-small);
  font-weight: 600;
}

.shop-price span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-skin-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  min-height: 132px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--bg-panel-light);
  color: var(--accent-blue);
}

.shop-skin-preview__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes shop-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .shop-panel {
    padding: 10px;
  }

  .shop-panel__header,
  .shop-grid {
    grid-template-columns: 1fr;
  }

  .shop-panel__refresh {
    width: 100%;
  }

  .shop-purchase {
    align-items: stretch;
    flex-direction: column;
  }

  .shop-price {
    justify-content: flex-start;
  }
}
</style>
