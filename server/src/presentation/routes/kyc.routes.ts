import { Router } from 'express'
import { startKycVerification, confirmKyc, getKycStatus } from '../../domain/services/kyc.service.js'

const router = Router()

function getEmail(req: import('express').Request): string | undefined {
  const claims = req.auth?.payload as { email?: string; sub?: string } | undefined
  return claims?.email
}

router.post('/session', async (req, res, next) => {
  try {
    const email = getEmail(req)
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

router.post('/confirm', async (req, res, next) => {
  try {
    const email = getEmail(req)
    if (!email) {
      const err = new Error('Token autenticado sin email') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const { sessionId } = req.body as { sessionId?: string }
    if (!sessionId) {
      const err = new Error('sessionId es requerido') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const result = await confirmKyc(email, sessionId)
    res.json(result)
  } catch (e) {
    const err = e as Error & { status?: number }
    if (!err.status) err.status = 500
    next(err)
  }
})

router.get('/status', async (req, res, next) => {
  try {
    const email = getEmail(req)
    if (!email) {
      const err = new Error('Token autenticado sin email') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const result = await getKycStatus(email)
    res.json(result)
  } catch (e) {
    const err = e as Error & { status?: number }
    if (!err.status) err.status = 500
    next(err)
  }
})

export default router
