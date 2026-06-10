import type { NotificationMessage, NotificationProvider } from '../types/notification.types.js'
import { findUserById } from '../../infrastructure/database/user.database.js'

type EventType =
  | 'application_new'
  | 'application_accepted'
  | 'application_rejected'
  | 'post_completed'
  | 'post_cancelled'

const templates: Record<EventType, (data: Record<string, string>) => NotificationMessage> = {
  application_new: (d) => ({
    text: `📩 <b>Nuevo postulante</b>\n${d.workerName} se postuló a "${d.postTitle}"`,
    parseMode: 'HTML',
  }),
  application_accepted: (d) => ({
    text: `✅ <b>Postulación aceptada</b>\nTu postulación a "${d.postTitle}" fue aceptada`,
    parseMode: 'HTML',
  }),
  application_rejected: (d) => ({
    text: `❌ <b>Postulación rechazada</b>\nTu postulación a "${d.postTitle}" fue rechazada`,
    parseMode: 'HTML',
  }),
  post_completed: (d) => ({
    text: `✅ <b>Trabajo finalizado</b>\nEl trabajo "${d.postTitle}" fue marcado como completado`,
    parseMode: 'HTML',
  }),
  post_cancelled: (d) => ({
    text: `🚫 <b>Trabajo cancelado</b>\nEl trabajo "${d.postTitle}" fue cancelado`,
    parseMode: 'HTML',
  }),
}

export const notifyUser = async (
  provider: NotificationProvider,
  userId: string,
  event: EventType,
  data: Record<string, string>,
): Promise<void> => {
  const user = await findUserById(userId)
  if (!user?.telegramChatId) return

  const message = templates[event](data)
  const ok = await provider.send(user.telegramChatId, message)

  if (!ok && provider.name === 'telegram') {
    await clearTelegramChatId(userId)
  }
}

const clearTelegramChatId = async (userId: string) => {
  const prisma = (await import('../../lib/prisma.js')).default
  await prisma.user.update({ where: { id: userId }, data: { telegramChatId: null, telegramLinkedAt: null } })
}
