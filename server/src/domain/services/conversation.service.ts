import {
  createConversation as createConversationData,
  findConversationById,
  findConversationByParticipants,
  findConversationsByUserId,
} from '../../infrastructure/database/conversation.database.js'
import { countUnreadMessages } from '../../infrastructure/database/message.database.js'
import { findPostById } from '../../infrastructure/database/post.database.js'
import type { DomainConversation, CreateConversationInput, ConversationSummary } from '../types/conversation.types.js'

export const getOrCreateConversation = async (
  postId: string,
  clientId: string,
  workerId: string,
): Promise<DomainConversation> => {
  const existing = await findConversationByParticipants(postId, clientId, workerId)
  if (existing) return existing

  const post = await findPostById(postId)
  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 })
  }

  const input: CreateConversationInput = { postId, clientId, workerId }
  return createConversationData(input)
}

export const getUserConversations = async (userId: string): Promise<ConversationSummary[]> => {
  const conversations = await findConversationsByUserId(userId)
  const summaries: ConversationSummary[] = []

  for (const conv of conversations) {
    const otherUser = conv.clientId === userId ? conv.worker : conv.client
    const unreadCount = await countUnreadMessages(conv.id, userId)

    summaries.push({
      id: conv.id,
      postTitle: conv.post.title,
      otherUserId: otherUser.id,
      otherUserName: otherUser.name,
      lastMessage: conv.lastMessage?.content ?? null,
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      unreadCount,
    })
  }

  return summaries
}

export const getConversationById = async (
  conversationId: string,
  userId: string,
): Promise<DomainConversation | null> => {
  const conversation = await findConversationById(conversationId)
  if (!conversation) return null
  if (conversation.clientId !== userId && conversation.workerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  const unreadCount = await countUnreadMessages(conversation.id, userId)
  return { ...conversation, unreadCount }
}
