import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findUniqueMock, findManyMock, createMock, findFirstMock, upsertNationalIdMock, upsertAddressMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn<(args: unknown) => Promise<unknown | null>>(),
  findManyMock: vi.fn<(args: unknown) => Promise<unknown[]>>(),
  createMock: vi.fn<(args: unknown) => Promise<unknown>>(),
  findFirstMock: vi.fn<(args: unknown) => Promise<unknown | null>>(),
  upsertNationalIdMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  upsertAddressMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
      create: createMock,
    },
    nationalIdType: {
      findFirst: findFirstMock,
      upsert: upsertNationalIdMock,
    },
    address: {
      upsert: upsertAddressMock,
    },
  },
}))

import { findByEmail, findAll, createUser } from '../../src/data/user.data.js'

const mockUser = {
  id: 1,
  name: 'Jane',
  surname: 'Test',
  email: 'jane@test.com',
  password: 'hashed',
  nationalId: 'DNI-12345678',
  phone: null,
  role: 'user',
  active: true,
  deleted: false,
  profilePicture: null,
  createdAt: new Date(),
  nationalIdTypeId: 'uuid-type',
  addressId: 'uuid-addr',
}

const publicUser = {
  id: 1,
  name: 'Jane',
  email: 'jane@test.com',
  phone: null,
  role: 'user',
  createdAt: mockUser.createdAt,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('findByEmail', () => {
  it('returns the user when the email exists', async () => {
    findUniqueMock.mockResolvedValue(mockUser)

    const user = await findByEmail('jane@test.com')

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'jane@test.com' } })
    expect(user).not.toBeNull()
    expect(user!.email).toBe('jane@test.com')
  })

  it('returns null when the email does not exist', async () => {
    findUniqueMock.mockResolvedValue(null)

    const user = await findByEmail('nobody@test.com')

    expect(user).toBeNull()
  })
})

describe('findAll', () => {
  it('returns all users without the password field', async () => {
    findManyMock.mockResolvedValue([publicUser, { ...publicUser, id: 2, name: 'John', email: 'john@test.com' }])

    const users = await findAll()

    expect(findManyMock).toHaveBeenCalledOnce()
    expect(users).toHaveLength(2)
    users.forEach((u: unknown) => expect(u).not.toHaveProperty('password'))
  })
})

describe('createUser', () => {
  it('inserts the user and returns it without the password field', async () => {
    upsertNationalIdMock.mockResolvedValue({ id: 'default-dni-id', description: 'DNI' })
    upsertAddressMock.mockResolvedValue({ id: 'default-addr-id', street: '', number: '0', city: '', state: '' })
    createMock.mockResolvedValue(publicUser)

    const user = await createUser({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'hashed',
      nationalId: 'DNI-87654321',
    })

    expect(createMock).toHaveBeenCalledOnce()
    expect(user.id).toBeDefined()
    expect(user.email).toBe('jane@test.com')
    expect(user).not.toHaveProperty('password')
  })
})
