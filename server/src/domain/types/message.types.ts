export interface DomainMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Date
  readAt: Date | null
  sender: { id: string; name: string }
}

export interface CreateMessageInput {
  conversationId: string
  senderId: string
  content: string
}
