import { Router } from 'express'
import multer from 'multer'
import { uploadImages } from '../../infrastructure/providers/cloudinary.provider.js'
import { createHttpError } from '../../lib/errors.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', upload.array('files', 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined
    if (!files || files.length === 0) throw createHttpError(400, 'No se enviaron archivos')

    const urls = await uploadImages(files.map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
      originalname: f.originalname,
    })))

    res.json({ urls })
  } catch (err) { next(err) }
})

export default router