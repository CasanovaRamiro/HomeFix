/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Server, Socket } from 'socket.io'

vi.mock('../../src/domain/services/message.service.js', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/message.database.js', () => ({
  markMessagesAsRead: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/conversation.database.js', () => ({
  findConversationById: vi.fn(),
}))

import { sendMessage } from '../../src/domain/services/message.service.js'
import { markMessagesAsRead } from '../../src/infrastructure/database/message.database.js'
import { findConversationById } from '../../src/infrastructure/database/conversation.database.js'
import { registerChatHandlers, findSocketByUserId } from '../../src/presentation/socket/chat.handler.js'

interface HandlerBag {
  conversationJoin: (...args: unknown[]) => void
  conversationLeave: (...args: unknown[]) => void
  messageSend: (...args: unknown[]) => void
  messageTyping: (...args: unknown[]) => void
  messageRead: (...args: unknown[]) => void
}

const createMockIo = () => {
  const connectionHandlers: Array<(socket: Socket) => void> = []
  const io = {
    on: vi.fn((event: string, handler: (socket: Socket) => void) => {
      if (event === 'connection') connectionHandlers.push(handler)
    }),
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    sockets: {
      sockets: new Map<string, Socket>(),
    },
  } as unknown as Server
  return { io, connectionHandlers }
}

const createSocket = (user: { id: string; name: string }): { socket: Socket; handlers: HandlerBag } => {
  const handlers: HandlerBag = {
    conversationJoin: () => undefined,
    conversationLeave: () => undefined,
    messageSend: () => undefined,
    messageTyping: () => undefined,
    messageRead: () => undefined,
  }
  const socket = {
    data: { user },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'conversation:join') handlers.conversationJoin = handler
      if (event === 'conversation:leave') handlers.conversationLeave = handler
      if (event === 'message:send') handlers.messageSend = handler
      if (event === 'message:typing') handlers.messageTyping = handler
      if (event === 'message:read') handlers.messageRead = handler
    }),
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  } as unknown as Socket
  return { socket, handlers }
}

const mockMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello',
  createdAt: new Date('2026-06-01T10:00:00Z'),
  readAt: null,
  sender: { id: 'user-1', name: 'Test' },
}

