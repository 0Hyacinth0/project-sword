/**
 * 角色系统测试套件
 * 覆盖角色列表获取、创建（多职业）、删除、角色名检测、角色详情等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getCharacterListApi,
  createCharacterApi,
  deleteCharacterApi,
  checkCharacterNameApi,
  getCharacterInfoApi,
} from '../../api/character'
import {
  testContext,
  setSelectedCharacter,
  generateTestCharName,
  safeCall,
} from '../utils/testHelper'

/** 存储需要清理的临时角色 ID（战士和法师） */
const tempCharacterIds: string[] = []

/**
 * 创建角色系统测试套件
 * 包含角色列表获取、创建（战士/法师/猎人）、角色数量上限、角色名检测、详情查询、角色删除等用例
 * @returns 角色系统 TestSuite 对象
 */
export function createCharacterTestSuite(): TestSuite {
  return {
    module: '角色系统',
    icon: '⚔️',

    /**
     * 套件后置钩子：删除战士和法师角色，保留猎人作为后续测试角色
     */
    async afterAll() {
      for (const charId of tempCharacterIds) {
        try {
          await deleteCharacterApi(charId)
        } catch {
          // 忽略清理时的错误
        }
      }
      tempCharacterIds.length = 0
    },

    cases: [
      /**
       * 测试用例：获取角色列表
       * 调用 getCharacterListApi 获取当前账号的角色列表，验证返回 code 200
       */
      {
        name: '获取角色列表',
        fn: async () => {
          const res = await getCharacterListApi()
          expect(res.code).toBe(200)
        },
      },

      /**
       * 测试用例：创建战士角色
       * 使用 profession=1 创建战士角色，验证返回 code 200
       * 将角色 ID 记录到临时清理列表
       */
      {
        name: '创建角色 - 战士',
        fn: async () => {
          const warriorName = generateTestCharName('战士')
          const res = await createCharacterApi({
            characterName: warriorName,
            profession: 1,
          })
          expect(res.code).toBe(200)
          tempCharacterIds.push(res.data.id)
        },
      },

      /**
       * 测试用例：创建法师角色
       * 使用 profession=2 创建法师角色，验证返回 code 200
       * 将角色 ID 记录到临时清理列表
       */
      {
        name: '创建角色 - 法师',
        fn: async () => {
          const mageName = generateTestCharName('法师')
          const res = await createCharacterApi({
            characterName: mageName,
            profession: 2,
          })
          expect(res.code).toBe(200)
          tempCharacterIds.push(res.data.id)
        },
      },

      /**
       * 测试用例：创建猎人角色（主测试角色）
       * 使用 profession=3 创建猎人角色，验证返回 code 200
       * 将角色 ID 和名称保存到测试上下文，设置为当前选中角色
       */
      {
        name: '创建角色 - 猎人(主测试角色)',
        fn: async () => {
          const hunterName = generateTestCharName('猎人')
          const res = await createCharacterApi({
            characterName: hunterName,
            profession: 3,
          })
          expect(res.code).toBe(200)
          // 保存猎人角色到测试上下文供后续测试使用
          testContext.characterId = res.data.id
          testContext.characterName = res.data.characterName
          setSelectedCharacter(res.data.id)
        },
      },

      /**
       * 测试用例：创建第4个角色（应失败）
       * 已有3个角色时再创建应返回错误，使用 safeCall 捕获异常
       */
      {
        name: '创建第4个角色(应失败)',
        fn: async () => {
          const extraName = generateTestCharName('额外')
          const { error } = await safeCall(() =>
            createCharacterApi({
              characterName: extraName,
              profession: 1,
            })
          )
          expect(error).toBeDefined()
        },
      },

      /**
       * 测试用例：检测角色名可用性
       * 使用随机角色名调用 checkCharacterNameApi，验证返回 code 200 且 available 为 true
       */
      {
        name: '检测角色名可用',
        fn: async () => {
          const randomName = generateTestCharName('可用名')
          const res = await checkCharacterNameApi(randomName)
          expect(res.code).toBe(200)
          expect(res.data.available).toBe(true)
        },
      },

      /**
       * 测试用例：获取角色详情
       * 使用测试上下文中的 characterId 获取猎人角色详情
       * 验证关键字段（level、strength 等）存在且大于0
       */
      {
        name: '获取角色详情',
        fn: async () => {
          const res = await getCharacterInfoApi(testContext.characterId)
          expect(res.code).toBe(200)
          expect(res.data.level).toBeGreaterThanOrEqual(1)
          expect(res.data.strength).toBeGreaterThan(0)
          expect(res.data.intelligence).toBeGreaterThan(0)
          expect(res.data.agility).toBeGreaterThan(0)
        },
      },

      /**
       * 测试用例：删除战士角色
       * 删除临时列表中第一个角色（战士），验证返回 code 200
       * 从清理列表中移除已删除的角色 ID
       */
      {
        name: '删除角色 - 战士',
        fn: async () => {
          const warriorId = tempCharacterIds.shift()
          if (!warriorId) {
            throw new Error('未找到战士角色 ID，无法执行删除测试')
          }
          const res = await deleteCharacterApi(warriorId)
          expect(res.code).toBe(200)
        },
      },
    ],
  }
}
