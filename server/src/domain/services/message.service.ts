import {
  createMessage as createMessageData,
  findMessagesByConversationId,
  markMessagesAsRead,
} from '../../infrastructure/database/message.database.js'
import { updateLastMessageAt, findConversationById } from '../../infrastructure/database/conversation.database.js'
import type { DomainMessage, CreateMessageInput } from '../types/message.types.js'

const validateContent = (content: string): void => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw Object.assign(new Error('Content is required'), { status: 400 })
  }
  if (content.length > 2000) {
    throw Object.assign(new Error('Content must not exceed 2000 characters'), { status: 400 })
  }
}

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
): Promise<DomainMessage> => {
  validateContent(content)

  const conversation = await findConversationById(conversationId)
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { status: 404 })
  }
  if (conversation.clientId !== senderId && conversation.workerId !== senderId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  const input: CreateMessageInput = { conversationId, senderId, content: content.trim() }
  const message = await createMessageData(input)
  await updateLastMessageAt(conversationId)
  return message
}

export const getConversationMessages = async (
  conversationId: string,
  userId: string,
): Promise<DomainMessage[]> => {
  const conversation = await findConversationById(conversationId)
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { status: 404 })
  }
  if (conversation.clientId !== userId && conversation.workerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  await markMessagesAsRead(conversationId, userId)
  return findMessagesByConversationId(conversationId)
}

export const readMessages = async (conversationId: string, userId: string): Promise<void> => {
  const conversation = await findConversationById(conversationId)
  if (!conversation) {
    throw Object.assign(new Error('Conversation not found'), { status: 404 })
  }
  if (conversation.clientId !== userId && conversation.workerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  await markMessagesAsRead(conversationId, userId)
}
