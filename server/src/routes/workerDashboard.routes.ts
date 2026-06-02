import { Router } from 'express'
import { requireSession } from '../middleware/session.middleware.js'
import { getWorkerDashboard } from '../services/workerDashboard.service.js'

const router = Router()

router.get('/', requireSession, async (req, res, next) => {
  try {
    const workerId = req.user!.id
    const dashboard = await getWorkerDashboard(workerId)
    res.json(dashboard)
  } catch (err) {
    next(err)
  }
})

export default router
