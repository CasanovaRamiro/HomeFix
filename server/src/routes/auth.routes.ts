import { Router } from 'express'
import { register, login } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const result = await register(req.body)
    res.status(201).json(result)
  } catch (err) {
    const error = err as Error & { status?: number }
    error.status = 400
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await login(req.body)
    res.json(result)
  } catch (err) {
    const error = err as Error & { status?: number }
    error.status = 401
    next(error)
  }
})

export default router
