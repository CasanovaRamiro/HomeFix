import { findByEmail, createUser, addUserCategories } from '../data/user.data.js'
import prisma from '../lib/prisma.js'
import { UserRole } from '../types/userRole.js'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface Auth0Claims {
  sub?: string
  email?: string
  name?: string
  nickname?: string
  phone_number?: string
}

const managedPassword = 'AUTH0_MANAGED_ACCOUNT'

export interface RegisterInput {
  name?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  address?: string
  nationalId?: string
}

interface RegisterWorkerInput extends RegisterInput {
  categories: string[]
}

interface RegisterWorkerInput extends RegisterInput {
  categories: string[]
}

interface LoginInput {
  email?: string
  password?: string
}

export const createHttpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

const validatePassword = (password: string) => {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula'
  if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula'
  if (!/[0-9]/.test(password)) return 'La contraseña debe contener al menos un número'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'La contraseña debe contener al menos un carácter especial'
  return null
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

interface Auth0TokenResponse {
  access_token: string
  id_token?: string
  token_type: string
  expires_in: number
}

interface Auth0UserInfoResponse {
  sub?: string
  email?: string
  name?: string
  nickname?: string
  phone_number?: string
}

const getIssuerBaseUrl = () => {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL
  if (!issuer) throw createHttpError(500, 'AUTH0_ISSUER_BASE_URL is not configured')
  return issuer.replace(/\/$/, '')
}

const createAuth0User = async (payload: {
  email: string
  password: string
  name: string
  lastName?: string
}) => {
  const response = await fetch(`${getIssuerBaseUrl()}/dbconnections/signup`, {
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

const loginWithAuth0 = async (email: string, password: string) => {
  const audience = process.env.AUTH0_AUDIENCE
  if (!audience) throw createHttpError(500, 'AUTH0_AUDIENCE is not configured')

  const response = await fetch(`${getIssuerBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      client_id: getRequiredEnv('AUTH0_CLIENT_ID'),
      username: email,
      password,
      audience,
      realm: getRequiredEnv('AUTH0_DB_CONNECTION'),
      scope: 'openid profile email',
    }),
  })

  if (!response.ok) {
    const text = await response.text();
    console.error('Error de Auth0:', text);
    if (response.status === 400 && /invalid_grant|wrong email|wrong password|invalid/i.test(text)) {
      throw createHttpError(401, 'Correo electrónico o contraseña incorrectos')
    }
    throw createHttpError(502, 'Error al autenticar con Auth0')
  }

  return (await response.json()) as Auth0TokenResponse
}

const getAuth0UserInfo = async (accessToken: string) => {
  const response = await fetch(`${getIssuerBaseUrl()}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw createHttpError(502, 'Failed to fetch user profile from Auth0')
  }

  return (await response.json()) as Auth0UserInfoResponse
}

export const registerUser = async (input: RegisterInput) => {
  const name = input.name?.trim()
  const lastName = input.lastName?.trim()
  const email = input.email?.trim()?.toLowerCase()
  const password = input.password
  const phone = input.phone?.trim() || undefined

  if (!name) throw createHttpError(400, 'El nombre es obligatorio')
  if (!email) throw createHttpError(400, 'El correo electrónico es obligatorio')
  if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

  const passwordError = validatePassword(password)
  if (passwordError) throw createHttpError(400, passwordError)

  const existing = await findByEmail(email)
  if (existing) throw createHttpError(409, 'El correo electrónico ya está registrado')

  let auth0User: { email: string; emailVerified: boolean } | null = null
  try {
    auth0User = await createAuth0User({
      email,
      password,
      name,
      lastName,
    })
  } catch {
    console.error('Auth0 no disponible, registrando solo localmente')
  }

  const passwordHash = auth0User ? managedPassword : await bcrypt.hash(password, 10)

  const user = await createUser({
    name,
    email,
    password: passwordHash,
    phone,
    surname: lastName ?? undefined,
    role: UserRole.Client,
  })

  return {
    userId: user.id,
    email: auth0User?.email ?? email,
    emailVerified: auth0User?.emailVerified ?? false,
    message: 'Usuario registrado exitosamente',
  }
}

export const registerWorker = async (input: RegisterWorkerInput) => {
  const name = input.name!.trim()
  const lastName = input.lastName?.trim()
  const email = input.email!.trim().toLowerCase()
  const password = input.password!
  const phone = input.phone?.trim() || undefined

  const passwordError = validatePassword(password)
  if (passwordError) throw createHttpError(400, passwordError)

  if (!input.categories || input.categories.length === 0) {
    throw createHttpError(400, 'Debes seleccionar al menos una especialidad')
  }

  const existing = await findByEmail(email)
  if (existing) throw createHttpError(409, 'El correo electrónico ya está registrado')

  let auth0User: { email: string; emailVerified: boolean } | null = null
  try {
    auth0User = await createAuth0User({
      email,
      password,
      name,
      lastName,
    })
  } catch {
    console.error('Auth0 no disponible, registrando solo localmente')
  }

  const passwordHash = auth0User ? managedPassword : await bcrypt.hash(password, 10)

  const user = await createUser({
    name: lastName ? `${name} ${lastName}` : name,
    email,
    password: passwordHash,
    phone,
    role: 'worker',
  })

  // Resolve categories to IDs and create associations
  const categoryIds = await Promise.all(
    input.categories.map(async (catName) => {
      const cat = await prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      })
      return cat.id
    })
  )

  await addUserCategories(user.id, categoryIds)

  return {
    userId: user.id,
    email: auth0User?.email ?? email,
    emailVerified: auth0User?.emailVerified ?? false,
    message: 'Trabajador registrado exitosamente',
  }
}

export const loginUser = async (input: LoginInput) => {
  const email = input.email?.trim().toLowerCase()
  const password = input.password

  if (!email) throw createHttpError(400, 'Email is required')
  if (!password) throw createHttpError(400, 'Password is required')

  let tokenData: Auth0TokenResponse | null = null
  try {
    tokenData = await loginWithAuth0(email, password)
  } catch {
    console.error('Auth0 no disponible, usando autenticación local')
  }

  if (!tokenData) {
    const user = await findByEmail(email)
    if (!user || user.password === managedPassword) {
      throw createHttpError(401, 'Correo electrónico o contraseña incorrectos')
    }
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw createHttpError(401, 'Correo electrónico o contraseña incorrectos')
    }
    const localToken = jwt.sign(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' },
    )
    return {
      accessToken: localToken,
      idToken: null,
      tokenType: 'local',
      expiresIn: 86400,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    }
  }

  const profile = await getAuth0UserInfo(tokenData.access_token)

  const profileEmail = profile.email?.toLowerCase() ?? email
  const existing = await findByEmail(profileEmail)
  const user = existing
    ? {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role,
        createdAt: existing.createdAt,
      }
    : await createUser({
        email: profileEmail,
        name: profile.name ?? profile.nickname ?? profile.sub ?? profileEmail,
        password: managedPassword,
        phone: profile.phone_number,
      })
  if (!user) throw createHttpError(500, 'Could not resolve user')

  return {
    accessToken: tokenData.access_token,
    idToken: tokenData.id_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
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
