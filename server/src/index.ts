import 'dotenv/config'
import { validateEnv } from './lib/env.js'
validateEnv()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

export const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRoutes)
app.use('/users', userRoutes)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
