import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { toDomainConversation, toDomainConversationList } from '../transformers/conversation.transformer.js'
import type { DomainConversation, CreateConversationInput } from '../../domain/types/conversation.types.js'

const conversationFields = {
  id: true,
  postId: true,
  clientId: true,
  workerId: true,
  createdAt: true,
  lastMessageAt: true,
  post: { select: { id: true, title: true } },
  client: { select: { id: true, name: true } },
  worker: { select: { id: true, name: true } },
} satisfies Prisma.ConversationSelect

export type ConversationResult = Prisma.ConversationGetPayload<{ select: typeof conversationFields }>

const conversationListInclude = {
  post: { select: { id: true, title: true } },
  client: { select: { id: true, name: true } },
  worker: { select: { id: true, name: true } },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { content: true, createdAt: true },
  },
} satisfies Prisma.ConversationInclude

export type ConversationListResult = Prisma.ConversationGetPayload<{ include: typeof conversationListInclude }>

export const createConversation = async (data: CreateConversationInput): Promise<DomainConversation> => {
  const raw = await prisma.conversation.create({
    data: {
      postId: data.postId,
      clientId: data.clientId,
      workerId: data.workerId,
    },
    select: conversationFields,
  })
  return toDomainConversation(raw)
}

export const findConversationById = async (id: string): Promise<DomainConversation | null> => {
  const raw = await prisma.conversation.findUnique({
    where: { id },
    select: conversationFields,
  })
  return raw ? toDomainConversation(raw) : null
}

export const findConversationByParticipants = async (
  postId: string,
  clientId: string,
  workerId: string,
): Promise<DomainConversation | null> => {
  const raw = await prisma.conversation.findUnique({
    where: { clientId_workerId_postId: { clientId, workerId, postId } },
    select: conversationFields,
  })
  return raw ? toDomainConversation(raw) : null
}

export const findConversationsByUserId = async (userId: string): Promise<DomainConversation[]> => {
  const raw = await prisma.conversation.findMany({
    where: {
      OR: [{ clientId: userId }, { workerId: userId }],
    },
    include: conversationListInclude,
    orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
  })
  return raw.map(toDomainConversationList)
}

export const updateLastMessageAt = async (id: string): Promise<void> => {
  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  })
}
