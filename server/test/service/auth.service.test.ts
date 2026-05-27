import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn<(args: { name: string; email: string; password: string; nationalId: string; phone?: string }) => Promise<{ id: number; name: string; email: string; phone: string | null; role: string }>>(),
}))

import * as userData from '../../src/data/user.data.js'
import { register, login } from '../../src/services/auth.service.js'

const mockUser = {
  id: 1,
  name: 'Jane',
  email: 'jane@test.com',
  phone: null as string | null,
  role: 'user',
  createdAt: new Date(),
  nationalId: 'DNI-12345678',
  surname: 'Test',
  password: 'hashed',
  profilePicture: null as string | null,
  active: true,
  deleted: false,
  nationalIdTypeId: 'uuid-national-id-type',
  addressId: 'uuid-address',
}

describe('auth.service - register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a token and user when registration succeeds', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)

    const result = await register({ name: 'Jane', email: 'jane@test.com', password: 'secret', nationalId: 'DNI-12345678' })

    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe('jane@test.com')
  })

  it('throws if the email is already taken', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)

    await expect(
      register({ name: 'Jane', email: 'jane@test.com', password: 'secret', nationalId: 'DNI-12345678' })
    ).rejects.toThrow('Email already in use')
  })
})

describe('auth.service - login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws if the user does not exist', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(null)

    await expect(
      login({ email: 'nobody@test.com', password: 'secret' })
    ).rejects.toThrow('Invalid credentials')
  })

  it('throws if the password is wrong', async () => {
    vi.mocked(userData.findByEmail).mockResolvedValue(mockUser)

    await expect(
      login({ email: 'jane@test.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid credentials')
  })
})