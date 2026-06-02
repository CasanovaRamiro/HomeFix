import { Router } from 'express'
import { requireSession } from '../middleware/session.middleware.js'
import { getMyApplications, applyToPost, cancelApplication } from '../services/application.service.js'

const router = Router()

router.get('/my-applications', requireSession, async (req, res, next) => {
  try {
    const workerId = req.user!.id
    const result = await getMyApplications(workerId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireSession, async (req, res, next) => {
  try {
    const workerId = req.user!.id
    const result = await cancelApplication(workerId, req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireSession, async (req, res, next) => {
  try {
    const workerId = req.user!.id
    const { postId } = req.body
    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId is required' })
      return
    }
    const result = await applyToPost(workerId, postId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
