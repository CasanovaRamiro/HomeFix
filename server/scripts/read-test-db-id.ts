import { PrismaClient } from '@prisma/client'

// Read-only CI bootstrap: the ID is later pinned and independently checked before any writes.
const url = process.env.HF_TEST_DB_URL
if (!url) throw new Error('HF_TEST_DB_URL is required')
const parsed = new URL(url)
if (parsed.protocol !== 'mysql:' || parsed.hostname !== '127.0.0.1' || !parsed.port ||
    parsed.username !== 'hf_test_runner' || parsed.pathname !== '/ofix_hf_tests') {
  throw new Error('CI test database destination is not the dedicated loopback account')
}
const prisma = new PrismaClient({ datasources: { db: { url } } })
try {
  const rows = await prisma.$queryRawUnsafe<Array<{ uuid: string }>>('SELECT @@server_uuid AS uuid')
  if (rows.length !== 1) throw new Error('Cannot identify CI test database')
  console.log(rows[0].uuid)
} finally {
  await prisma.$disconnect()
}
