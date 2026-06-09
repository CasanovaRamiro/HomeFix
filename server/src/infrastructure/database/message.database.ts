import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { toDomainMessage } from '../transformers/message.transformer.js'
import type { DomainMessage, CreateMessageInput } from '../../domain/types/message.types.js'

const messageFields = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  createdAt: true,
  readAt: true,
  sender: { select: { id: true, name: true } },
} satisfies Prisma.MessageSelect

export type MessageResult = Prisma.MessageGetPayload<{ select: typeof messageFields }>

export const createMessage = async (data: CreateMessageInput): Promise<DomainMessage> => {
  const raw = await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
    },
    select: messageFields,
  })
  return toDomainMessage(raw)
}

export const findMessagesByConversationId = async (conversationId: string): Promise<DomainMessage[]> => {
  const raw = await prisma.message.findMany({
    where: { conversationId },
    select: messageFields,
    orderBy: { createdAt: 'asc' },
  })
  return raw.map(toDomainMessage)
}

export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  })
}

export const countUnreadMessages = async (conversationId: string, userId: string): Promise<number> => {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
  })
}
