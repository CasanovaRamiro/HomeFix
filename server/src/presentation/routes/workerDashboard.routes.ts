import { Router } from 'express'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import { getWorkerDashboard } from '../../domain/services/workerDashboard.service.js'

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
    const dashboard = await getWorkerDashboard(user.id)
    res.json(dashboard)
  } catch (err) {
    next(err)
  }
})

export default router
