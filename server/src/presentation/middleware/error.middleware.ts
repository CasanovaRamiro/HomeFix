import { logger } from '../../lib/logger.js'
import type { ErrorRequestHandler } from 'express'

interface HttpError extends Error {
  status?: number
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  if (status === 500) {
    logger.error({ err, status, url: req.originalUrl, method: req.method }, 'Unhandled server error')
  } else {
    logger.warn({ err, status, url: req.originalUrl, method: req.method }, 'Request error')
  }
  res.status(status).json({ error: message })
}
