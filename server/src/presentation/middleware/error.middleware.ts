import { logger } from '../../lib/logger.js'
import type { ErrorRequestHandler } from 'express'

interface HttpError extends Error {
  status?: number
  code?: string
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    logger.warn({ err, status: 413, url: req.originalUrl, method: req.method }, 'File size limit exceeded')
    res.status(413).json({ error: 'El archivo supera el tamaño máximo permitido de 100 MB' })
    return
  }
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  if (status === 500) {
    logger.error({ err, status, url: req.originalUrl, method: req.method }, 'Unhandled server error')
  } else {
    logger.warn({ err, status, url: req.originalUrl, method: req.method }, 'Request error')
  }
  res.status(status).json({ error: message })
}
