import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { assertTestDbIdentity, resolveTestDb, verifyIdentity } from '../helpers/testDbSafety.js'

const url = 'mysql://hf_test_runner:placeholder@127.0.0.1:3306/ofix_hf_tests'
const serverUuid = '123e4567-e89b-42d3-a456-426614174000'
const config = {
  HF_TEST_DB_URL: url,
  HF_TEST_DB_TARGET: '127.0.0.1:3306',
  HF_TEST_DB_SERVER_UUID: serverUuid,
  HF_TEST_DB_PRINCIPAL: 'hf_test_runner@localhost',
  HF_TEST_DB_CONFIRM: 'I_AUTHORIZE_DISPOSABLE_HF_TESTS',
}
const identity = { databaseName: 'ofix_hf_tests', principal: 'hf_test_runner@localhost', serverUuid, serverPort: 3306 }
const grants = [
  "GRANT USAGE ON *.* TO 'hf_test_runner'@'localhost'",
  "GRANT ALL PRIVILEGES ON `ofix_hf_tests`.* TO 'hf_test_runner'@'localhost'",
]

afterEach(() => vi.unstubAllEnvs())

describe('test database fail-closed authorization (no MySQL)', () => {
  it('requires explicit authorization, pinned endpoint, account and server identity', () => {
    expect(() => resolveTestDb({})).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_CONFIRM: '' })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_SERVER_UUID: undefined })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_TARGET: '127.0.0.1:3307' })).toThrow()
    expect(resolveTestDb(config)).toMatchObject({ url, port: 3306, serverUuid })
  })

  it('rejects inherited URLs, .env-style development accounts, remote targets and different schemas', () => {
    expect(() => resolveTestDb({ ...config, DATABASE_URL: 'mysql://other:secret@127.0.0.1:3306/ofix_db' })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_URL: 'mysql://ofix:secret@127.0.0.1:3306/ofix_hf_tests' })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_URL: 'mysql://hf_test_runner:secret@remote.example:3306/ofix_hf_tests' })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_URL: 'mysql://hf_test_runner:secret@127.0.0.1:3306/ofix_test' })).toThrow()
    expect(() => resolveTestDb({ ...config, HF_TEST_DB_PRINCIPAL: 'hf_test_runner@%' })).toThrow()
    expect(resolveTestDb({ ...config, CI: 'true', HF_TEST_DB_PRINCIPAL: 'hf_test_runner@%' }).principal).toBe('hf_test_runner@%')
  })

  it('refuses unexpected actual server UUID, account, database or server port', () => {
    const approved = resolveTestDb(config)
    verifyIdentity(approved, identity, grants)
    for (const mismatch of [
      { serverUuid: '123e4567-e89b-42d3-a456-426614174001' },
      { databaseName: 'ofix_db' },
      { principal: 'root@localhost' },
      { serverPort: 3307 },
    ]) {
      expect(() => verifyIdentity(approved, { ...identity, ...mismatch }, grants)).toThrow()
    }
  })

  it('refuses global grants, other database privileges, delegated grants and roles', () => {
    const approved = resolveTestDb(config)
    for (const extra of [
      "GRANT SELECT ON *.* TO 'hf_test_runner'@'localhost'",
      "GRANT ALL PRIVILEGES ON `ofix_db`.* TO 'hf_test_runner'@'localhost'",
      "GRANT ALL PRIVILEGES ON `ofix_hf_tests`.* TO 'hf_test_runner'@'localhost' WITH GRANT OPTION",
      "GRANT 'developer'@'%' TO 'hf_test_runner'@'localhost'",
    ]) {
      expect(() => verifyIdentity(approved, identity, [...grants, extra])).toThrow()
    }
  })

  it('performs no mutating query if the runtime URL or database identity is wrong', async () => {
    const query = vi.fn().mockResolvedValue([identity])
    const client = { $queryRawUnsafe: query, post: { deleteMany: vi.fn() } } as unknown as PrismaClient
    await expect(assertTestDbIdentity(client, { ...config, DATABASE_URL: 'mysql://other:secret@127.0.0.1:3306/ofix_db' })).rejects.toThrow()
    expect(query).not.toHaveBeenCalled()

    // Runtime URL is a separate check from the authorized configuration.
    if (process.env.DATABASE_URL !== url) {
      await expect(assertTestDbIdentity(client, config)).rejects.toThrow()
      expect(query).not.toHaveBeenCalled()
    }
  })

  it('allows only read-only identity and grant queries before authorizing writes', async () => {
    vi.stubEnv('DATABASE_URL', url)
    const query = vi.fn()
      .mockResolvedValueOnce([identity])
      .mockResolvedValueOnce(grants.map((grant) => ({ grant })))
    const deleteMany = vi.fn()
    const client = { $queryRawUnsafe: query, post: { deleteMany } } as unknown as PrismaClient

    await expect(assertTestDbIdentity(client, { ...config, DATABASE_URL: url })).resolves.toMatchObject({ serverUuid })
    expect((query.mock.calls as [string][]).map(([sql]) => sql)).toEqual([
      expect.stringContaining('SELECT DATABASE()'),
      'SHOW GRANTS FOR CURRENT_USER()',
    ])
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('blocks on connection failure or missing grants without attempting any write', async () => {
    vi.stubEnv('DATABASE_URL', url)
    const query = vi.fn().mockRejectedValueOnce(new Error('connection failed'))
    const deleteMany = vi.fn()
    const client = { $queryRawUnsafe: query, post: { deleteMany } } as unknown as PrismaClient
    await expect(assertTestDbIdentity(client, { ...config, DATABASE_URL: url })).rejects.toThrow('connection failed')
    expect(query).toHaveBeenCalledTimes(1)
    expect(deleteMany).not.toHaveBeenCalled()

    query.mockResolvedValueOnce([identity]).mockResolvedValueOnce([
      { grant: "GRANT SELECT ON *.* TO 'hf_test_runner'@'localhost'" },
    ])
    await expect(assertTestDbIdentity(client, { ...config, DATABASE_URL: url })).rejects.toThrow()
    expect(deleteMany).not.toHaveBeenCalled()
  })
})
