/**
 * 商店系统 API
 * 提供商品概览、金币购买、竞技币皮肤兑换和皮肤启用能力
 */
import request from './request'
import type { ApiResponse } from './request'
import type {
  EquipSkinParams,
  PurchaseShopItemParams,
  RedeemSkinParams,
  ShopActionResult,
  ShopOverview,
  ShopItem
} from '../types/shop'

/**
 * 获取商店概览。
 * @param characterId - 当前角色 ID
 * @returns 商店概览响应
 */
export async function getShopOverviewApi(characterId: string): Promise<ApiResponse<ShopOverview>> {
  const res = await request.get<ApiResponse<ShopOverview>>('/shop/overview', { params: { characterId } })
  return res.data
}

/**
 * 获取商店商品列表。
 * @param characterId - 当前角色 ID
 * @returns 商品列表响应
 */
export async function getShopItemsApi(characterId: string): Promise<ApiResponse<ShopItem[]>> {
  const res = await request.get<ApiResponse<ShopItem[]>>('/shop/items', { params: { characterId } })
  return res.data
}

/**
 * 购买金币商品。
 * @param params - 购买参数
 * @returns 操作结果响应
 */
export async function purchaseShopItemApi(params: PurchaseShopItemParams): Promise<ApiResponse<ShopActionResult>> {
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/purchase', params)
  return res.data
}

/**
 * 兑换竞技皮肤。
 * @param params - 兑换参数
 * @returns 操作结果响应
 */
export async function redeemShopSkinApi(params: RedeemSkinParams): Promise<ApiResponse<ShopActionResult>> {
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/skins/redeem', params)
  return res.data
}

/**
 * 启用角色皮肤。
 * @param params - 启用参数
 * @returns 操作结果响应
 */
export async function equipCharacterSkinApi(params: EquipSkinParams): Promise<ApiResponse<ShopActionResult>> {
  const res = await request.post<ApiResponse<ShopActionResult>>('/shop/skins/equip', params)
  return res.data
}
