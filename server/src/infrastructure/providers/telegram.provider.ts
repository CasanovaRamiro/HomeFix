import { Telegraf } from 'telegraf'
import { logger } from '../../lib/logger.js'
import type { NotificationProvider, NotificationMessage } from '../../domain/types/notification.types.js'
import { env } from '../../lib/envConfig.js'
import { createHttpError } from '../../lib/errors.js'

let _bot: Telegraf | null = null

export const getBot = (): Telegraf => {
  if (_bot) return _bot
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) throw createHttpError(500, 'TELEGRAM_BOT_TOKEN is not configured')
  _bot = new Telegraf(token)
  logger.info({ action: 'telegram.botCreated' }, 'Telegram bot created')
  return _bot
}

export const createTelegramProvider = (): NotificationProvider => {
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) {
    logger.warn({ action: 'telegram.init' }, 'TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled')
    return { name: 'telegram', send: async () => false }
  }

  const bot = getBot()

  return {
    name: 'telegram',
    async send(recipient: string, message: NotificationMessage): Promise<boolean> {
      try {
        const parseMode = message.parseMode === 'HTML' ? 'HTML'
          : message.parseMode === 'Markdown' ? 'Markdown'
          : undefined
        const extra: Record<string, unknown> = {}
        if (parseMode) extra.parse_mode = parseMode
        if (message.buttons?.length) {
          extra.reply_markup = { inline_keyboard: [message.buttons.map((b) => ({ text: b.text, url: b.url }))] }
        }
        await bot.telegram.sendMessage(recipient, message.text, extra)
        return true
      } catch (err) {
        const code = (err as { code?: number })?.code
        if (code === 403) {
          logger.warn({ recipient, action: 'telegram.send' }, 'Bot blocked by user')
        } else {
          logger.error({ err, recipient, action: 'telegram.send' }, 'Telegram send error')
        }
        return false
      }
    },
  }
}
