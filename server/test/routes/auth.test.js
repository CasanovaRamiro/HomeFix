import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb, prisma } from '../helpers/db.js'

describe('Auth register client', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  const validClient = {
    name: 'Marta',
    lastname: 'Ocampo',
    email: 'marta@ocampo.com',
    password: 'MartaOcampo123!',
    phone: '1123456789',
    role: 'CLIENTE'
  }

  it('registers a new client successfully', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(validClient)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('token')

    expect(res.body.user).not.toHaveProperty('password')
    expect(res.body.user.email).toBe(validClient.email)
    
    const userInDb = await prisma.user.findUnique({ where: { email: validClient.email },
    include : { clientProfile: true } 
  })

    expect(userInDb).not.toBeNull()
    expect(userInDb.role).toBe('CLIENTE')

    expect(userInDb.clientProfile).not.toBeNull()
    expect(userInDb.clientProfile.userId).toBe(userInDb.id)
  })

  it('fails to register with an existing email', async () => {
    await prisma.user.create({
      data: {
        name: 'Existing',
        lastname: 'User',
        email: 'marta@ocampo.com',
        password: 'MartaOcampo123!',
        role: 'CLIENTE'
      }
    })

    const res = await request(app)
      .post('/auth/register')
      .send(validClient)

    expect(res.statusCode).toBe(400)
  })

  it('fails if required fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ incomplete: 'user' })

    expect(res.statusCode).toBe(400)
  })

  it('fails if password is weak', async () => {
   const weakUser = { ...validClient, password: '123' }

    const res = await request(app)
      .post('/auth/register')
      .send(weakUser)

    expect(res.statusCode).toBe(400)
  })
})