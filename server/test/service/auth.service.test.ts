import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '../../src/types/userRole.js'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  findByAuth0Id: vi.fn(),
  createUser: vi.fn<(args: { name: string; email: string; password: string; nationalId?: string; phone?: string; surname?: string; auth0Id?: string }) => Promise<{ id: string; name: string; email: string; phone: string | null; role: string }>>(),
  updateAuth0Id: vi.fn(),
}))

import * as userData from '../../src/data/user.data.js'
import { loginUser, registerUser, syncAuth0User, type RegisterInput } from '../../src/services/auth.service.js'

const mockUser = {
  id: 'uuid-jane',
  name: 'Jane',
  email: 'jane@test.com',
  password: 'hashed',
  phone: null as string | null,
  bio: null as string | null,
  surname: 'Test',
  role: 'client',
  createdAt: new Date(),
  active: true,
  deleted: false,
  nationalId: '12345678',
  nationalIdTypeId: 'uuid-dni',
  addressId: 'uuid-addr',
  auth0Id: 'auth0|abc123',
}

describe('auth.service - syncAuth0User', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns existing user when email already exists', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)

    const result = await syncAuth0User({
      sub: 'auth0|abc123',
      email: 'jane@test.com',
      name: 'Jane',
    })

    expect(result.email).toBe('jane@test.com')
    expect(result).not.toHaveProperty('password')
    expect(userData.createUser).not.toHaveBeenCalled()
  })

  it('throws 401 when user does not exist', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.findByAuth0Id).mockResolvedValue(null)

    await expect(syncAuth0User({
      sub: 'auth0|abc123',
      email: 'jane@test.com',
      name: 'Jane',
    })).rejects.toMatchObject({ status: 401 })
  })

  it('returns user by auth0Id when email is missing', async () => {
    vi.mocked(userData.findByAuth0Id).mockResolvedValue(mockUser)

    const result = await syncAuth0User({
      sub: 'auth0|abc123',
      name: 'Jane',
    })

    expect(result.email).toBe('jane@test.com')
    expect(result).not.toHaveProperty('password')
  })
})

describe('auth.service - registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a user via Auth0', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    process.env.AUTH0_CLIENT_ID = 'client-id'
    process.env.AUTH0_DB_CONNECTION = 'Username-Password-Authentication'
    process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.com/'
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: 'usr_abc123', email: 'jane@test.com', email_verified: false }),
    } as Response)

    const result = await registerUser({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'Password123!',
      phone: '123456',
    })

    expect(result.email).toBe('jane@test.com')
    expect(userData.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ auth0Id: 'auth0|usr_abc123' })
    )
  })

  it('throws conflict if email exists', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)

    await expect(
      registerUser({
        name: 'Jane',
        email: 'jane@test.com',
        password: 'Password123!',
      })
    ).rejects.toThrow('El correo electrónico ya está registrado')
  })

  it('throws if required fields are missing', async () => {
    await expect(registerUser({} as RegisterInput)).rejects.toThrow('El nombre es obligatorio')
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
    vi.mocked(userData.updateAuth0Id).mockResolvedValue({ ...mockUser, auth0Id: 'auth0|1' })
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
    expect(userData.updateAuth0Id).toHaveBeenCalledWith('uuid-jane', 'auth0|1')
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