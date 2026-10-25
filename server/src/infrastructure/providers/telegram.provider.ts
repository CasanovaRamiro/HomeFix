import { Telegraf } from 'telegraf'
import { logger } from '../../lib/logger.js'
import type { NotificationProvider, NotificationMessage, NotificationSendResult } from '../../domain/types/notification.types.js'
import { env } from '../../lib/envConfig.js'
import { createHttpError } from '../../lib/errors.js'

let _bot: Telegraf | null = null
let _botUsername: string | null = null

export const getBot = (): Telegraf => {
  if (_bot) return _bot
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) throw createHttpError(500, 'TELEGRAM_BOT_TOKEN is not configured')
  _bot = new Telegraf(token)
  logger.info({ action: 'telegram.botCreated' }, 'Telegram bot created')
  return _bot
}

export const getBotUsername = async (): Promise<string> => {
  if (_botUsername) return _botUsername
  const me = await getBot().telegram.getMe()
  _botUsername = me.username ?? 'HomeFixBot'
  return _botUsername
}

/** Telegram-specific deep link that opens the bot chat and pre-fills the /start payload. */
export const buildStartLink = async (code: string): Promise<string> => {
  const username = await getBotUsername()
  return `https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3D${username}%26start%3D${code}`
}

/**
 * Launches the inbound Telegram bot (polling). Handler wiring is injected by the
 * composition root so this transport layer never imports presentation/domain code.
 */
export const launchBot = (registerHandlers: (bot: Telegraf) => void): void => {
  try {
    const bot = getBot()
    registerHandlers(bot)
    bot.catch((err) => {
      logger.error({ err, action: 'telegram.bot' }, 'Telegram bot error')
    })
    bot.launch().catch((err) => {
      logger.error({ err, action: 'telegram.bot' }, 'Telegram bot launch error')
    })
    logger.info({ action: 'telegram.bot' }, 'Telegram bot started (polling)')
  } catch (err) {
    logger.error({ err, action: 'telegram.bot' }, 'Failed to start Telegram bot')
  }
}

export function isPermanentTelegramBlock(err: unknown): boolean {
  const telegramError = err as {
    code?: number
    description?: string
    response?: { error_code?: number; description?: string }
  }
  const code = telegramError.code ?? telegramError.response?.error_code
  const description = telegramError.description ?? telegramError.response?.description ?? ''
  return code === 403 && /bot was blocked by the user/i.test(description)
}

export const createTelegramProvider = (): NotificationProvider => {
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) {
    logger.warn({ action: 'telegram.init' }, 'TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled')
    return { name: 'telegram', send: async (): Promise<NotificationSendResult> => ({ ok: false, reason: 'transient' }) }
  }

  const bot = getBot()

  return {
    name: 'telegram',
    async send(recipient: string, message: NotificationMessage): Promise<NotificationSendResult> {
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
        return { ok: true }
      } catch (err) {
        if (isPermanentTelegramBlock(err)) {
          logger.warn({ recipient, action: 'telegram.send' }, 'Bot blocked by user')
          return { ok: false, reason: 'permanent_block' }
        } else {
          logger.error({ err, recipient, action: 'telegram.send' }, 'Telegram send error')
        }
        return { ok: false, reason: 'transient' }
      }
    },
  }
}
