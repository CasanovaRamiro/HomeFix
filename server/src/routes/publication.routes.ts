import { Router } from 'express'
import { requireAuth, requireWorkerAuth } from '../middleware/auth.middleware.js'
import {
  listAvailableByCategory,
  listAllAvailable,
  getPublicationById,
} from '../services/publication.service.js'

const router = Router()

const setErrorStatus = (err: unknown, status: number) => {
  const error = err as Error & { status?: number }
  error.status = status
  return error
}

/** Trabajos disponibles para el trabajador, con filtro opcional por rubro (ej. ?category=Electricista) */
router.get('/available', requireWorkerAuth, async (req, res, next) => {
  try {
    const category = req.query.category
    const publications =
      typeof category === 'string' && category.trim()
        ? await listAvailableByCategory(category)
        : await listAllAvailable()
    res.json(publications)
  } catch (err) {
    next(setErrorStatus(err, 400))
  }
})

/** Detalle de un trabajo/publicación (panel lateral y ?id= en la URL) */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid publication id' })
    }
    const publication = await getPublicationById(id)
    res.json(publication)
  } catch (err) {
    const error = err as Error
    const status = error.message === 'Publication not found' ? 404 : 400
    next(setErrorStatus(err, status))
  }
})

export default router