describe('registerChatHandlers', () => {
  let io: Server
  let emitConnection: (socket: Socket) => void

  beforeEach(() => {
    vi.clearAllMocks()
    const res = createMockIo()
    io = res.io
    registerChatHandlers(io)
    emitConnection = (socket) => res.connectionHandlers[0](socket)
  })

  it('should not register handlers when socket has no user', () => {
    const { socket } = createSocket({ id: '', name: '' })
    socket.data = {} as never
    emitConnection(socket)

    expect(socket.on).not.toHaveBeenCalled()
  })

  describe('conversation:join', () => {
    it('should join the conversation room', () => {
      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      handlers.conversationJoin('conv-1')

      expect(socket.join).toHaveBeenCalledWith('conversation:conv-1')
    })
  })

  describe('conversation:leave', () => {
    it('should leave the conversation room', () => {
      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      handlers.conversationLeave('conv-1')

      expect(socket.leave).toHaveBeenCalledWith('conversation:conv-1')
    })
  })

  describe('message:send', () => {
    it('should send message and emit message:new to room', async () => {
      vi.mocked(sendMessage).mockResolvedValue(mockMessage as never)
      vi.mocked(findConversationById).mockResolvedValue(null as never)

      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      await (handlers.messageSend as (...args: unknown[]) => Promise<void>)({ conversationId: 'conv-1', content: 'Hello' })

      expect(sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', 'Hello')
      expect(io.to).toHaveBeenCalledWith('conversation:conv-1')
      expect((io.to as ReturnType<typeof vi.fn>).mock.results[0].value.emit).toHaveBeenCalledWith(
        'message:new',
        expect.objectContaining({
          id: 'msg-1',
          content: 'Hello',
          createdAt: '2026-06-01T10:00:00.000Z',
          readAt: null,
        }),
      )
    })

    it('should auto-join other user socket when findSocketByUserId finds them', async () => {
      vi.mocked(sendMessage).mockResolvedValue(mockMessage as never)
      vi.mocked(findConversationById).mockResolvedValue({
        id: 'conv-1',
        clientId: 'user-2',
        workerId: 'user-1',
      } as never)

      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      io.sockets.sockets.set('sock-other', { data: { user: { id: 'user-2' } }, join: vi.fn() } as unknown as Socket)
      emitConnection(socket)

      await (handlers.messageSend as (...args: unknown[]) => Promise<void>)({ conversationId: 'conv-1', content: 'Hello' })

      const otherJoinMock = (io.sockets.sockets.get('sock-other') as unknown as { join: ReturnType<typeof vi.fn> }).join
      expect(otherJoinMock).toHaveBeenCalledWith('conversation:conv-1')
    })

    it('should emit error on failure', async () => {
      vi.mocked(sendMessage).mockRejectedValue(new Error('DB error'))

      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      await (handlers.messageSend as (...args: unknown[]) => Promise<void>)({ conversationId: 'conv-1', content: 'Hello' })

      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to send message' })
    })
  })

  describe('message:typing', () => {
    it('should relay typing event to conversation room excluding sender', () => {
      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      handlers.messageTyping({ conversationId: 'conv-1', isTyping: true })

      expect(socket.to).toHaveBeenCalledWith('conversation:conv-1')
      expect((socket.to as ReturnType<typeof vi.fn>).mock.results[0].value.emit).toHaveBeenCalledWith(
        'message:typing',
        { userId: 'user-1', isTyping: true },
      )
    })
  })

  describe('message:read', () => {
    it('should mark messages as read and emit message:read to room', async () => {
      vi.mocked(markMessagesAsRead).mockResolvedValue(undefined as never)

      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      await (handlers.messageRead as (...args: unknown[]) => Promise<void>)('conv-1')

      expect(markMessagesAsRead).toHaveBeenCalledWith('conv-1', 'user-1')
      expect(io.to).toHaveBeenCalledWith('conversation:conv-1')
      expect((io.to as ReturnType<typeof vi.fn>).mock.results[0].value.emit).toHaveBeenCalledWith(
        'message:read',
        { conversationId: 'conv-1', readByUserId: 'user-1' },
      )
    })

    it('should not throw when markMessagesAsRead fails', async () => {
      vi.mocked(markMessagesAsRead).mockRejectedValue(new Error('DB error'))

      const { socket, handlers } = createSocket({ id: 'user-1', name: 'Test' })
      emitConnection(socket)

      await expect(
        (handlers.messageRead as (...args: unknown[]) => Promise<void>)('conv-1'),
      ).resolves.toBeUndefined()
    })
  })
})

describe('findSocketByUserId', () => {
  it('should find socket by user id', async () => {
    const targetSocket = { data: { user: { id: 'target-user' } } } as unknown as Socket
    const io = {
      sockets: {
        sockets: new Map([
          ['sock-1', { data: { user: { id: 'other-user' } } } as unknown as Socket],
          ['sock-2', targetSocket],
        ]),
      },
    } as unknown as Server

    const result = await findSocketByUserId(io, 'target-user')

    expect(result).toBe(targetSocket)
  })

  it('should return undefined when user not connected', async () => {
    const io = {
      sockets: {
        sockets: new Map([
          ['sock-1', { data: { user: { id: 'other-user' } } } as unknown as Socket],
        ]),
      },
    } as unknown as Server

    const result = await findSocketByUserId(io, 'unknown-user')

    expect(result).toBeUndefined()
  })

  it('should return undefined when no sockets connected', async () => {
    const io = {
      sockets: {
        sockets: new Map(),
      },
    } as unknown as Server

    const result = await findSocketByUserId(io, 'any-user')

    expect(result).toBeUndefined()
  })
})
