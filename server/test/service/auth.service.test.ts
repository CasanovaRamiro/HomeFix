import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '../../src/types/userRole.js'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
}))

import * as userData from '../../src/data/user.data.js'
import { loginUser, registerUser, syncAuth0User } from '../../src/services/auth.service.js'

const mockUser = {
  id: 'uuid-jane',
  name: 'Jane',
  email: 'jane@test.com',
  password:'password123',
  phone: null as string | null,
  bio: null as string | null,
  role: UserRole.Client,
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
      password: 'Password123!',
      phone: '123456',
    })

    expect(result.userId).toBe('uuid-jane')
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
        password: 'Password123!',
      })
    ).rejects.toMatchObject({ status: 409 })
  })
})

describe('auth.service - loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.com/'
    process.env.AUTH0_CLIENT_ID = 'client-id'
    process.env.AUTH0_DB_CONNECTION = 'Username-Password-Authentication'
    process.env.AUTH0_AUDIENCE = 'https://api.miapinode.com'
  })

  it('logs in and returns token data with user', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          id_token: 'id-token',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'auth0|1',
          email: 'jane@test.com',
          name: 'Jane',
        }),
      } as Response)

    const result = await loginUser({ email: 'jane@test.com', password: 'password123' })

    expect(result.accessToken).toBe('access-token')
    expect(result.user.id).toBe('uuid-jane')
    expect(result.user.role).toBe(UserRole.Client)
  })

  it('throws 401 when credentials are invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    } as Response)

    await expect(loginUser({ email: 'jane@test.com', password: 'bad-password' })).rejects.toMatchObject({
      status: 401,
    })
  })
})
