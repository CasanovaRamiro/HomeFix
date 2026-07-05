import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { createLink, getStatus, unlink } from '../../domain/services/bot.service.js'
import { toBotLinkDTO, toBotStatusDTO } from '../transformers/bot.transformer.js'

const router = Router()

router.use(jwtCheck)

router.post('/link', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)
    const info = await createLink(user.id)
    res.json(toBotLinkDTO(info))
  } catch (err) {
    next(err)
  }
})

router.get('/status', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)
    const status = await getStatus(user.id)
    res.json(toBotStatusDTO(status ?? { linked: false, linkedAt: null }))
  } catch (err) {
    next(err)
  }
})

router.delete('/unlink', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)
    await unlink(user.id)
    res.json({ message: 'Cuenta de mensajería desvinculada' })
  } catch (err) {
    next(err)
  }
})

export default router
