import { v2 as cloudinary } from 'cloudinary'
import { env } from '../../lib/envConfig.js'
import { logger } from '../../lib/logger.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

const isRawFile = (mimetype: string) => mimetype === 'application/pdf'

export const uploadImage = async (file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = { folder: 'ofix', resource_type: 'auto' }
    if (isRawFile(file.mimetype)) {
      options.resource_type = 'raw'
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err || !result) {
          logger.error({ err, filename: file.originalname, action: 'cloudinary.uploadFailed' }, 'Image upload to Cloudinary failed')
          reject(err instanceof Error ? err : new Error('Upload failed'))
          return
        }
        resolve(result.secure_url)
      },
    )
    uploadStream.end(file.buffer)
  })
}

export const uploadImages = async (files: { buffer: Buffer; mimetype: string; originalname: string }[]): Promise<string[]> => {
  logger.info({ count: files.length, action: 'cloudinary.uploadBatch' }, `Uploading ${files.length} images to Cloudinary`)
  return Promise.all(files.map(uploadImage))
}

const getResourceTypeFromUrl = (url: string): 'image' | 'video' | 'raw' => {
  if (url.includes('/video/upload/')) return 'video'
  if (url.includes('/raw/upload/')) return 'raw'
  const lower = url.toLowerCase()
  if (lower.match(/\.(mp4|webm|mov|mkv|avi|m4v|ogg)$/)) return 'video'
  if (lower.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/)) return 'raw'
  return 'image'
}

export const deleteImage = async (url: string): Promise<void> => {
  try {
    const resourceType = getResourceTypeFromUrl(url)
    let match: RegExpMatchArray | null = null
    if (resourceType === 'raw') {
      match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
    } else if (resourceType === 'video') {
      match = url.match(/\/video\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
    } else {
      match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.\w+$/) || url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
    }
    if (!match || !match[1]) {
      logger.warn({ url, action: 'cloudinary.deleteInvalidUrl' }, 'Invalid Cloudinary URL for deletion')
      return
    }
    const publicId = match[1]
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    logger.error({ err, url, action: 'cloudinary.deleteFailed' }, 'Failed to delete from Cloudinary')
  }
}