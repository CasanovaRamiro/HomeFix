import { Router } from 'express'
import { listUsers } from '../../domain/services/user.service.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const users = await listUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
})

export default router
