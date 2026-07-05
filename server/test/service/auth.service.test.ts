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

vi.mock('../../src/infrastructure/providers/auth0.provider.js', () => ({
  createAuth0User: vi.fn(),
  loginWithAuth0: vi.fn(),
  getAuth0UserInfo: vi.fn(),
  assignAuth0Role: vi.fn(),
  sendAuth0PasswordReset: vi.fn(),
  getAuth0UserByEmail: vi.fn(),
  sendAuth0VerificationEmail: vi.fn(),
}))

import * as userData from '../../src/infrastructure/database/user.database.js'
import * as categoryData from '../../src/infrastructure/database/category.database.js'
import * as auth0Provider from '../../src/infrastructure/providers/auth0.provider.js'
import { loginUser, registerUser, registerWorker, syncAuth0User, forgotPassword, resendVerificationEmail, type RegisterInput } from '../../src/domain/services/auth.service.js'

const mockUser = {
  id: 'uuid-jane',
  name: 'Jane',
  email: 'jane@test.com',
  password: 'hashed',
  phone: null as string | null,
  bio: null as string | null,
  surname: 'Test',
  role: UserRole.Client,
  createdAt: new Date(),
  active: true,
  deleted: false,
  emergenciesEnabled: false,
  requiresStartToken: false,
  photo: null as string | null,
  availability: null as string | null,
  telegramChatId: null as string | null,
  telegramLinkedAt: null as Date | null,
  nationalId: '12345678',
  nationalIdTypeId: 'uuid-dni',
  addressId: 'uuid-addr',
  certificates: null as string | null,
  gallery: null as string | null,
  kycStatus: 'NOT_STARTED',
  kycVerifiedAt: null,
  diditVerificationId: null,
}

const mockAuth0User = {
  auth0Id: 'auth0|123',
  email: 'jane@test.com',
  emailVerified: false,
}

beforeEach(() => vi.clearAllMocks())

describe('auth.service - syncAuth0User', () => {
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

  it('throws 401 when claims has no sub', async () => {
    await expect(
      syncAuth0User({ email: 'jane@test.com' })
    ).rejects.toMatchObject({ status: 401 })
  })

  it('throws 401 when claims is undefined', async () => {
    await expect(syncAuth0User(undefined)).rejects.toMatchObject({ status: 401 })
  })

  it('migrates ghost user when real email arrives and ghost exists', async () => {
    const ghostUser = { ...mockUser, email: 'auth0|abc123@auth0.local', name: 'auth0|abc123' }
    vi.mocked(userData.findByEmail)
      .mockResolvedValueOnce(null)  // check for real email — not found
      .mockResolvedValueOnce(ghostUser) // check for ghost email — found
      .mockResolvedValueOnce(null)  // check again for real email (after migration) — not found → 404 path
    vi.mocked(userData.updateUserByEmail).mockResolvedValue(mockUser)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)

    await syncAuth0User({ sub: 'auth0|abc123', email: 'jane@test.com', name: 'Jane' }, true)

    expect(userData.updateUserByEmail).toHaveBeenCalledWith(
      'auth0|abc123@auth0.local',
      expect.objectContaining({ email: 'jane@test.com' })
    )
  })

  it('updates role when existing user has role "user"', async () => {
    const userWithRole = { ...mockUser, role: 'user' }
    vi.mocked(userData.findByEmail).mockResolvedValue(userWithRole)
    vi.mocked(userData.updateUserByEmail).mockResolvedValue({ ...userWithRole, role: 'worker' })

    await syncAuth0User({ sub: 'auth0|abc123', email: 'jane@test.com', role: 'worker' })

    expect(userData.updateUserByEmail).toHaveBeenCalledWith(
      'jane@test.com',
      expect.objectContaining({ role: 'worker' })
    )
  })

  it('updates name when existing user name equals the sub claim', async () => {
    const userWithSubName = { ...mockUser, name: 'auth0|abc123' }
    vi.mocked(userData.findByEmail).mockResolvedValue(userWithSubName)
    vi.mocked(userData.updateUserByEmail).mockResolvedValue({ ...userWithSubName, name: 'Jane' })

    await syncAuth0User({ sub: 'auth0|abc123', email: 'jane@test.com', name: 'Jane' })

    expect(userData.updateUserByEmail).toHaveBeenCalledWith(
      'jane@test.com',
      expect.objectContaining({ name: 'Jane' })
    )
  })
})

