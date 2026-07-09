import type { NotificationMessage, NotificationProvider } from '../types/notification.types.js'
import { findUserById } from '../../infrastructure/database/user.database.js'
import { clearBotLink, findEmergencyWorkers } from '../../infrastructure/database/bot.database.js'
import { env } from '../../lib/envConfig.js'
import { logger } from '../../lib/logger.js'

type EventType =
  | 'application_new'
  | 'application_accepted'
  | 'application_rejected'
  | 'worker_dismissed'
  | 'post_completed'
  | 'post_cancelled'
  | 'emergency_new'
  | 'start_confirmed'

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
  worker_dismissed: (d) => ({
    text: `⚠️ <b>Contratación cancelada</b>\nEl cliente te dio de baja del trabajo "${d.postTitle}"`,
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
  emergency_new: (d) => ({
    text: `📢 <b>Nueva publicación urgente</b>\n"${d.postTitle}" — ¡Aplicá ahora!\n\n${d.postDescription}`,
    parseMode: 'HTML',
  }),
  start_confirmed: (d) => ({
    text: `🚀 <b>Inicio confirmado</b>\nEl cliente confirmó el inicio del trabajo "${d.postTitle}"`,
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
  if (!user?.telegramChatId) {
    logger.debug({ userId, event, action: 'notification.skippedNoChat' }, 'Notification skipped: user has no chat ID')
    return
  }

  const message = templates[event](data)
  const ok = await provider.send(user.telegramChatId, message)

  if (!ok && provider.name === 'telegram') {
    logger.warn({ userId, event, action: 'notification.sendFailed' }, 'Failed to send notification, clearing chat ID')
    await clearBotLink(userId)
  }
}

export const broadcastEmergency = async (
  provider: NotificationProvider,
  postId: string,
  postTitle: string,
  postDescription: string,
  categoryId: string,
): Promise<void> => {
  const workers = await findEmergencyWorkers(categoryId)

  logger.info({ postId, categoryId, recipientCount: workers.length, action: 'notification.emergencyBroadcast' }, `Broadcasting emergency post to ${workers.length} workers`)

  const postUrl = `${env.CORS_ORIGIN!}/posts/${postId}`
  const isHttps = env.CORS_ORIGIN!.startsWith('https://')

  const message: NotificationMessage = {
    text: `📢 <b>Nueva publicación urgente</b>\n"${postTitle}" — ¡Aplicá ahora!\n\n${postDescription}\n\n🔗 ${postUrl}`,
    parseMode: 'HTML',
    ...(isHttps ? { buttons: [{ text: '🔍 Ver publicación', url: postUrl }] } : {}),
  }

  for (const worker of workers) {
    await provider.send(worker.chatId, message)
  }
}
