import type { ErrorRequestHandler } from 'express'

interface HttpError extends Error {
  status?: number
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  if (status === 500) console.error(err)
  res.status(status).json({ error: message })
}
