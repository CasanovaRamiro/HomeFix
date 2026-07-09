import { logger } from './lib/logger.js'

// Registered first so any async failure during startup is always captured.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason instanceof Error ? reason : new Error(String(reason)) }, 'Unhandled rejection')
})

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './lib/envConfig.js'
import { assertMigrationsApplied } from './lib/assertMigrations.js'
import { swaggerUiHandlers } from './presentation/swagger/swaggerUi.config.js'
import { registerRoutes } from './presentation/routes/index.js'
import { errorHandler } from './presentation/middleware/error.middleware.js'
import { launchBot } from './infrastructure/providers/telegram.provider.js'
import { registerTelegramHandlers } from './presentation/bot.js'

export const app = express()
const PORT = env.PORT

app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json({
  verify: (req, _res, buf) => {
    if (buf && buf.length) {
      Object.assign(req, { rawBody: buf.toString('utf8') })
    }
  },
}))
app.use(morgan('dev'))

app.use('/api-docs', ...swaggerUiHandlers)

registerRoutes(app)
app.use(errorHandler)

if (env.NODE_ENV !== 'test') {
  await assertMigrationsApplied()
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `Server running on port ${PORT}`)
    if (env.TELEGRAM_BOT_TOKEN) launchBot(registerTelegramHandlers)
  })
}
