import { v2 as cloudinary } from 'cloudinary'
import { env } from '../../lib/envConfig.js'
import { logger } from '../../lib/logger.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ofix', resource_type: 'auto' },
      (err, result) => {
        if (err || !result) {
          logger.error({ err, filename: file.originalname, action: 'cloudinary.uploadFailed' }, 'Image upload to Cloudinary failed')
          reject(err instanceof Error ? err : new Error('Upload failed'))
        } else {
          resolve(result.secure_url)
        }
      },
    )
    uploadStream.end(file.buffer)
  })
}

export const uploadImages = async (files: { buffer: Buffer; mimetype: string; originalname: string }[]): Promise<string[]> => {
  logger.info({ count: files.length, action: 'cloudinary.uploadBatch' }, `Uploading ${files.length} images to Cloudinary`)
  return Promise.all(files.map(uploadImage))
}

export const deleteImage = async (url: string): Promise<void> => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  if (!match) {
    logger.warn({ url, action: 'cloudinary.deleteInvalidUrl' }, 'Invalid Cloudinary URL for deletion')
    return
  }
  await cloudinary.uploader.destroy(match[1])
}