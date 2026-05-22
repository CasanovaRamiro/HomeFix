import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, prisma } from '../helpers/db.js'
import { findByEmail, findAll, createUser } from '../../src/data/user.data.js'

beforeEach(() => cleanDb())

const createUserData = async (name: string, email: string, password: string) => {
  const nationalIdType = await prisma.nationalIdType.create({
    data: { description: `DNI-${email}` },
  })
  const address = await prisma.address.create({
    data: {
      street: 'Test street',
      number: '123',
      city: 'Test city',
      state: 'Test state',
    },
  })

  return {
    name,
    surname: 'Test',
    email,
    password,
    nationalId: `nid-${email}`,
    nationalIdTypeId: nationalIdType.id,
    addressId: address.id,
  }
}

describe('findByEmail', () => {
  it('returns the user when the email exists', async () => {
    await prisma.user.create({
      data: await createUserData('Jane', 'jane@test.com', 'hashed'),
    })

    const user = await findByEmail('jane@test.com')

    expect(user).not.toBeNull()
    expect(user!.email).toBe('jane@test.com')
  })

  it('returns null when the email does not exist', async () => {
    const user = await findByEmail('nobody@test.com')
    expect(user).toBeNull()
  })
})

describe('findAll', () => {
  it('returns all users without the password field', async () => {
    await prisma.user.createMany({
      data: [
        await createUserData('Jane', 'jane@test.com', 'hashed'),
        await createUserData('John', 'john@test.com', 'hashed'),
      ],
    })

    const users = await findAll()

    expect(users).toHaveLength(2)
    users.forEach((u) => expect(u).not.toHaveProperty('password'))
  })
})

describe('createUser', () => {
  it('inserts the user and returns it without the password field', async () => {
    const user = await createUser({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'hashed',
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('jane@test.com')
    expect(user).not.toHaveProperty('password')
  })
})
