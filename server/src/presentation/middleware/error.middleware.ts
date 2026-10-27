import { logger } from '../../lib/logger.js'
import type { ErrorRequestHandler } from 'express'
import multer from 'multer'

interface HttpError extends Error {
  status?: number
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Archivo muy grande. Subí algo menos de 100 MB.' })
    }
    return res.status(400).json({ error: 'Error al subir el archivo.' })
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
