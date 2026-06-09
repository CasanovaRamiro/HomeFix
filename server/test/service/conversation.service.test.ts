import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createConversation as createConversationData,
  findConversationById,
  findConversationByParticipants,
  findConversationsByUserId,
} from '../../src/infrastructure/database/conversation.database.js'
import {
  createMessage as createMessageData,
  findMessagesByConversationId,
  countUnreadMessages,
  markMessagesAsRead,
} from '../../src/infrastructure/database/message.database.js'
import { findPostById } from '../../src/infrastructure/database/post.database.js'
import { getOrCreateConversation, getUserConversations, getConversationById } from '../../src/domain/services/conversation.service.js'
import { sendMessage, getConversationMessages, readMessages } from '../../src/domain/services/message.service.js'
import type { DomainConversation } from '../../src/domain/types/conversation.types.js'
import type { DomainMessage } from '../../src/domain/types/message.types.js'

vi.mock('../../src/infrastructure/database/conversation.database.js', () => ({
  createConversation: vi.fn(),
  findConversationById: vi.fn(),
  findConversationByParticipants: vi.fn(),
  findConversationsByUserId: vi.fn(),
  updateLastMessageAt: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/message.database.js', () => ({
  createMessage: vi.fn(),
  findMessagesByConversationId: vi.fn(),
  countUnreadMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/post.database.js', () => ({
  findPostById: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const clientId = 'client-uuid-1'
const workerId = 'worker-uuid-1'
const postId = 'post-uuid-1'
const conversationId = 'conv-uuid-1'
const otherUserId = 'other-uuid-1'

const mockPost = {
  id: postId,
  userId: clientId,
  title: 'Fix pipes',
  description: 'Need a plumber',
  address: '123 Main St',
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-02'),
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  latitude: null,
  longitude: null,
  categories: [],
  images: [],
  applications: [],
  user: { id: clientId, name: 'Client', surname: 'Test' },
}

const mockConversation: DomainConversation = {
  id: conversationId,
  postId,
  clientId,
  workerId,
  createdAt: new Date(),
  lastMessageAt: null,
  post: { id: postId, title: 'Fix pipes' },
  client: { id: clientId, name: 'Client' },
  worker: { id: workerId, name: 'Worker' },
  lastMessage: null,
  unreadCount: 0,
}

const mockMessage: DomainMessage = {
  id: 'msg-uuid-1',
  conversationId,
  senderId: clientId,
  content: 'Hello there',
  createdAt: new Date(),
  readAt: null,
  sender: { id: clientId, name: 'Client' },
}

describe('conversation.service', () => {
  describe('getOrCreateConversation', () => {
    it('should return existing conversation', async () => {
      vi.mocked(findConversationByParticipants).mockResolvedValue(mockConversation)

      const result = await getOrCreateConversation(postId, clientId, workerId)

      expect(result).toEqual(mockConversation)
      expect(createConversationData).not.toHaveBeenCalled()
    })

    it('should create new conversation when not found', async () => {
      vi.mocked(findConversationByParticipants).mockResolvedValue(null)
      vi.mocked(findPostById).mockResolvedValue(mockPost)
      vi.mocked(createConversationData).mockResolvedValue(mockConversation)

      const result = await getOrCreateConversation(postId, clientId, workerId)

      expect(result).toEqual(mockConversation)
      expect(findPostById).toHaveBeenCalledWith(postId)
      expect(createConversationData).toHaveBeenCalledWith({ postId, clientId, workerId })
    })

    it('should throw 404 when post does not exist', async () => {
      vi.mocked(findConversationByParticipants).mockResolvedValue(null)
      vi.mocked(findPostById).mockResolvedValue(null)

      await expect(getOrCreateConversation(postId, clientId, workerId)).rejects.toMatchObject({ status: 404 })
      expect(createConversationData).not.toHaveBeenCalled()
    })
  })

  describe('getUserConversations', () => {
    it('should return summaries with unread count', async () => {
      const convWithMessage: DomainConversation = {
        ...mockConversation,
        lastMessage: { content: 'Hello', createdAt: new Date() },
        lastMessageAt: new Date(),
      }
      vi.mocked(findConversationsByUserId).mockResolvedValue([convWithMessage])
      vi.mocked(countUnreadMessages).mockResolvedValue(2)

      const result = await getUserConversations(clientId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(conversationId)
      expect(result[0].postTitle).toBe('Fix pipes')
      expect(result[0].otherUserId).toBe(workerId)
      expect(result[0].otherUserName).toBe('Worker')
      expect(result[0].lastMessage).toBe('Hello')
      expect(result[0].unreadCount).toBe(2)
    })

    it('should return empty array when no conversations', async () => {
      vi.mocked(findConversationsByUserId).mockResolvedValue([])

      const result = await getUserConversations(clientId)

      expect(result).toHaveLength(0)
    })
  })

  describe('getConversationById', () => {
    it('should return conversation with unread count', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)
      vi.mocked(countUnreadMessages).mockResolvedValue(3)

      const result = await getConversationById(conversationId, clientId)

      expect(result).not.toBeNull()
      expect(result!.unreadCount).toBe(3)
      expect(countUnreadMessages).toHaveBeenCalledWith(conversationId, clientId)
    })

    it('should return null when not found', async () => {
      vi.mocked(findConversationById).mockResolvedValue(null)

      const result = await getConversationById(conversationId, clientId)

      expect(result).toBeNull()
    })

    it('should throw 403 when user is not a participant', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)

      await expect(getConversationById(conversationId, otherUserId)).rejects.toMatchObject({ status: 403 })
    })
  })
})

