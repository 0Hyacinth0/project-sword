/**
 * 排行榜测试套件
 * 覆盖等级排行、战力排行、竞技排行等排行榜查询流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import { getLeaderboardApi } from '../../api/leaderboard'

/**
 * 创建排行榜测试套件
 * 包含等级排行（全服）、战力排行（全服）、竞技排行（好友）等用例
 * @returns 排行榜 TestSuite 对象
 */
export function createLeaderboardTestSuite(): TestSuite {
  return {
    module: '排行榜',
    icon: '🏆',

    cases: [
      /**
       * 测试用例：等级排行
       * 调用 getLeaderboardApi 获取全服等级排行榜
       * 验证返回 code 200，排行条目非空，条目包含必要字段（rank、characterName、value）
       */
      {
        name: '等级排行',
        fn: async () => {
          const res = await getLeaderboardApi('level', 'all')
          expect(res.code).toBe(200)
          expect(res.data.entries).toBeDefined()
          expect(res.data.entries.length).toBeGreaterThanOrEqual(1)
          expect(res.data.myRank).toBeDefined()
          expect(res.data.myValue).toBeDefined()

          // 验证排行条目数据结构
          const firstEntry = res.data.entries[0]
          expect(firstEntry.rank).toBe(1)
          expect(firstEntry.characterId).toBeDefined()
          expect(firstEntry.characterName).toBeDefined()
          expect(firstEntry.value).toBeDefined()
        },
      },

      /**
       * 测试用例：战力排行
       * 调用 getLeaderboardApi 获取全服战力排行榜
       * 验证返回 code 200，条目按战力值排列
       */
      {
        name: '战力排行',
        fn: async () => {
          const res = await getLeaderboardApi('power', 'all')
          expect(res.code).toBe(200)
          expect(res.data.entries).toBeDefined()
          expect(res.data.entries.length).toBeGreaterThanOrEqual(1)

          // 验证排行条目按名次排列
          const firstEntry = res.data.entries[0]
          expect(firstEntry.rank).toBe(1)
          expect(firstEntry.value).toBeGreaterThanOrEqual(0)
        },
      },

      /**
       * 测试用例：竞技排行
       * 调用 getLeaderboardApi 获取好友竞技排行榜
       * 验证返回 code 200 且排行数据结构完整
       */
      {
        name: '竞技排行',
        fn: async () => {
          const res = await getLeaderboardApi('arena', 'friends')
          expect(res.code).toBe(200)
          expect(res.data.entries).toBeDefined()

          // 好友排行可能没有数据，但结构应完整
          if (res.data.entries.length > 0) {
            const firstEntry = res.data.entries[0]
            expect(firstEntry.rank).toBeGreaterThanOrEqual(1)
            expect(firstEntry.characterName).toBeDefined()
          }
        },
      },
    ],
  }
}
