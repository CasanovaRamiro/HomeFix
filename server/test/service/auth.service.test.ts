import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '../../src/domain/types/userRole.js'

vi.mock('../../src/infrastructure/database/user.database.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn<(args: { name: string; email: string; password: string; nationalId?: string; phone?: string; surname?: string }) => Promise<{ id: string; name: string; email: string; phone: string | null; role: string }>>(),
  updateUserByEmail: vi.fn(),
  addUserCategories: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/category.database.js', () => ({
  upsertCategoryByName: vi.fn(),
  listCategories: vi.fn(),
}))

import * as userData from '../../src/infrastructure/database/user.database.js'
import { loginUser, registerUser, syncAuth0User, forgotPassword, type RegisterInput } from '../../src/domain/services/auth.service.js'

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

  it('creates a user when email does not exist and isRegistration is true', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)

    const result = await syncAuth0User({
      sub: 'auth0|abc123',
      email: 'jane@test.com',
      name: 'Jane',
    }, true)

    expect(result.email).toBe('jane@test.com')
  })

  it('throws 404 when email does not exist and isRegistration is false', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)

    await expect(
      syncAuth0User({ sub: 'auth0|abc123', email: 'jane@test.com', name: 'Jane' })
    ).rejects.toMatchObject({ status: 404 })
  })

  it('creates user with role client when isRegistration is true', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue({ ...mockUser, role: UserRole.Client })

    await syncAuth0User({ sub: 'auth0|abc123', email: 'jane@test.com', name: 'Jane' }, true)

    expect(userData.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Client })
    )
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
      json: async () => ({ _id: 'auth0|123', email: 'jane@test.com', email_verified: false }),
    } as Response)

    const result = await registerUser({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'Password123!',
      phone: '123456',
    })

    expect(result.email).toBe('jane@test.com')
    expect(userData.createUser).toHaveBeenCalled()
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

describe('auth.service - forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.com/'
    process.env.AUTH0_CLIENT_ID = 'client-id'
    process.env.AUTH0_DB_CONNECTION = 'Username-Password-Authentication'
  })

  it('returns success message when Auth0 responds ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    } as Response)

    const result = await forgotPassword('jane@test.com')
    expect(result.message).toContain('Si el correo está registrado')
  })

  it('throws 400 when email is missing', async () => {
    await expect(forgotPassword(undefined)).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 when email is empty string', async () => {
    await expect(forgotPassword('   ')).rejects.toMatchObject({ status: 400 })
  })

  it('throws 502 when Auth0 call fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(forgotPassword('jane@test.com')).rejects.toMatchObject({ status: 502 })
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