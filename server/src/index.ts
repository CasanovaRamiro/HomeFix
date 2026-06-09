import { env } from './lib/envConfig.js'
import { assertMigrationsApplied } from './lib/assertMigrations.js'
import { jwtCheck } from './presentation/middleware/auth0.middleware.js'

import http from 'http'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './presentation/routes/auth.routes.js'
import userRoutes from './presentation/routes/user.routes.js'
import workerRoutes from './presentation/routes/worker.routes.js'
import { errorHandler } from './presentation/middleware/error.middleware.js'
import postRoutes from './presentation/routes/post.routes.js'
import aiRoutes from './presentation/routes/ai.routes.js'
import categoryRoutes from './presentation/routes/category.routes.js'
import applicationRoutes from './presentation/routes/application.routes.js'
import workerDashboardRoutes from './presentation/routes/workerDashboard.routes.js'
import reviewRoutes from './presentation/routes/review.routes.js'
import conversationRoutes from './presentation/routes/conversation.routes.js'
import { initSocket } from './presentation/socket/index.js'

export const app = express()
const PORT = env.PORT

app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRoutes)

app.use('/users', jwtCheck, userRoutes)
app.use('/posts', jwtCheck, postRoutes)
app.use('/workers', jwtCheck, workerRoutes)
app.use('/ai', aiRoutes)
app.use('/categories', categoryRoutes)
app.use('/applications', applicationRoutes)
app.use('/worker-dashboard', jwtCheck, workerDashboardRoutes)
app.use('/reviews', jwtCheck, reviewRoutes)
app.use('/conversations', jwtCheck, conversationRoutes)
app.use(errorHandler)

if (env.NODE_ENV !== 'test') {
  await assertMigrationsApplied()
  const server = http.createServer(app)
  initSocket(server)
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
