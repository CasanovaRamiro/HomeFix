import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/data/user.data.js', () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
}))

import * as userData from '../../src/data/user.data.js'
import { register, login } from '../../src/services/auth.service.js'

const mockUser = {
  id: 1,
  name: 'Jane',
  email: 'jane@test.com',
  phone: null,
  role: 'user',
  createdAt: new Date(),
}

describe('auth.service - register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a token and user when registration succeeds', async () => {
    userData.findByEmail.mockResolvedValue(null)
    userData.createUser.mockResolvedValue(mockUser)

    const result = await register({ name: 'Jane', email: 'jane@test.com', password: 'secret' })

    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe('jane@test.com')
  })

  it('throws if the email is already taken', async () => {
    userData.findByEmail.mockResolvedValue(mockUser)

    await expect(
      register({ name: 'Jane', email: 'jane@test.com', password: 'secret' })
    ).rejects.toThrow('Email already in use')
  })
})

describe('auth.service - login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws if the user does not exist', async () => {
    userData.findByEmail.mockResolvedValue(null)

    await expect(
      login({ email: 'nobody@test.com', password: 'secret' })
    ).rejects.toThrow('Invalid credentials')
  })

  it('throws if the password is wrong', async () => {
    userData.findByEmail.mockResolvedValue({ ...mockUser, password: 'hashed_password' })

    await expect(
      login({ email: 'jane@test.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid credentials')
  })
})
