const required = [
  'DATABASE_URL',
  'AUTH0_AUDIENCE',
  'AUTH0_ISSUER_BASE_URL',
  'GEMINI_API_KEY'
]

export const validateEnv = (): void => {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    console.error('Copy .env.example to .env and fill in the values.')
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1)
    }
  }
}
