import { logger } from '../../lib/logger.js'
import type { HttpError } from '../../lib/errors.js'
import type { ErrorRequestHandler } from 'express'

const GENERIC_MESSAGE = 'Ocurrió un error interno. Intentá nuevamente en unos minutos.'

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  const status = err.status ?? 500
  // A 4xx status signals a condition the client caused and can act on
  // ("not found", "duplicate email", "bad request") — safe to show verbatim.
  // Any 5xx (missing config, an upstream provider failing, an unexpected
  // exception with no status at all) is a server-side problem the client
  // can't do anything about, so we never leak its details.
  const isClientError = status >= 400 && status < 500
  const message = isClientError ? err.message : GENERIC_MESSAGE
  if (status === 500) {
    logger.error({ err, status, url: req.originalUrl, method: req.method }, 'Unhandled server error')
  } else {
    logger.warn({ err, status, url: req.originalUrl, method: req.method }, 'Request error')
  }
  res.status(status).json({ error: message })
}
