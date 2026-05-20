
import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, prisma } from '../helpers/db.js'
import { findByEmail, findAll, createUser } from '../../src/data/user.data.js'

beforeEach(() => cleanDb())

describe('findByEmail', () => {
  it('returns the user when the email exists', async () => {
    await prisma.user.create({
      data: { name: 'Jane', email: 'jane@test.com', password: 'hashed' },
    })

    const user = await findByEmail('jane@test.com')

    expect(user).not.toBeNull()
    expect(user.email).toBe('jane@test.com')
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
        { name: 'Jane', email: 'jane@test.com', password: 'hashed' },
        { name: 'John', email: 'john@test.com', password: 'hashed' },
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
