import { getBot } from '../../infrastructure/providers/telegram.provider.js'
import prisma from '../../lib/prisma.js'

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

export const startBot = () => {
  try {
    const bot = getBot()

    bot.start((ctx) =>
      ctx.reply(
        '¡Bienvenido a HomeFix! 🛠️\n\n'
        + 'Para vincular tu cuenta de Telegram con HomeFix:\n'
        + '1. Iniciá sesión en homefix.vercel.app\n'
        + '2. Andá a tu perfil → "Vincular Telegram"\n'
        + '3. Copiá el código que aparece\n'
        + '4. Enviá /link <código>\n\n'
        + 'Ejemplo: /link ABC12345',
      ),
    )

    bot.command('link', async (ctx) => {
      const code = ctx.message.text.split(' ')[1]?.trim().toUpperCase()
      if (!code) {
        await ctx.reply('Usá: /link CÓDIGO (ej: /link ABC12345)')
        return
      }

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
          telegramChatId: String(ctx.chat.id),
          telegramLinkedAt: new Date(),
        },
      })

      await ctx.reply('✅ ¡Cuenta vinculada con éxito! A partir de ahora vas a recibir notificaciones de HomeFix acá.')
    })

    bot.launch()
    console.log('Telegram bot started (polling)')
  } catch (err) {
    console.error('Failed to start Telegram bot:', err instanceof Error ? err.message : err)
  }
}
