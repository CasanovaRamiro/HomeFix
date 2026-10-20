import { Router } from 'express'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import { getWorkerDashboard } from '../../domain/services/workerDashboard.service.js'
import { UserRole } from '../../domain/types/userRole.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      role?: string
    } | undefined
    const user = await syncAuth0User(claims)
    if (user.role !== UserRole.Worker) {
      res.status(403).json({ error: 'Worker access required' })
      return
    }
    const dashboard = await getWorkerDashboard(user.id)
    res.json(dashboard)
  } catch (err) {
    next(err)
  }
})

export default router
