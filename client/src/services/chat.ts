import api from './api'
import type { ConversationSummary, DomainConversation, DomainMessage } from '../types/chat'

export const getConversations = (): Promise<ConversationSummary[]> =>
  api.get<ConversationSummary[]>('/conversations').then((r) => r.data)

export const getConversationById = (id: string): Promise<DomainConversation> =>
  api.get<DomainConversation>(`/conversations/${id}`).then((r) => r.data)

export const getConversationMessages = (id: string): Promise<DomainMessage[]> =>
  api.get<DomainMessage[]>(`/conversations/${id}/messages`).then((r) => r.data)

export const sendMessage = (id: string, content: string): Promise<DomainMessage> =>
  api.post<DomainMessage>(`/conversations/${id}/messages`, { content }).then((r) => r.data)

export const createConversation = (postId: string, workerId: string): Promise<DomainConversation> =>
  api.post<DomainConversation>('/conversations', { postId, workerId }).then((r) => r.data)

export const markAsRead = (id: string): Promise<void> =>
  api.patch(`/conversations/${id}/read`).then(() => undefined)
