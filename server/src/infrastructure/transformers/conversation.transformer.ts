import type { ConversationResult, ConversationListResult } from '../database/conversation.database.js'
import type { DomainConversation } from '../../domain/types/conversation.types.js'

export const toDomainConversation = (r: ConversationResult): DomainConversation => ({
  id: r.id,
  postId: r.postId,
  clientId: r.clientId,
  workerId: r.workerId,
  createdAt: r.createdAt,
  lastMessageAt: r.lastMessageAt,
  post: r.post,
  client: r.client,
  worker: r.worker,
  lastMessage: null,
  unreadCount: 0,
})

export const toDomainConversationList = (r: ConversationListResult): DomainConversation => ({
  id: r.id,
  postId: r.postId,
  clientId: r.clientId,
  workerId: r.workerId,
  createdAt: r.createdAt,
  lastMessageAt: r.lastMessageAt,
  post: r.post,
  client: r.client,
  worker: r.worker,
  lastMessage: r.messages[0] ?? null,
  unreadCount: 0,
})
