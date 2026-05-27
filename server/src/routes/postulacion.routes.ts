import { Router } from 'express'
import { requireSession } from '../middleware/session.middleware.js'
import { getMisPostulaciones, aplicarPostulacion } from '../services/postulacion.service.js'

const router = Router()

router.get('/mis-postulaciones', requireSession, async (req, res, next) => {
  try {
    const trabajadorId = req.user!.id
    const result = await getMisPostulaciones(trabajadorId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireSession, async (req, res, next) => {
  try {
    const trabajadorId = req.user!.id
    const { postId } = req.body
    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId es requerido' })
      return
    }
    const result = await aplicarPostulacion(trabajadorId, postId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
