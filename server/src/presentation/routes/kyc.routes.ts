import { Router } from 'express'
import { startKycVerification, confirmKyc, getKycStatus, getKycDecision, handleKycWebhook } from '../../domain/services/kyc.service.js'
import { env } from '../../lib/envConfig.js'
import { verifySignatureV2, verifySignatureSimple } from '../../infrastructure/webhooks/didit-signature.js'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const confirmHits = new Map<string, { count: number; resetAt: number }>()

function rateLimitConfirm(ip: string): boolean {
  const now = Date.now()
  const entry = confirmHits.get(ip)
  if (!entry || now > entry.resetAt) {
    confirmHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const router = Router()
const confirmRouter = Router()
const webhookRouter = Router()

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

confirmRouter.post('/confirm', async (req, res, next) => {
  try {
    const ip = (req.ip ?? req.socket.remoteAddress ?? 'unknown').replace('::ffff:', '')
    if (!rateLimitConfirm(ip)) {
      res.status(429).json({ error: 'Demasiadas solicitudes, intentá de nuevo en un minuto' })
      return
    }

    const { sessionId, email, status: sdkStatus } = req.body as { sessionId?: string; email?: string; status?: string }
    if (!sessionId || !email) {
      const err = new Error('sessionId y email son requeridos') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const result = await confirmKyc(email, sessionId, sdkStatus)
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

router.get('/decision/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params
    if (!sessionId) {
      const err = new Error('sessionId es requerido') as Error & { status?: number }
      err.status = 400
      throw err
    }

    const result = await getKycDecision(sessionId)
    res.json(result)
  } catch (e) {
    const err = e as Error & { status?: number }
    if (!err.status) err.status = 500
    next(err)
  }
})

webhookRouter.post('/webhook', async (req, res) => {
  const secret = env.DIDIT_WEBHOOK_SECRET
  if (!secret) {
    console.error('[KYC] DIDIT_WEBHOOK_SECRET no configurado')
    res.status(500).json({ error: 'Webhook not configured' })
    return
  }

  const signatureV2 = req.headers['x-signature-v2'] as string | undefined
  const signatureSimple = req.headers['x-signature-simple'] as string | undefined
  const timestamp = req.headers['x-timestamp'] as string | undefined

  if (!timestamp) {
    res.status(401).json({ error: 'Missing X-Timestamp header' })
    return
  }

  let verified = false
  if (signatureV2 && req.body && verifySignatureV2(req.body, signatureV2, timestamp, secret)) {
    verified = true
  } else if (signatureSimple && req.body && verifySignatureSimple(req.body, signatureSimple, timestamp, secret)) {
    verified = true
  }

  if (!verified) {
    console.warn('[KYC] Webhook signature inválida')
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  try {
    const result = await handleKycWebhook(req.body)
    res.status(200).json({ ok: true, processed: result.processed })
  } catch (e) {
    console.error('[KYC] Error procesando webhook:', e)
    res.status(200).json({ ok: true, processed: false })
  }
})

export default router
export { confirmRouter, webhookRouter }
