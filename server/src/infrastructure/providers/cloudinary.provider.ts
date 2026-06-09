import { v2 as cloudinary } from 'cloudinary'
import { env } from '../../lib/envConfig.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ofix', resource_type: 'image' },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload failed'))
        else resolve(result.secure_url)
      },
    )
    uploadStream.end(file.buffer)
  })
}

export const uploadImages = async (files: { buffer: Buffer; mimetype: string; originalname: string }[]): Promise<string[]> => {
  return Promise.all(files.map(uploadImage))
}

export const deleteImage = async (url: string): Promise<void> => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/)
  if (!match) return
  await cloudinary.uploader.destroy(match[1])
}