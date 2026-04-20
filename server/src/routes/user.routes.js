import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { listUsers } from '../services/user.service.js'

const router = Router()

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const users = await listUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
})

export default router
