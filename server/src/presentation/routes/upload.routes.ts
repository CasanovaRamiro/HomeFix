import { Router } from 'express'
import multer from 'multer'
import https from 'https'
import http from 'http'
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

router.get('/download', (req, res) => {
  const url = req.query.url as string
  if (!url || !url.startsWith('https://res.cloudinary.com/')) {
    res.status(400).json({ error: 'URL inválida' })
    return
  }

  const client = url.startsWith('https') ? https : http
  client.get(url, (proxyRes) => {
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      client.get(proxyRes.headers.location, (redirectRes) => {
        res.setHeader('Content-Type', redirectRes.headers['content-type'] || 'application/octet-stream')
        res.setHeader('Content-Disposition', 'attachment; filename="matricula.pdf"')
        redirectRes.pipe(res)
      }).on('error', () => { res.status(502).json({ error: 'Error al descargar' }) })
      return
    }
    res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment; filename="matricula.pdf"')
    proxyRes.pipe(res)
  }).on('error', () => { res.status(502).json({ error: 'Error al descargar' }) })
})

export default router