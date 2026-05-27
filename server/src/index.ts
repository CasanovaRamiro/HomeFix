import 'dotenv/config'
import { validateEnv } from './lib/env.js'
import { jwtCheck } from './middleware/auth0.middleware.js'

validateEnv()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import workerRoutes from './routes/worker.routes.js'
import { errorHandler } from './middleware/error.middleware.js'
import postRoutes from './routes/post.routes.js'
import aiRoutes from './routes/ai.routes.js'
import categoryRoutes from './routes/category.routes.js'
import postulacionRoutes from './routes/postulacion.routes.js'

export const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRoutes)

app.use('/users', jwtCheck, userRoutes)
app.use('/posts', jwtCheck, postRoutes)
app.use('/workers', jwtCheck, workerRoutes)
app.use('/ai', aiRoutes)
app.use('/categories', categoryRoutes)
app.use('/postulaciones', postulacionRoutes)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