describe('message.service', () => {
  describe('sendMessage', () => {
    it('should send a message and update lastMessageAt', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)
      vi.mocked(createMessageData).mockResolvedValue(mockMessage)
      const { updateLastMessageAt } = await import('../../src/infrastructure/database/conversation.database.js')

      const result = await sendMessage(conversationId, clientId, 'Hello there')

      expect(result).toEqual(mockMessage)
      expect(createMessageData).toHaveBeenCalledWith({ conversationId, senderId: clientId, content: 'Hello there' })
      expect(updateLastMessageAt).toHaveBeenCalledWith(conversationId)
    })

    it('should throw 400 when content is empty', async () => {
      await expect(sendMessage(conversationId, clientId, '')).rejects.toMatchObject({ status: 400 })
      expect(createMessageData).not.toHaveBeenCalled()
    })

    it('should throw 400 when content exceeds 2000 chars', async () => {
      await expect(sendMessage(conversationId, clientId, 'a'.repeat(2001))).rejects.toMatchObject({ status: 400 })
      expect(createMessageData).not.toHaveBeenCalled()
    })

    it('should throw 404 when conversation not found', async () => {
      vi.mocked(findConversationById).mockResolvedValue(null)

      await expect(sendMessage(conversationId, clientId, 'Hello')).rejects.toMatchObject({ status: 404 })
      expect(createMessageData).not.toHaveBeenCalled()
    })

    it('should throw 403 when user is not a participant', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)

      await expect(sendMessage(conversationId, otherUserId, 'Hello')).rejects.toMatchObject({ status: 403 })
      expect(createMessageData).not.toHaveBeenCalled()
    })
  })

  describe('getConversationMessages', () => {
    it('should return messages and mark as read', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)
      vi.mocked(findMessagesByConversationId).mockResolvedValue([mockMessage])

      const result = await getConversationMessages(conversationId, clientId)

      expect(result).toHaveLength(1)
      expect(result[0].content).toBe('Hello there')
      expect(markMessagesAsRead).toHaveBeenCalledWith(conversationId, clientId)
    })

    it('should throw 404 when conversation not found', async () => {
      vi.mocked(findConversationById).mockResolvedValue(null)

      await expect(getConversationMessages(conversationId, clientId)).rejects.toMatchObject({ status: 404 })
    })

    it('should throw 403 when user is not a participant', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)

      await expect(getConversationMessages(conversationId, otherUserId)).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('readMessages', () => {
    it('should mark messages as read', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)

      await readMessages(conversationId, clientId)

      expect(markMessagesAsRead).toHaveBeenCalledWith(conversationId, clientId)
    })

    it('should throw 404 when conversation not found', async () => {
      vi.mocked(findConversationById).mockResolvedValue(null)

      await expect(readMessages(conversationId, clientId)).rejects.toMatchObject({ status: 404 })
    })

    it('should throw 403 when user is not a participant', async () => {
      vi.mocked(findConversationById).mockResolvedValue(mockConversation)

      await expect(readMessages(conversationId, otherUserId)).rejects.toMatchObject({ status: 403 })
    })
  })
})
