import { readdirSync } from 'fs'
import path from 'path'
import { logger } from './logger.js'
import prisma from './prisma.js'

export async function assertMigrationsApplied() {
  const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations')

  let migrationFolders: string[]
  try {
    migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  } catch {
    return // no migrations directory, nothing to check
  }

  if (migrationFolders.length === 0) return

  let applied: { migration_name: string }[]
  try {
    applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    `
  } catch {
    logger.fatal({ action: 'startup' }, 'Could not query _prisma_migrations — is the database reachable?')
    process.exit(1)
  }

  const appliedNames = new Set(applied.map((r) => r.migration_name))
  const pending = migrationFolders.filter((name) => !appliedNames.has(name))

  if (pending.length > 0) {
    logger.fatal({ pending, action: 'startup' }, 'Database schema is out of date. Pending migrations.')
    pending.forEach((m) => logger.error({ migration: m, action: 'startup' }, `  • ${m}`))
    logger.fatal({ action: 'startup' }, 'Run: pnpm prisma migrate dev')
    process.exit(1)
  }
}
