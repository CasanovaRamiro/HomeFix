import { useCallback, useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { ConversationSummary, DomainMessage } from '../types/chat'
import * as chatApi from '../services/chat'

export function useConversations(socket: Socket | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DomainMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }
    chatApi.getConversations().then((data) => {
      setConversations(data)
      setIsLoading(false)
    })
  }, [socket])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    chatApi.getConversationMessages(selectedId).then(setMessages)
    chatApi.markAsRead(selectedId)

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
    )
  }, [selectedId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg: DomainMessage) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== msg.conversationId) return c
          return {
            ...c,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: c.id === selectedId ? 0 : c.unreadCount + 1,
          }
        }),
      )

      if (msg.conversationId === selectedId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    const handleMessageRead = (data: { conversationId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === data.conversationId ? { ...m, readAt: new Date().toISOString() } : m,
        ),
      )
    }

    socket.on('message:new', handleNewMessage)
    socket.on('message:read', handleMessageRead)

    if (selectedId) {
      socket.emit('conversation:join', selectedId)
    }

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('message:read', handleMessageRead)
      if (selectedId) {
        socket.emit('conversation:leave', selectedId)
      }
    }
  }, [socket, selectedId])

  const selectConversation = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedId) return

      if (socket?.connected) {
        socket.emit('message:send', { conversationId: selectedId, content })
      } else {
        const msg = await chatApi.sendMessage(selectedId, content)
        setMessages((prev) => [...prev, msg])
      }
    },
    [selectedId, socket],
  )

  const refetch = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) return Promise.resolve()
    return chatApi.getConversations().then((data) => {
      setConversations(data)
    })
  }, [])

  return {
    conversations,
    selectedId,
    messages,
    isLoading,
    totalUnread,
    selectConversation,
    sendMessage,
    refetch,
  }
}
