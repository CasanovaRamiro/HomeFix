import { Router } from 'express'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { getOrCreateConversation, getUserConversations, getConversationById } from '../../domain/services/conversation.service.js'
import { sendMessage, getConversationMessages, readMessages } from '../../domain/services/message.service.js'
import { validateConversationBody, validateMessageBody } from '../middleware/conversation.middleware.js'
import { getIO } from '../socket/index.js'
import { findSocketByUserId } from '../socket/chat.handler.js'
import { findConversationById } from '../../infrastructure/database/conversation.database.js'

const router = Router()

router.post('/', validateConversationBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const { postId, workerId } = req.body
    const result = await getOrCreateConversation(postId, user.id, workerId)
    res.status(200).json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await getUserConversations(user.id)
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await getConversationById(req.params.id, user.id)
    if (!result) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/:id/messages', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await getConversationMessages(req.params.id, user.id)
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/:id/messages', validateMessageBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const message = await sendMessage(req.params.id as string, user.id, req.body.content)

    const io = getIO()
    if (io) {
      const conversation = await findConversationById(message.conversationId)
      if (conversation) {
        const otherUserId = conversation.clientId === user.id ? conversation.workerId : conversation.clientId
        const otherSocket = await findSocketByUserId(io, otherUserId)
        if (otherSocket) {
          otherSocket.join(`conversation:${message.conversationId}`)
        }
      }
      io.to(`conversation:${message.conversationId}`).emit('message:new', {
        ...message,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() ?? null,
      })
    }

    res.status(201).json(message)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    await readMessages(req.params.id, user.id)

    const io = getIO()
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('message:read', {
        conversationId: req.params.id,
        readByUserId: user.id,
      })
    }

    res.status(204).end()
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
