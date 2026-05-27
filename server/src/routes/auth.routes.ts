import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { registerUser, syncAuth0User } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const result = await registerUser(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.use(jwtCheck)

router.get('/me', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
    } | undefined
    const user = await syncAuth0User(claims ?? {})
    res.json(user)
  } catch (err) {
    const error = err as Error & { status?: number }
    error.status = 400
    next(error)
  }
})

export default router
