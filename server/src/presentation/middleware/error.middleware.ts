import { logger } from '../../lib/logger.js'
import type { HttpError } from '../../lib/errors.js'
import type { ErrorRequestHandler } from 'express'

const GENERIC_MESSAGE = 'Ocurrió un error interno. Intentá nuevamente en unos minutos.'

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  const hasExplicitStatus = typeof err.status === 'number'
  const status = err.status ?? 500
  // A deliberate 4xx status (set anywhere in the app code) signals an
  // expected, safe-to-show condition (e.g. "not found", "duplicate email").
  // A bare 500 with no explicit status means the error was never meant to
  // reach the client (DB errors, bugs, etc), so we replace its message with
  // a generic one instead of leaking internal details.
  const message = hasExplicitStatus ? err.message : GENERIC_MESSAGE
  if (status === 500) {
    logger.error({ err, status, url: req.originalUrl, method: req.method }, 'Unhandled server error')
  } else {
    logger.warn({ err, status, url: req.originalUrl, method: req.method }, 'Request error')
  }
  res.status(status).json({ error: message })
}
