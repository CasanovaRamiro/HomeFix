export interface ConversationSummary {
  id: string
  postTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface DomainConversation {
  id: string
  postId: string
  clientId: string
  workerId: string
  createdAt: string
  lastMessageAt: string | null
  post: { id: string; title: string }
  client: { id: string; name: string }
  worker: { id: string; name: string }
  lastMessage: { content: string; createdAt: string } | null
  unreadCount: number
}

export interface DomainMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
  sender: { id: string; name: string }
}
