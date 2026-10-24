import { beforeEach, describe, expect, it, vi } from 'vitest'

const { preflight, transaction, executeRaw, deleteMany } = vi.hoisted(() => ({
  preflight: vi.fn(),
  transaction: vi.fn(),
  executeRaw: vi.fn(),
  deleteMany: vi.fn(),
}))

vi.mock('../helpers/testDbSafety.js', () => ({ assertTestDbIdentity: preflight }))
vi.mock('../../src/lib/prisma.js', () => ({
  default: { $transaction: transaction },
}))

import { cleanDb } from '../helpers/db.js'

describe('cleanDb fail-closed behavior (mocked Prisma)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not begin a transaction when authorization fails', async () => {
    preflight.mockRejectedValue(new Error('not authorized'))
    await expect(cleanDb()).rejects.toThrow('not authorized')
    expect(transaction).not.toHaveBeenCalled()
  })

  it('does not disable foreign keys or delete data when the transaction connection differs', async () => {
    preflight.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('wrong server'))
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) => callback({
      $executeRaw: executeRaw,
      post: { deleteMany },
    }))

    await expect(cleanDb()).rejects.toThrow('wrong server')
    expect(preflight).toHaveBeenCalledTimes(2)
    expect(executeRaw).not.toHaveBeenCalled()
    expect(deleteMany).not.toHaveBeenCalled()
  })
})
