/**
 * 数值校验工具
 * 业务层前端校验，防止非法数值操作
 */

/**
 * 校验属性点加点
 * @param point - 本次加点数
 * @param available - 可用自由属性点
 * @returns 校验结果
 */
export function validateAttributePoints(
  point: number,
  available: number
): { valid: boolean; message: string } {
  if (!Number.isInteger(point) || point <= 0) {
    return { valid: false, message: '加点数必须为正整数' }
  }
  if (point > available) {
    return { valid: false, message: `可用属性点不足（剩余 ${available} 点）` }
  }
  return { valid: true, message: '' }
}

/**
 * 校验物品使用/丢弃数量
 * @param quantity - 操作数量
 * @param owned - 拥有数量
 * @returns 校验结果
 */
export function validateItemQuantity(
  quantity: number,
  owned: number
): { valid: boolean; message: string } {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { valid: false, message: '数量必须为正整数' }
  }
  if (quantity > owned) {
    return { valid: false, message: `物品数量不足（拥有 ${owned} 个）` }
  }
  return { valid: true, message: '' }
}

/**
 * 校验竞技积分
 * @param score - 积分值
 * @returns 校验结果
 */
export function validateScore(score: number): { valid: boolean; message: string } {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valid: false, message: '积分格式无效' }
  }
  if (score < 0) {
    return { valid: false, message: '积分不能为负数' }
  }
  return { valid: true, message: '' }
}

/**
 * 校验等级
 * @param level - 等级
 * @returns 校验结果
 */
export function validateLevel(level: number): { valid: boolean; message: string } {
  if (!Number.isInteger(level) || level <= 0) {
    return { valid: false, message: '等级必须为正整数' }
  }
  if (level > 100) {
    return { valid: false, message: '等级不能超过 100' }
  }
  return { valid: true, message: '' }
}
