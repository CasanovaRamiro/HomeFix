import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { loginUser, registerUser, registerWorker, syncAuth0User, createHttpError } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim()) throw createHttpError(400, 'El nombre es obligatorio')
    if (!email?.trim()) throw createHttpError(400, 'El correo electrónico es obligatorio')
    if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

    const result = await registerUser(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/register/worker', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim()) throw createHttpError(400, 'El nombre es obligatorio')
    if (!email?.trim()) throw createHttpError(400, 'El correo electrónico es obligatorio')
    if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

    const result = await registerWorker(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body)
    res.status(200).json(result)
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
