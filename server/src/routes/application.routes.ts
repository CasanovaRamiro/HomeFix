import { Router } from 'express'
import { requireSession } from '../middleware/session.middleware.js'
import { getMyApplications, applyToPost, acceptApplication, rejectApplication } from '../services/application.service.js'

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

router.patch('/:applicationId/accept', requireSession, async (req, res, next) => {
  try {
    const clientId = req.user!.id
    const applicationId = req.params.applicationId as string
    const result = await acceptApplication(clientId, applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:applicationId/reject', requireSession, async (req, res, next) => {
  try {
    const clientId = req.user!.id
    const applicationId = req.params.applicationId as string
    const result = await rejectApplication(clientId, applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
