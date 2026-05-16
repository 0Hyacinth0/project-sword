/**
 * 战斗系统配置参数
 * 集中管理战斗引擎中的硬编码值，便于后期调整
 */

/** 行动值阈值：当行动值累积到此值时可行动 */
export const ACTION_VALUE_THRESHOLD = 1000

/** 逃跑基础成功率 */
export const FLEE_BASE_CHANCE = 0.3

/** 逃跑速度加成系数（每点速度增加的概率） */
export const FLEE_SPEED_FACTOR = 0.01

/** 逃跑成功率下限 */
export const FLEE_MIN_CHANCE = 0.1

/** 逃跑成功率上限 */
export const FLEE_MAX_CHANCE = 0.8

/** DoT 伤害基础比例（相对于 maxHp） */
export const DOT_DAMAGE_RATIO = 0.1

/** 防御姿态防御力倍率 */
export const DEFEND_DEFENSE_MULTIPLIER = 1.0

/** AI 使用技能概率 */
export const AI_SKILL_USE_CHANCE = 0.3

/** 战宠辅助技能触发阈值（主人 HP 百分比） */
export const PET_SUPPORT_HP_THRESHOLD = 0.5

/** 战宠经验分成比例 */
export const PET_EXP_RATIO = 0.3

/** 掉落物品基础概率 */
export const DROP_BASE_CHANCE = 0.15

/** 掉落物品概率（用于 generateMockDrops 内部分类） */
export const DROP_EQUIPMENT_CHANCE = 0.3
export const DROP_MATERIAL_CHANCE = 0.7

/** 行动顺序预览数量 */
export const ACTION_ORDER_PREVIEW_COUNT = 8

/** 行动值 tick 最大迭代次数（防止死循环） */
export const TICK_MAX_ITERATIONS = 200
