const required = ['DATABASE_URL', 'JWT_SECRET']

export const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    console.error('Copy .env.example to .env and fill in the values.')
    process.exit(1)
  }
}
