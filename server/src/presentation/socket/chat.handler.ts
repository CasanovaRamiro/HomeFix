import type { Server, Socket } from 'socket.io'
import { sendMessage } from '../../domain/services/message.service.js'
import { markMessagesAsRead } from '../../infrastructure/database/message.database.js'
import { findConversationById } from '../../infrastructure/database/conversation.database.js'

interface ChatUser {
  id: string
  name: string
}

export const registerChatHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as ChatUser | undefined
    if (!user) return

    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    socket.on('message:send', async (data: { conversationId: string; content: string }) => {
      try {
        const message = await sendMessage(data.conversationId, user.id, data.content)

        const conversation = await findConversationById(data.conversationId)
        if (conversation) {
          const otherUserId = conversation.clientId === user.id ? conversation.workerId : conversation.clientId
          const otherSocket = await findSocketByUserId(io, otherUserId)
          if (otherSocket) {
            otherSocket.join(`conversation:${data.conversationId}`)
          }
        }

        io.to(`conversation:${data.conversationId}`).emit('message:new', {
          ...message,
          createdAt: message.createdAt.toISOString(),
          readAt: message.readAt?.toISOString() ?? null,
        })
      } catch {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('message:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
        userId: user.id,
        isTyping: data.isTyping,
      })
    })

    socket.on('message:read', async (conversationId: string) => {
      try {
        await markMessagesAsRead(conversationId, user.id)
        io.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          readByUserId: user.id,
        })
      } catch {
        // silent
      }
    })
  })
}

export const findSocketByUserId = async (io: Server, userId: string): Promise<Socket | undefined> => {
  const connected = io.sockets.sockets
  for (const socket of connected.values()) {
    if ((socket.data.user as ChatUser | undefined)?.id === userId) return socket
  }
  return undefined
}
