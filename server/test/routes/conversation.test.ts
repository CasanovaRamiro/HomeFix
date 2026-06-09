import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { UserRole } from '../../src/domain/types/userRole.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'
import type { Auth0Claims } from '../../src/domain/services/auth.service.js'

let currentUser: Auth0Claims = {
  sub: 'auth0|client123',
  email: 'client@test.com',
  name: 'Client User',
}

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    ;(req as Request & { auth?: { payload: JWTPayload & Auth0Claims } }).auth = { header: {}, token: '', payload: currentUser as JWTPayload & Auth0Claims }
    next()
  },
}))

vi.mock('../../src/presentation/socket/index.js', () => ({
  getIO: vi.fn(() => null),
}))

vi.mock('../../src/presentation/socket/chat.handler.js', () => ({
  findSocketByUserId: vi.fn(),
}))

import { app } from '../../src/index.js'
import { getIO } from '../../src/presentation/socket/index.js'

let token: string
let clientId: string
let workerId: string
let postId: string
let conversationId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Client })
  clientId = client.id
  workerId = worker.id
  token = 'test-token'

  const post = await prisma.post.create({
    data: {
      userId: clientId,
      title: 'Fix pipes',
      description: 'Need a plumber',
      address: '123 Main St',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      status: 'Active',
    },
  })
  postId = post.id

  const conv = await prisma.conversation.create({
    data: { postId, clientId, workerId },
  })
  conversationId = conv.id

  vi.mocked(getIO).mockReturnValue(null)
})

describe('POST /conversations', () => {
  it('should create a new conversation', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .post('/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId, workerId })

    expect(res.status).toBe(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.clientId).toBe(clientId)
    expect(res.body.workerId).toBe(workerId)
    expect(res.body.postId).toBe(postId)
  })

  it('should return existing conversation instead of duplicate', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .post('/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId, workerId })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(conversationId)
  })

  it('should return 400 when postId is missing', async () => {
    const res = await request(app)
      .post('/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ workerId })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('postId is required')
  })

  it('should return 400 when workerId is missing', async () => {
    const res = await request(app)
      .post('/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('workerId is required')
  })

  it('should return 401 without token', async () => {
    const res = await request(app).post('/conversations').send({ postId, workerId })

    expect(res.status).toBe(401)
  })
})

describe('GET /conversations', () => {
  it('should return list of conversations for the user', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .get('/conversations')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe(conversationId)
    expect(res.body[0].postTitle).toBe('Fix pipes')
    expect(res.body[0].otherUserId).toBe(workerId)
  })

  it('should return empty array when no conversations', async () => {
    currentUser = { sub: 'auth0|other123', email: 'other@test.com', name: 'Other User' }

    const res = await request(app)
      .get('/conversations')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('should return 401 without token', async () => {
    const res = await request(app).get('/conversations')
    expect(res.status).toBe(401)
  })
})

describe('GET /conversations/:id', () => {
  it('should return conversation by id', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .get(`/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(conversationId)
  })

  it('should return 404 for non-existing id', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .get('/conversations/non-existent-id')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('should return 403 when user is not a participant', async () => {
    currentUser = { sub: 'auth0|other123', email: 'other@test.com', name: 'Other User' }

    const res = await request(app)
      .get(`/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})

describe('POST /conversations/:id/messages', () => {
  it('should send a message', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello there' })

    expect(res.status).toBe(201)
    expect(res.body.conversationId).toBe(conversationId)
    expect(res.body.senderId).toBe(clientId)
    expect(res.body.content).toBe('Hello there')
    expect(res.body.sender.name).toBe('Client')
  })

  it('should return 400 when content is missing', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('content is required')
  })

  it('should return 404 when conversation does not exist', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .post('/conversations/non-existent-id/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello' })

    expect(res.status).toBe(404)
  })

  it('should return 403 when user is not a participant', async () => {
    currentUser = { sub: 'auth0|other123', email: 'other@test.com', name: 'Other User' }

    const res = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello' })

    expect(res.status).toBe(403)
  })

  it('should emit message:new via socket when socket is available', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }
    const mockIo = { to: vi.fn().mockReturnThis(), emit: vi.fn() }
    vi.mocked(getIO).mockReturnValue(mockIo as never)

    const res = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Socket test' })

    expect(res.status).toBe(201)
    expect(mockIo.to).toHaveBeenCalledWith(`conversation:${conversationId}`)
    expect(mockIo.emit).toHaveBeenCalledWith(
      'message:new',
      expect.objectContaining({ content: 'Socket test' }),
    )
  })
})

describe('GET /conversations/:id/messages', () => {
  beforeEach(async () => {
    await prisma.message.create({ data: { conversationId, senderId: clientId, content: 'First message', createdAt: new Date('2026-06-01T10:00:00Z') } })
    await prisma.message.create({ data: { conversationId, senderId: workerId, content: 'Reply message', createdAt: new Date('2026-06-01T10:01:00Z') } })
  })

  it('should return messages in order', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].content).toBe('First message')
    expect(res.body[1].content).toBe('Reply message')
  })

  it('should mark worker messages as read', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)

    const messages = await prisma.message.findMany({
      where: { conversationId, senderId: workerId },
    })
    for (const msg of messages) {
      expect(msg.readAt).not.toBeNull()
    }
  })

  it('should return 404 when conversation does not exist', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .get('/conversations/non-existent-id/messages')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PATCH /conversations/:id/read', () => {
  beforeEach(async () => {
    await prisma.message.createMany({
      data: [
        { conversationId, senderId: workerId, content: 'Unread' },
      ],
    })
  })

  it('should mark messages as read and return 204', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .patch(`/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)

    const messages = await prisma.message.findMany({
      where: { conversationId, senderId: workerId },
    })
    for (const msg of messages) {
      expect(msg.readAt).not.toBeNull()
    }
  })

  it('should return 404 when conversation does not exist', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }

    const res = await request(app)
      .patch('/conversations/non-existent-id/read')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('should return 403 when user is not a participant', async () => {
    currentUser = { sub: 'auth0|other123', email: 'other@test.com', name: 'Other User' }

    const res = await request(app)
      .patch(`/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('should emit message:read via socket when socket is available', async () => {
    currentUser = { sub: 'auth0|client123', email: 'client@test.com', name: 'Client User' }
    const mockIo = { to: vi.fn().mockReturnThis(), emit: vi.fn() }
    vi.mocked(getIO).mockReturnValue(mockIo as never)

    const res = await request(app)
      .patch(`/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
    expect(mockIo.to).toHaveBeenCalledWith(`conversation:${conversationId}`)
    expect(mockIo.emit).toHaveBeenCalledWith('message:read', {
      conversationId,
      readByUserId: clientId,
    })
  })
})
