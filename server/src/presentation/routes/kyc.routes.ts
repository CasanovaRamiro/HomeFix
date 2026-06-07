import { Router } from 'express'
import crypto from 'crypto'
import { startKycVerification, confirmKyc, getKycStatus, handleKycWebhook } from '../../domain/services/kyc.service.js'
import { env } from '../../lib/envConfig.js'

const router = Router()
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

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        ;(acc as Record<string, unknown>)[key] = sortKeys((obj as Record<string, unknown>)[key])
        return acc
      }, {} as Record<string, unknown>)
  }
  return obj
}

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats)
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)]),
    )
  }
  if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data)
  }
  return data
}

function verifySignatureV2(
  body: Record<string, unknown>,
  signature: string,
  timestamp: string,
  secret: string,
): boolean {
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false

  const canonical = JSON.stringify(sortKeys(shortenFloats(body)))
  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function verifySignatureSimple(
  body: Record<string, unknown>,
  signature: string,
  timestamp: string,
  secret: string,
): boolean {
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false

  const canonical = [
    body.timestamp ?? '',
    body.session_id ?? '',
    body.status ?? '',
    body.webhook_type ?? '',
  ].join(':')
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

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
export { webhookRouter }
