import type { MessageResult } from '../database/message.database.js'
import type { DomainMessage } from '../../domain/types/message.types.js'

export const toDomainMessage = (r: MessageResult): DomainMessage => ({
  id: r.id,
  conversationId: r.conversationId,
  senderId: r.senderId,
  content: r.content,
  createdAt: r.createdAt,
  readAt: r.readAt,
  sender: r.sender,
})
