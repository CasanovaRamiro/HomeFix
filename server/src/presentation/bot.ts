import type { Context, Telegraf } from 'telegraf'
import { env } from '../lib/envConfig.js'
import { linkAccount, resolveGreeting, toggleEmergencies } from '../domain/services/bot.service.js'
import type { NotificationMessage } from '../domain/types/notification.types.js'
import {
  renderEmergencyToggle,
  renderGreeting,
  renderHelp,
  renderLinkResult,
  renderLinkUsage,
  renderWelcome,
} from './transformers/bot-reply.transformer.js'

const chatIdOf = (ctx: Context): string => String(ctx.chat?.id)

const reply = async (ctx: Context, message: NotificationMessage): Promise<void> => {
  if (!message.parseMode && !message.buttons?.length) {
    await ctx.reply(message.text)
    return
  }
  const extra: Record<string, unknown> = {}
  if (message.parseMode) extra.parse_mode = message.parseMode
  if (message.buttons?.length) {
    extra.reply_markup = { inline_keyboard: [message.buttons.map((b) => ({ text: b.text, url: b.url }))] }
  }
  await ctx.reply(message.text, extra)
}

/**
 * Registers inbound Telegram handlers. The Telegraf transport instance is injected
 * by the composition root (see infrastructure/providers/telegram.provider.ts#launchBot)
 * so this presentation adapter stays free of infrastructure imports. Handlers only
 * dispatch to the domain service and render the reply — the wording lives in the
 * bot-reply transformer.
 */
export const registerTelegramHandlers = (bot: Telegraf): void => {
  bot.start(async (ctx) => {
    if (ctx.payload) {
      await reply(ctx, renderLinkResult(await linkAccount(chatIdOf(ctx), ctx.payload)))
      return
    }
    await reply(ctx, renderWelcome())
  })

  bot.command('link', async (ctx) => {
    const code = ctx.message.text.split(' ')[1]?.trim()
    if (!code) {
      await reply(ctx, renderLinkUsage())
      return
    }
    await reply(ctx, renderLinkResult(await linkAccount(chatIdOf(ctx), code)))
  })

  bot.command('emergencias', async (ctx) => {
    await reply(ctx, renderEmergencyToggle(await toggleEmergencies(chatIdOf(ctx))))
  })

  bot.command('help', async (ctx) => {
    await reply(ctx, renderHelp())
  })

  bot.on('text', async (ctx) => {
    await reply(ctx, renderGreeting(await resolveGreeting(chatIdOf(ctx)), env.CORS_ORIGIN ?? ''))
  })
}