describe('auth.service - registerUser', () => {
  it('registers a user via Auth0', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    vi.mocked(auth0Provider.createAuth0User).mockResolvedValue(mockAuth0User)

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

  it('throws if email is missing', async () => {
    await expect(registerUser({ name: 'Jane' } as RegisterInput)).rejects.toThrow('El correo electrónico es obligatorio')
  })

  it('throws if password is missing', async () => {
    await expect(registerUser({ name: 'Jane', email: 'jane@test.com' } as RegisterInput)).rejects.toThrow('La contraseña es obligatoria')
  })
})

describe('auth.service - registerWorker', () => {
  beforeEach(() => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue({ ...mockUser, role: UserRole.Worker })
    vi.mocked(auth0Provider.createAuth0User).mockResolvedValue(mockAuth0User)
    vi.mocked(categoryData.upsertCategoryByName).mockResolvedValue({ id: 'cat-1', name: 'Plumbing' })
    vi.mocked(userData.addUserCategories).mockResolvedValue(undefined as never)
  })

  it('registers a worker with categories', async () => {
    const result = await registerWorker({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'Password123!',
      categories: ['Plumbing'],
    })

    expect(result.email).toBe('jane@test.com')
    expect(userData.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Worker })
    )
    expect(categoryData.upsertCategoryByName).toHaveBeenCalledWith('Plumbing')
    expect(userData.addUserCategories).toHaveBeenCalledWith(mockUser.id, ['cat-1'])
  })

  it('throws 400 when no categories are provided', async () => {
    await expect(
      registerWorker({ name: 'Bob', email: 'bob@test.com', password: 'Password123!', categories: [] })
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 409 when email already exists', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)

    await expect(
      registerWorker({ name: 'Bob', email: 'bob@test.com', password: 'Password123!', categories: ['Plumbing'] })
    ).rejects.toMatchObject({ status: 409 })
  })

  it('assigns worker role in Auth0 when AUTH0_WORKER_ROLE_ID is set', async () => {
    process.env.AUTH0_WORKER_ROLE_ID = 'role-worker-id'

    await registerWorker({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'Password123!',
      categories: ['Plumbing'],
    })

    expect(auth0Provider.assignAuth0Role).toHaveBeenCalledWith('auth0|123', 'role-worker-id')
    delete process.env.AUTH0_WORKER_ROLE_ID
  })
})

describe('auth.service - forgotPassword', () => {
  it('returns success message', async () => {
    vi.mocked(auth0Provider.sendAuth0PasswordReset).mockResolvedValue(undefined)

    const result = await forgotPassword('jane@test.com')
    expect(result.message).toContain('Si el correo está registrado')
  })

  it('throws 400 when email is missing', async () => {
    await expect(forgotPassword(undefined)).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 when email is empty string', async () => {
    await expect(forgotPassword('   ')).rejects.toMatchObject({ status: 400 })
  })

  it('propagates error when Auth0 call fails', async () => {
    vi.mocked(auth0Provider.sendAuth0PasswordReset).mockRejectedValue(
      Object.assign(new Error('Auth0 error'), { status: 502 })
    )

    await expect(forgotPassword('jane@test.com')).rejects.toMatchObject({ status: 502 })
  })
})

