/**
 * 角色升级配置模块
 * 定义经验公式、等级上限、升级奖励等
 * 前后端需保持一致
 */

// ──────────────────────────────────────────
// 核心配置
// ──────────────────────────────────────────

/** 最大等级上限 */
export const MAX_LEVEL = 100

/** 每升一级获得的自由属性点数 */
export const POINTS_PER_LEVEL = 3

/** 基础经验值系数 */
const BASE_EXP = 100

/** 经验增长系数（指数曲线） */
const EXP_MULTIPLIER = 1.15

/** 线性增长系数（避免后期过于陡峭） */
const EXP_LINEAR = 50

// ──────────────────────────────────────────
// 经验公式
// ──────────────────────────────────────────

/**
 * 计算从当前等级升到下一级所需的总经验值
 * 公式：nextExp = floor(BASE_EXP × EXP_MULTIPLIER^level + EXP_LINEAR × level)
 * @param level - 当前等级
 * @returns 升级所需经验值
 */
export function calculateNextLevelExp(level: number): number {
  if (level >= MAX_LEVEL) return 0
  return Math.floor(BASE_EXP * Math.pow(EXP_MULTIPLIER, level) + EXP_LINEAR * level)
}

/**
 * 计算从 1 级升到目标等级所需的总累计经验
 * @param targetLevel - 目标等级
 * @returns 累计所需经验
 */
export function calculateTotalExpForLevel(targetLevel: number): number {
  let total = 0
  for (let lv = 1; lv < targetLevel; lv++) {
    total += calculateNextLevelExp(lv)
  }
  return total
}

/**
 * 根据累计经验反推当前等级
 * @param totalExp - 累计经验值
 * @returns 当前等级
 */
export function calculateLevelFromExp(totalExp: number): number {
  let level = 1
  let expNeeded = calculateNextLevelExp(level)
  while (totalExp >= expNeeded && level < MAX_LEVEL) {
    totalExp -= expNeeded
    level++
    expNeeded = calculateNextLevelExp(level)
  }
  return level
}

/**
 * 计算当前等级下的经验进度百分比
 * @param currentExp - 当前等级内的经验值
 * @param level - 当前等级
 * @returns 百分比 (0-100)
 */
export function calculateExpPercent(currentExp: number, level: number): number {
  const nextExp = calculateNextLevelExp(level)
  if (nextExp === 0) return 100 // 已满级
  return Math.min(100, Math.max(0, (currentExp / nextExp) * 100))
}

// ──────────────────────────────────────────
// 升级结果计算
// ──────────────────────────────────────────

/** 升级结果信息 */
export interface LevelUpResult {
  oldLevel: number
  newLevel: number
  levelsGained: number
  pointsGained: number
  overflowExp: number  // 多余经验（溢出到新等级）
  isNewMaxLevel: boolean
}

/**
 * 计算增加经验后的升级结果
 * @param currentLevel - 当前等级
 * @param currentExp - 当前等级内的经验值
 * @param expToAdd - 要增加的经验值
 * @returns 升级结果
 */
export function calculateLevelUp(
  currentLevel: number,
  currentExp: number,
  expToAdd: number
): LevelUpResult {
  let level = currentLevel
  let exp = currentExp + expToAdd
  let levelsGained = 0

  // 循环升级直到经验不足或满级
  while (level < MAX_LEVEL) {
    const nextExp = calculateNextLevelExp(level)
    if (exp < nextExp) break

    exp -= nextExp
    level++
    levelsGained++
  }

  const pointsGained = levelsGained * POINTS_PER_LEVEL
  const isNewMaxLevel = level === MAX_LEVEL

  return {
    oldLevel: currentLevel,
    newLevel: level,
    levelsGained,
    pointsGained,
    overflowExp: exp,
    isNewMaxLevel
  }
}

// ──────────────────────────────────────────
// 经验等级对照表（供展示/调试）
// ──────────────────────────────────────────

/** 生成 1-20 级的经验对照表 */
export function getExpTable(limit: number = 20): Array<{ level: number; nextExp: number }> {
  const table: Array<{ level: number; nextExp: number }> = []
  for (let lv = 1; lv <= limit; lv++) {
    table.push({ level: lv, nextExp: calculateNextLevelExp(lv) })
  }
  return table
}