import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { createLinkCode, getBotUsername } from '../telegram/bot.js'
import prisma from '../../lib/prisma.js'

const router = Router()

router.use(jwtCheck)

router.post('/link', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)
    const code = await createLinkCode(user.id)
    const username = await getBotUsername()
    const deepLink = `https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3D${username}%26start%3D${code}`
    res.json({ code, deepLink, message: `Enviá /link ${code} al bot de HomeFix en Telegram` })
  } catch (err) {
    next(err)
  }
})

router.get('/status', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { telegramChatId: true, telegramLinkedAt: true },
    })

    res.json({
      linked: !!dbUser?.telegramChatId,
      linkedAt: dbUser?.telegramLinkedAt ?? null,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/unlink', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: null, telegramLinkedAt: null },
    })

    res.json({ message: 'Telegram desvinculado' })
  } catch (err) {
    next(err)
  }
})

export default router
