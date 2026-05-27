import { findByEmail, createUser } from '../data/user.data.js'

interface Auth0Claims {
  sub?: string
  email?: string
  name?: string
  nickname?: string
  phone_number?: string
}

const managedPassword = 'AUTH0_MANAGED_ACCOUNT'

interface RegisterInput {
  name?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  address?: string
}

const createHttpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

const getRequiredEnv = (key: 'AUTH0_CLIENT_ID' | 'AUTH0_DB_CONNECTION') => {
  const value = process.env[key]
  if (!value) {
    throw createHttpError(500, `${key} is not configured`)
  }
  return value
}

interface Auth0SignupResponse {
  _id: string
  email: string
  email_verified: boolean
}

const createAuth0User = async (payload: {
  email: string
  password: string
  name: string
  lastName?: string
}) => {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL
  if (!issuer) throw createHttpError(500, 'AUTH0_ISSUER_BASE_URL is not configured')

  const response = await fetch(`${issuer.replace(/\/$/, '')}/dbconnections/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getRequiredEnv('AUTH0_CLIENT_ID'),
      connection: getRequiredEnv('AUTH0_DB_CONNECTION'),
      email: payload.email,
      password: payload.password,
      given_name: payload.name,
      family_name: payload.lastName,
      name: payload.lastName ? `${payload.name} ${payload.lastName}` : payload.name,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 400 && /already exists|user already exists|exists/i.test(text)) {
      throw createHttpError(409, 'Email already registered')
    }
    if (response.status === 400 && /password|weak/i.test(text)) {
      throw createHttpError(400, 'Password does not meet Auth0 policy')
    }
    throw createHttpError(502, 'Failed to create user in Auth0')
  }

  const data = (await response.json()) as Auth0SignupResponse
  return {
    auth0Id: data._id,
    email: data.email,
    emailVerified: data.email_verified,
  }
}

export const registerUser = async (input: RegisterInput) => {
  const name = input.name?.trim()
  const lastName = input.lastName?.trim()
  const email = input.email?.trim().toLowerCase()
  const password = input.password
  const phone = input.phone?.trim() || undefined

  if (!name) throw createHttpError(400, 'Name is required')
  if (!email) throw createHttpError(400, 'Email is required')
  if (!password) throw createHttpError(400, 'Password is required')
  if (password.length < 8) throw createHttpError(400, 'Password must be at least 8 characters')

  const existing = await findByEmail(email)
  if (existing) throw createHttpError(409, 'Email already registered')

  const auth0User = await createAuth0User({
    email,
    password,
    name,
    lastName,
  })

  const user = await createUser({
    name: lastName ? `${name} ${lastName}` : name,
    email,
    password: managedPassword,
    phone,
  })

  return {
    userId: user.id,
    email: auth0User.email,
    emailVerified: auth0User.emailVerified,
    message: 'User registered successfully',
  }
}

export const syncAuth0User = async (claims: Auth0Claims) => {
  if (!claims.sub) throw new Error('Invalid Auth0 token: missing sub claim')

  const email = claims.email ?? `${claims.sub}@auth0.local`
  const existing = await findByEmail(email)
  if (existing) {
    const { password: _, ...safeUser } = existing
    return safeUser
  }

  const user = await createUser({
    email,
    name: claims.name ?? claims.nickname ?? claims.sub,
    password: managedPassword,
    phone: claims.phone_number,
  })

  return user
}
