import { getBot } from '../../infrastructure/providers/telegram.provider.js'
import type { Context } from 'telegraf'
import prisma from '../../lib/prisma.js'

let _botUsername: string | null = null

export const getBotUsername = async (): Promise<string> => {
  if (_botUsername) return _botUsername
  const bot = getBot()
  const me = await bot.telegram.getMe()
  const username = me.username ?? 'HomeFixBot'
  _botUsername = username
  return username
}

const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const createLinkCode = async (userId: string): Promise<string> => {
  const code = generateCode()
  await prisma.telegramLinkCode.create({
    data: {
      userId,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })
  return code
}

export const processLink = async (ctx: Context, code: string) => {
  const linkCode = await prisma.telegramLinkCode.findUnique({ where: { code } })
  if (!linkCode || linkCode.used || linkCode.expiresAt < new Date()) {
    await ctx.reply('Código inválido o expirado. Generá uno nuevo en tu perfil.')
    return
  }

  await prisma.telegramLinkCode.update({
    where: { id: linkCode.id },
    data: { used: true },
  })

  await prisma.user.update({
    where: { id: linkCode.userId },
    data: {
      telegramChatId: String(ctx.chat?.id),
      telegramLinkedAt: new Date(),
    },
  })

  await ctx.reply('✅ ¡Cuenta vinculada con éxito! A partir de ahora vas a recibir notificaciones de HomeFix acá.')
}

export const handleTextMessage = async (ctx: Context): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: { telegramChatId: String(ctx.chat?.id) },
    select: { id: true, name: true },
  })

  if (user) {
    await ctx.reply(`¡Hola ${user.name}, recordá que con HomeFix podés solucionar cualquier inconveniente que tengas en tu casa!`)
  } else {
    await ctx.reply(
      '👋 ¡Hola! No tengo tu cuenta vinculada todavía.\n\n'
      + 'Para recibir notificaciones de HomeFix:\n'
      + '1. Iniciá sesión en homefix.vercel.app\n'
      + '2. Andá a tu perfil → "Vincular Telegram"\n'
      + '3. Generá un código y enviá /link <código>',
    )
  }
}

export const startBot = () => {
  try {
    const bot = getBot()

    bot.start(async (ctx) => {
      if (ctx.payload) {
        await processLink(ctx, ctx.payload.toUpperCase())
        return
      }
      await ctx.reply(
        '¡Bienvenido a HomeFix! 🛠️\n\n'
        + 'Para vincular tu cuenta de Telegram con HomeFix:\n'
        + '1. Iniciá sesión en homefix.vercel.app\n'
        + '2. Andá a tu perfil → "Vincular Telegram"\n'
        + '3. Copiá el código que aparece\n'
        + '4. Enviá /link <código>\n\n'
        + 'Ejemplo: /link ABC12345',
      )
    })

    bot.command('link', async (ctx) => {
      const code = ctx.message.text.split(' ')[1]?.trim().toUpperCase()
      if (!code) {
        await ctx.reply('Usá: /link CÓDIGO (ej: /link ABC12345)')
        return
      }
      await processLink(ctx, code)
    })

    bot.on('text', (ctx) => { void handleTextMessage(ctx) })

    bot.launch()
    console.log('Telegram bot started (polling)')
  } catch (err) {
    console.error('Failed to start Telegram bot:', err instanceof Error ? err.message : err)
  }
}
