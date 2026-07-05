import prisma from '../../lib/prisma.js'
import type {
  DomainLinkCode,
  DomainBotStatus,
  EmergencyWorker,
  BotUser,
} from '../../domain/types/bot.types.js'

// NOTE: the underlying columns (`telegramChatId`, `telegramLinkedAt`) and the
// `telegramLinkCode` model are still provider-named in the Prisma schema.
// Renaming them to `bot*` would require a migration; the domain-facing API below
// is provider-agnostic (`chatId`, `BotStatus`, …) so the rest of the app is decoupled.

export const createLinkCode = (userId: string, code: string, expiresAt: Date): Promise<{ code: string }> =>
  prisma.telegramLinkCode.create({ data: { userId, code, expiresAt }, select: { code: true } })

export const findLinkCode = (code: string): Promise<DomainLinkCode | null> =>
  prisma.telegramLinkCode.findUnique({
    where: { code },
    select: { id: true, userId: true, used: true, expiresAt: true },
  })

export const markLinkCodeUsed = async (id: string): Promise<void> => {
  await prisma.telegramLinkCode.update({ where: { id }, data: { used: true }, select: { id: true } })
}

export const linkChatToUser = async (userId: string, chatId: string): Promise<void> => {
  await prisma.user.updateMany({
    where: { telegramChatId: chatId, id: { not: userId } },
    data: { telegramChatId: null, telegramLinkedAt: null },
  })
  await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: chatId, telegramLinkedAt: new Date() },
    select: { id: true },
  })
}

export const clearBotLink = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: null, telegramLinkedAt: null },
    select: { id: true },
  })
}

export const findUserByChatId = (chatId: string): Promise<BotUser | null> =>
  prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true, name: true, role: true, emergenciesEnabled: true },
  })

export const setEmergenciesEnabled = async (userId: string, enabled: boolean): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { emergenciesEnabled: enabled },
    select: { id: true },
  })
}

export const findBotStatus = (userId: string): Promise<DomainBotStatus | null> =>
  prisma.user
    .findUnique({ where: { id: userId }, select: { telegramChatId: true, telegramLinkedAt: true } })
    .then((u) => (u ? { linked: !!u.telegramChatId, linkedAt: u.telegramLinkedAt } : null))

export const findEmergencyWorkers = (categoryId: string): Promise<EmergencyWorker[]> =>
  prisma.user
    .findMany({
      where: {
        emergenciesEnabled: true,
        telegramChatId: { not: null },
        categories: { some: { categoryId } },
      },
      select: { id: true, telegramChatId: true },
    })
    .then((rows) => rows.flatMap((r) => (r.telegramChatId ? [{ id: r.id, chatId: r.telegramChatId }] : [])))
