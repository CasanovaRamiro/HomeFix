import 'dotenv/config'

const required = [
  'DATABASE_URL',
  'AUTH0_AUDIENCE',
  'AUTH0_ISSUER_BASE_URL',
  'GEMINI_API_KEY',
]

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}\nCopy .env.example to .env and fill in the values.`)
}

export const env = {
  get PORT() { return process.env.PORT || '3000' },
  get NODE_ENV() { return process.env.NODE_ENV || 'development' },
  get CORS_ORIGIN() { return process.env.CORS_ORIGIN },
  get DATABASE_URL() { return process.env.DATABASE_URL! },
  get AUTH0_AUDIENCE() { return process.env.AUTH0_AUDIENCE! },
  get AUTH0_ISSUER_BASE_URL() { return process.env.AUTH0_ISSUER_BASE_URL! },
  get AUTH0_CLIENT_ID() { return process.env.AUTH0_CLIENT_ID },
  get AUTH0_DB_CONNECTION() { return process.env.AUTH0_DB_CONNECTION },
  get AUTH0_M2M_CLIENT_ID() { return process.env.AUTH0_M2M_CLIENT_ID },
  get AUTH0_M2M_CLIENT_SECRET() { return process.env.AUTH0_M2M_CLIENT_SECRET },
  get AUTH0_CLIENT_ROLE_ID() { return process.env.AUTH0_CLIENT_ROLE_ID },
  get AUTH0_WORKER_ROLE_ID() { return process.env.AUTH0_WORKER_ROLE_ID },
  get GEMINI_API_KEY() { return process.env.GEMINI_API_KEY! },
  get GEMINI_MODEL() { return process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
  get CLOUDINARY_CLOUD_NAME() { return process.env.CLOUDINARY_CLOUD_NAME! },
  get CLOUDINARY_API_KEY() { return process.env.CLOUDINARY_API_KEY! },
  get CLOUDINARY_API_SECRET() { return process.env.CLOUDINARY_API_SECRET! },
}
