import type { PrismaClient } from '@prisma/client'

const DATABASE = 'ofix_hf_tests'
const USER = 'hf_test_runner'
const CONFIRMATION = 'I_AUTHORIZE_DISPOSABLE_HF_TESTS'

export interface ApprovedTestDb {
  url: string
  target: string
  serverUuid: string
  principal: string
  port: number
}

function refuse(reason: string): never {
  throw new Error(`Test database refused: ${reason}`)
}

// This is deliberately independent of dotenv and never uses DATABASE_URL as an authorization source.
export function resolveTestDb(env: NodeJS.ProcessEnv): ApprovedTestDb {
  if (env.HF_TEST_DB_CONFIRM !== CONFIRMATION) refuse('explicit disposable-database confirmation is missing')
  const url = env.HF_TEST_DB_URL
  const target = env.HF_TEST_DB_TARGET
  const serverUuid = env.HF_TEST_DB_SERVER_UUID
  const principal = env.HF_TEST_DB_PRINCIPAL
  if (typeof url !== 'string' || url.length === 0 || typeof target !== 'string' || target.length === 0 ||
      typeof serverUuid !== 'string' || serverUuid.length === 0 || typeof principal !== 'string' || principal.length === 0) {
    refuse('URL, target, server UUID and principal must all be explicit')
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serverUuid)) refuse('invalid server UUID')

  let parsed: URL
  try { parsed = new URL(url) } catch { return refuse('invalid URL') }
  if (parsed.protocol !== 'mysql:' || parsed.hostname !== '127.0.0.1' || !parsed.port ||
      !parsed.username || !parsed.password || parsed.pathname !== `/${DATABASE}` ||
      parsed.search || parsed.hash) refuse('URL must use the dedicated account and database on an explicit loopback TCP port')
  let username: string
  try { username = decodeURIComponent(parsed.username) } catch { return refuse('invalid URL account') }
  if (username !== USER || parsed.host !== target || !/^127\.0\.0\.1:[0-9]+$/.test(target)) {
    refuse('URL does not match the dedicated account and authorized destination')
  }
  if (principal !== `${USER}@localhost` && principal !== `${USER}@127.0.0.1` &&
      !(env.CI === 'true' && principal === `${USER}@%`)) {
    refuse('expected account must be restricted to the local host')
  }
  if (typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.length > 0 && env.DATABASE_URL !== url) {
    refuse('inherited DATABASE_URL differs from explicitly authorized URL')
  }
  return { url, target, serverUuid: serverUuid.toLowerCase(), principal, port: Number(parsed.port) }
}

export function verifyIdentity(
  approved: ApprovedTestDb,
  identity: { databaseName: string | null; principal: string; serverUuid: string; serverPort: number | bigint },
  grants: string[],
): void {
  if (identity.databaseName !== DATABASE || identity.principal !== approved.principal ||
      identity.serverUuid.toLowerCase() !== approved.serverUuid || Number(identity.serverPort) !== approved.port) {
    refuse('connected database, account, server UUID or port does not match authorization')
  }
  if (grants.length === 0) refuse('no grants returned for the current user')

  let schemaGrant = false
  for (const grant of grants) {
    if (/\bWITH GRANT OPTION\b/i.test(grant)) refuse('account can delegate permissions')
    const match = /^GRANT (.+?) ON (.+?) TO /i.exec(grant)
    if (!match) refuse('role, proxy or unrecognized grant is not permitted')
    const privileges = match[1].toUpperCase()
    const scope = match[2].replace(/`/g, '')
    if (scope === '*.*' && privileges === 'USAGE') continue
    if (scope !== `${DATABASE}.*`) refuse('account has access outside the dedicated database')
    if (privileges === 'ALL PRIVILEGES' ||
        ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'].every((name) => privileges.split(/,\s*/).includes(name))) {
      schemaGrant = true
    }
  }
  if (!schemaGrant) refuse('dedicated database privileges are insufficient')
}

// Read-only preflight. No mutating query is permitted before it succeeds.
export async function assertTestDbIdentity(client: Pick<PrismaClient, '$queryRawUnsafe'>, env: NodeJS.ProcessEnv = process.env): Promise<ApprovedTestDb> {
  const approved = resolveTestDb(env)
  if (process.env.DATABASE_URL !== approved.url) refuse('Prisma runtime URL differs from authorized URL')
  const rows = await client.$queryRawUnsafe<Array<{
    databaseName: string | null; principal: string; serverUuid: string; serverPort: number | bigint
  }>>('SELECT DATABASE() AS databaseName, CURRENT_USER() AS principal, @@server_uuid AS serverUuid, @@port AS serverPort')
  if (rows.length !== 1) refuse('database identity could not be determined')
  const grants = await client.$queryRawUnsafe<Array<Record<string, string>>>('SHOW GRANTS FOR CURRENT_USER()')
  verifyIdentity(approved, rows[0], grants.flatMap((row) => Object.values(row)))
  return approved
}
