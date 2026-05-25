import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
}))

import * as userData from '../../src/data/user.data.js'
import { registerUser, syncAuth0User } from '../../src/services/auth.service.js'

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

describe('auth.service - registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.com/'
    process.env.AUTH0_CLIENT_ID = 'client-id'
    process.env.AUTH0_DB_CONNECTION = 'Username-Password-Authentication'
  })

  it('creates a user in auth0 and db', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'auth0|1', email: 'jane@test.com', email_verified: false }),
    } as Response)

    const result = await registerUser({
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      password: 'password123',
      phone: '123456',
    })

    expect(result.userId).toBe(1)
    expect(result.email).toBe('jane@test.com')
    expect(result.emailVerified).toBe(false)
    expect(userData.createUser).toHaveBeenCalled()
  })

  it('throws conflict if email exists', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue({ ...mockUser, password: 'hashed' })

    await expect(
      registerUser({
        name: 'Jane',
        email: 'jane@test.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({ status: 409 })
  })
})
