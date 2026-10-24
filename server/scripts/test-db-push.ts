import { PrismaClient } from '@prisma/client'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolveTestDb, assertTestDbIdentity } from '../test/helpers/testDbSafety.js'

const approved = resolveTestDb(process.env)
process.env.DATABASE_URL = approved.url
const prisma = new PrismaClient({ datasources: { db: { url: approved.url } } })

try {
  await assertTestDbIdentity(prisma)
} finally {
  await prisma.$disconnect()
}

// The checked URL is passed explicitly to Prisma. Never use --accept-data-loss automatically.
const cli = fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url))
const result = spawnSync(process.execPath, [cli, 'db', 'push', '--skip-generate'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: approved.url },
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
