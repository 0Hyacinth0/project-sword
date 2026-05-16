/**
 * 副本 API 层
 * 当前为 Mock 实现，后续对接后端时替换为真实 API 调用
 */
import type { BattleRewards } from '../types/battle'

/**
 * 进入副本
 * @param _characterId - 角色 ID（Mock 未使用）
 * @param _dungeonId - 副本 ID（Mock 未使用）
 * @returns 进入结果
 */
export async function enterDungeonApi(
  _characterId: string,
  _dungeonId: string
): Promise<{ success: boolean; message: string; runId?: string }> {
  return {
    success: true,
    message: '进入副本成功',
    runId: `dungeon-run-${Date.now()}`
  }
}

/**
 * 完成副本结算
 * @param _characterId - 角色 ID（Mock 未使用）
 * @param _dungeonId - 副本 ID（Mock 未使用）
 * @param accumulatedRewards - 累积奖励
 * @returns 结算结果（含通关额外奖励）
 */
export async function completeDungeonApi(
  _characterId: string,
  _dungeonId: string,
  accumulatedRewards: BattleRewards
): Promise<{ success: boolean; message: string; totalRewards?: BattleRewards }> {
  return {
    success: true,
    message: '副本结算成功',
    totalRewards: accumulatedRewards
  }
}
