export interface DomainConversation {
  id: string
  postId: string
  clientId: string
  workerId: string
  createdAt: Date
  lastMessageAt: Date | null
  post: { id: string; title: string }
  client: { id: string; name: string }
  worker: { id: string; name: string }
  lastMessage: { content: string; createdAt: Date } | null
  unreadCount: number
}

export interface CreateConversationInput {
  postId: string
  clientId: string
  workerId: string
}

export interface ConversationSummary {
  id: string
  postTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}
