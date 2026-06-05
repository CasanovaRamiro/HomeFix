import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { startKycVerification } from '../../domain/services/kyc.service.js'

const router = Router()

router.post('/session', jwtCheck, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { email?: string; sub?: string } | undefined
    const email = claims?.email

    if (!email) {
      const err = new Error('Token autenticado sin email') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const { sessionUrl, sessionId } = await startKycVerification(email)
    res.json({ sessionUrl, sessionId })
  } catch (e) {
    const err = e as Error & { status?: number }
    if (!err.status) err.status = 500
    next(err)
  }
})

export default router
