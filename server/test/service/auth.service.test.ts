import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
}))

import * as userData from '../../src/data/user.data.js'
import { syncAuth0User } from '../../src/services/auth.service.js'

const mockUser = {
  id: 'uuid-jane',
  name: 'Jane',
  email: 'jane@test.com',
  phone: null as string | null,
  bio: null as string | null,
  role: 'user',
  createdAt: new Date(),
}

describe('auth.service - syncAuth0User', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns existing user when email already exists', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue({ ...mockUser, password: 'hashed' })

    const result = await syncAuth0User({
      sub: 'auth0|abc123',
      email: 'jane@test.com',
      name: 'Jane',
    })

    expect(result.email).toBe('jane@test.com')
    expect(result).not.toHaveProperty('password')
    expect(userData.createUser).not.toHaveBeenCalled()
  })

  it('creates a user when email does not exist', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)

    const result = await syncAuth0User({
      sub: 'auth0|abc123',
      email: 'jane@test.com',
      name: 'Jane',
    })

    expect(result.email).toBe('jane@test.com')
  })

  it('throws when sub claim is missing', async () => {
    await expect(syncAuth0User({ email: 'jane@test.com' })).rejects.toThrow(
      'Invalid Auth0 token: missing sub claim'
    )
  })
})