describe('auth.service - loginUser', () => {
  it('logs in and returns token data with user', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)
    vi.mocked(auth0Provider.loginWithAuth0).mockResolvedValue({
      access_token: 'access-token',
      id_token: 'id-token',
      token_type: 'Bearer',
      expires_in: 86400,
    })
    vi.mocked(auth0Provider.getAuth0UserInfo).mockResolvedValue({
      sub: 'auth0|1',
      email: 'jane@test.com',
      name: 'Jane',
      email_verified: true,
    })

    const result = await loginUser({ email: 'jane@test.com', password: 'password123' })

    expect(result.accessToken).toBe('access-token')
    expect(result.user.id).toBe('uuid-jane')
    expect(result.user.role).toBe(UserRole.Client)
  })

  it('throws 401 when credentials are invalid', async () => {
    vi.mocked(auth0Provider.loginWithAuth0).mockRejectedValue(
      Object.assign(new Error('invalid_grant'), { status: 401 })
    )

    await expect(loginUser({ email: 'jane@test.com', password: 'bad-password' })).rejects.toMatchObject({
      status: 401,
    })
  })

  it('throws 403 when email is not verified', async () => {
    vi.mocked(auth0Provider.loginWithAuth0).mockResolvedValue({
      access_token: 'access-token',
      token_type: 'Bearer',
      expires_in: 86400,
    })
    vi.mocked(auth0Provider.getAuth0UserInfo).mockResolvedValue({
      sub: 'auth0|1',
      email: 'jane@test.com',
      email_verified: false,
    })

    await expect(loginUser({ email: 'jane@test.com', password: 'password123' })).rejects.toMatchObject({ status: 403 })
  })

  it('throws 400 when email is missing', async () => {
    await expect(loginUser({ password: 'password123' })).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 when password is missing', async () => {
    await expect(loginUser({ email: 'jane@test.com' })).rejects.toMatchObject({ status: 400 })
  })

  it('creates new user on first login when user does not exist in DB', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    vi.mocked(auth0Provider.loginWithAuth0).mockResolvedValue({
      access_token: 'access-token',
      token_type: 'Bearer',
      expires_in: 86400,
    })
    vi.mocked(auth0Provider.getAuth0UserInfo).mockResolvedValue({
      sub: 'auth0|1',
      email: 'jane@test.com',
      name: 'Jane',
      email_verified: true,
    })

    const result = await loginUser({ email: 'jane@test.com', password: 'password123' })

    expect(userData.createUser).toHaveBeenCalled()
    expect(result.user.id).toBe('uuid-jane')
  })
})

describe('auth.service - resendVerificationEmail', () => {
  it('sends verification email for unverified account', async () => {
    vi.mocked(auth0Provider.getAuth0UserByEmail).mockResolvedValue({
      user_id: 'auth0|123',
      email: 'jane@test.com',
      email_verified: false,
    })
    vi.mocked(auth0Provider.sendAuth0VerificationEmail).mockResolvedValue(undefined)

    const result = await resendVerificationEmail('jane@test.com')

    expect(auth0Provider.getAuth0UserByEmail).toHaveBeenCalledWith('jane@test.com')
    expect(auth0Provider.sendAuth0VerificationEmail).toHaveBeenCalledWith('auth0|123')
    expect(result.message).toContain('verificación')
  })

  it('throws 400 when email is missing', async () => {
    await expect(resendVerificationEmail(undefined)).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 when email is an empty string', async () => {
    await expect(resendVerificationEmail('   ')).rejects.toMatchObject({ status: 400 })
  })

  it('throws 404 when Auth0 user is not found', async () => {
    vi.mocked(auth0Provider.getAuth0UserByEmail).mockResolvedValue(null)

    await expect(resendVerificationEmail('unknown@test.com')).rejects.toMatchObject({ status: 404 })
  })

  it('throws 400 when email is already verified', async () => {
    vi.mocked(auth0Provider.getAuth0UserByEmail).mockResolvedValue({
      user_id: 'auth0|123',
      email: 'jane@test.com',
      email_verified: true,
    })

    await expect(resendVerificationEmail('jane@test.com')).rejects.toMatchObject({ status: 400 })
    expect(auth0Provider.sendAuth0VerificationEmail).not.toHaveBeenCalled()
  })
})
