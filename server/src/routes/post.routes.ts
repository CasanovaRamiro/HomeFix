import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireSession } from '../middleware/session.middleware.js'
import { post, getActivePosts, getPostById } from '../services/post.service.js'

const router = Router()

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const result = await post(req.body);
    res.status(201).json(result);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

router.get('/', requireSession, async (_req, res, next) => {
  try {
    const result = await getActivePosts()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireSession, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return }
    const result = await getPostById(id)
    if (!result) { res.status(404).json({ error: 'Publicación no encontrada' }); return }
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router