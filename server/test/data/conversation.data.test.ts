import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import {
  createConversation,
  findConversationById,
  findConversationByParticipants,
  findConversationsByUserId,
  updateLastMessageAt,
} from '../../src/infrastructure/database/conversation.database.js'
import {
  createMessage,
  findMessagesByConversationId,
  markMessagesAsRead,
  countUnreadMessages,
} from '../../src/infrastructure/database/message.database.js'

let clientId: string
let workerId: string
let otherClientId: string
let postId: string
let conversationId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  const otherClient = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Client })
  clientId = client.id
  workerId = worker.id
  otherClientId = otherClient.id

  const post = await prisma.post.create({
    data: {
      userId: clientId,
      title: 'Fix pipes',
      description: 'Need a plumber',
      address: '123 Main St',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      status: 'Active',
    },
  })
  postId = post.id

  const conv = await createConversation({ postId, clientId, workerId })
  conversationId = conv.id
})

describe('Conversation (data layer)', () => {
  describe('createConversation', () => {
    it('should create a conversation with all fields', async () => {
      const newPost = await prisma.post.create({
        data: {
          userId: clientId,
          title: 'Fix pipes',
          description: 'Need a plumber',
          address: '123 Main St',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-02'),
          status: 'Active',
        },
      })

      const conv = await createConversation({ postId: newPost.id, clientId, workerId })

      expect(conv.id).toBeDefined()
      expect(conv.postId).toBe(newPost.id)
      expect(conv.clientId).toBe(clientId)
      expect(conv.workerId).toBe(workerId)
      expect(conv.client.name).toBe('Client')
      expect(conv.worker.name).toBe('Worker')
      expect(conv.post.title).toBe('Fix pipes')
      expect(conv.createdAt).toBeInstanceOf(Date)
      expect(conv.lastMessageAt).toBeNull()
    })

    it('should fail when postId does not exist', async () => {
      await expect(createConversation({ postId: 'non-existent', clientId, workerId })).rejects.toThrow()
    })

    it('should fail when duplicate unique combo', async () => {
      await expect(createConversation({ postId, clientId, workerId })).rejects.toThrow()
    })
  })

  describe('findConversationById', () => {
    it('should find an existing conversation', async () => {
      const conv = await findConversationById(conversationId)
      expect(conv).not.toBeNull()
      expect(conv!.id).toBe(conversationId)
    })

    it('should return null for non-existing id', async () => {
      const conv = await findConversationById('non-existent')
      expect(conv).toBeNull()
    })
  })

  describe('findConversationByParticipants', () => {
    it('should find existing conversation', async () => {
      const conv = await findConversationByParticipants(postId, clientId, workerId)
      expect(conv).not.toBeNull()
      expect(conv!.id).toBe(conversationId)
    })

    it('should return null when not found', async () => {
      const conv = await findConversationByParticipants(postId, otherClientId, workerId)
      expect(conv).toBeNull()
    })
  })

  describe('findConversationsByUserId', () => {
    it('should find conversations as client', async () => {
      const convs = await findConversationsByUserId(clientId)
      expect(convs).toHaveLength(1)
      expect(convs[0].id).toBe(conversationId)
    })

    it('should find conversations as worker', async () => {
      const convs = await findConversationsByUserId(workerId)
      expect(convs).toHaveLength(1)
      expect(convs[0].id).toBe(conversationId)
    })

    it('should return empty array for user with no conversations', async () => {
      const convs = await findConversationsByUserId(otherClientId)
      expect(convs).toHaveLength(0)
    })

    it('should include lastMessage when messages exist', async () => {
      await createMessage({ conversationId, senderId: clientId, content: 'Hello' })
      await updateLastMessageAt(conversationId)
      const convs = await findConversationsByUserId(clientId)
      expect(convs[0].lastMessage).not.toBeNull()
      expect(convs[0].lastMessage!.content).toBe('Hello')
    })
  })

  describe('updateLastMessageAt', () => {
    it('should update lastMessageAt', async () => {
      const before = await findConversationById(conversationId)
      expect(before!.lastMessageAt).toBeNull()

      await updateLastMessageAt(conversationId)
      const after = await findConversationById(conversationId)
      expect(after!.lastMessageAt).toBeInstanceOf(Date)
    })
  })
})

describe('Message (data layer)', () => {
  describe('createMessage', () => {
    it('should create a message with all fields', async () => {
      const msg = await createMessage({ conversationId, senderId: clientId, content: 'Hello there' })

      expect(msg.id).toBeDefined()
      expect(msg.conversationId).toBe(conversationId)
      expect(msg.senderId).toBe(clientId)
      expect(msg.content).toBe('Hello there')
      expect(msg.sender.name).toBe('Client')
      expect(msg.createdAt).toBeInstanceOf(Date)
      expect(msg.readAt).toBeNull()
    })

    it('should fail when conversationId does not exist', async () => {
      await expect(createMessage({ conversationId: 'non-existent', senderId: clientId, content: 'Hi' })).rejects.toThrow()
    })
  })

  describe('findMessagesByConversationId', () => {
    it('should return messages in ascending order', async () => {
      await createMessage({ conversationId, senderId: clientId, content: 'First' })
      await createMessage({ conversationId, senderId: workerId, content: 'Second' })

      const messages = await findMessagesByConversationId(conversationId)
      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
    })

    it('should return empty array when no messages', async () => {
      const messages = await findMessagesByConversationId(conversationId)
      expect(messages).toHaveLength(0)
    })
  })

  describe('markMessagesAsRead', () => {
    it('should mark unread messages from other sender as read', async () => {
      await createMessage({ conversationId, senderId: clientId, content: 'Hello' })
      await createMessage({ conversationId, senderId: workerId, content: 'Reply' })

      await markMessagesAsRead(conversationId, clientId)

      const clientUnread = await countUnreadMessages(conversationId, clientId)
      const workerUnread = await countUnreadMessages(conversationId, workerId)

      expect(clientUnread).toBe(0)
      expect(workerUnread).toBe(1)
    })

    it('should not affect already read messages', async () => {
      await createMessage({ conversationId, senderId: workerId, content: 'Hi' })
      await markMessagesAsRead(conversationId, clientId)
      await markMessagesAsRead(conversationId, clientId)

      const unread = await countUnreadMessages(conversationId, clientId)
      expect(unread).toBe(0)
    })
  })

  describe('countUnreadMessages', () => {
    it('should count only messages from other sender', async () => {
      await createMessage({ conversationId, senderId: clientId, content: 'M1' })
      await createMessage({ conversationId, senderId: workerId, content: 'M2' })

      const clientUnread = await countUnreadMessages(conversationId, clientId)
      const workerUnread = await countUnreadMessages(conversationId, workerId)

      expect(clientUnread).toBe(1)
      expect(workerUnread).toBe(1)
    })

    it('should return 0 when all messages are read', async () => {
      await createMessage({ conversationId, senderId: workerId, content: 'M1' })
      await markMessagesAsRead(conversationId, clientId)

      const unread = await countUnreadMessages(conversationId, clientId)
      expect(unread).toBe(0)
    })
  })
})
