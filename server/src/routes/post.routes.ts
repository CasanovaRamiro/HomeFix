import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { post } from '../services/post.service.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
    try {
        const result = await post(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: 'Invalid post data' })
    }
})

export default router