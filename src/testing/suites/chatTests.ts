/**
 * 聊天系统测试套件
 * 覆盖世界频道消息获取/发送、私聊会话获取、私聊消息发送等流程
 */

import type { TestSuite } from '../core/types'
import { expect } from '../core/Assertions'
import {
  getWorldMessagesApi,
  sendMessageApi,
  getPrivateConversationsApi,
} from '../../api/chat'
import { testContext } from '../utils/testHelper'

/**
 * 创建聊天系统测试套件
 * 包含获取世界频道消息、发送世界消息、获取私聊会话、发送私聊消息等用例
 * @returns 聊天系统 TestSuite 对象
 */
export function createChatTestSuite(): TestSuite {
  return {
    module: '聊天系统',
    icon: '💬',

    cases: [
      /**
       * 测试用例：获取世界频道消息
       * 调用 getWorldMessagesApi 获取世界频道的消息列表
       * 验证返回 code 200 且消息列表已定义
       */
      {
        name: '获取世界频道消息',
        fn: async () => {
          const res = await getWorldMessagesApi()
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.length).toBeGreaterThanOrEqual(1)

          // 验证消息数据结构
          const firstMsg = res.data[0]
          expect(firstMsg.id).toBeDefined()
          expect(firstMsg.senderId).toBeDefined()
          expect(firstMsg.senderName).toBeDefined()
          expect(firstMsg.channel).toBe('world')
          expect(firstMsg.content).toBeDefined()
        },
      },

      /**
       * 测试用例：发送世界消息
       * 调用 sendMessageApi 向世界频道发送一条测试消息
       * 验证返回 code 200 且消息内容正确
       */
      {
        name: '发送世界消息',
        fn: async () => {
          const testMessage = `[测试] 聊天系统测试消息 - ${Date.now()}`
          const res = await sendMessageApi('world', testMessage)
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.content).toBe(testMessage)
          expect(res.data.channel).toBe('world')
          expect(res.data.senderId).toBe(testContext.characterId)
        },
      },

      /**
       * 测试用例：获取私聊会话
       * 调用 getPrivateConversationsApi 获取当前角色的私聊会话列表
       * 验证返回 code 200 且会话列表已定义
       */
      {
        name: '获取私聊会话',
        fn: async () => {
          const res = await getPrivateConversationsApi()
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.length).toBeGreaterThanOrEqual(1)

          // 验证会话数据结构
          const firstConv = res.data[0]
          expect(firstConv.targetId).toBeDefined()
          expect(firstConv.targetName).toBeDefined()
          expect(firstConv.lastMessage).toBeDefined()
          expect(firstConv.unreadCount).toBeDefined()
        },
      },

      /**
       * 测试用例：发送私聊消息
       * 调用 sendMessageApi 向第二个角色发送私聊消息
       * 验证返回 code 200 且消息内容和目标正确
       */
      {
        name: '发送私聊消息',
        fn: async () => {
          const targetId = testContext.secondCharacterId || 'char-friend-001'
          const testMessage = `[测试] 私聊测试消息 - ${Date.now()}`
          const res = await sendMessageApi('private', testMessage, targetId)
          expect(res.code).toBe(200)
          expect(res.data).toBeDefined()
          expect(res.data.content).toBe(testMessage)
          expect(res.data.channel).toBe('private')
          expect(res.data.targetId).toBe(targetId)
        },
      },
    ],
  }
}
