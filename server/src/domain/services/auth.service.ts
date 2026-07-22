import { logger } from '../../lib/logger.js'
import { createHttpError } from '../../lib/errors.js'
import { env } from '../../lib/envConfig.js'
import { findByEmail, createUser, addUserCategories, updateUserByEmail } from '../../infrastructure/database/user.database.js'
import { upsertCategoryByName } from '../../infrastructure/database/category.database.js'
import { createAuth0User, loginWithAuth0, getAuth0UserInfo, assignAuth0Role, sendAuth0PasswordReset, getAuth0UserByEmail, sendAuth0VerificationEmail } from '../../infrastructure/providers/auth0.provider.js'
import { UserRole } from '../types/userRole.js'
import type { CreateUserInput } from '../types/user.types.js'

const managedPassword = 'AUTH0_MANAGED_ACCOUNT'

const ROLE_ASSIGN_WARNING = 'Tu cuenta fue creada, pero hubo un problema al configurar tus permisos. Si notás algún inconveniente al usar la plataforma, contactanos para que lo revisemos.'

/**
 * Auth0 role assignment can fail transiently (rate limits, network blips).
 * We retry once before giving up; if it still fails, registration proceeds
 * anyway (the local User record already has the right role) but the caller
 * is told so it can warn the user instead of claiming a fully clean signup.
 */
const assignRoleWithRetry = async (auth0Id: string, roleId: string, email: string, action: string): Promise<boolean> => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await assignAuth0Role(auth0Id, roleId)
      return true
    } catch (err) {
      logger.error({ email, auth0Id, err, attempt, action }, 'Failed to assign role in Auth0')
    }
  }
  return false
}

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

interface LoginInput {
  email?: string
  password?: string
}

export interface Auth0Claims {
  sub?: string
  email?: string
  name?: string
  nickname?: string
  phone_number?: string
  role?: string
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

  const existing = await findByEmail(email)
  if (existing) throw createHttpError(409, 'El correo electrónico ya está registrado')

  const auth0User = await createAuth0User({ email, password, name, lastName })

  const clientRoleId = env.AUTH0_CLIENT_ROLE_ID
  const roleAssigned = clientRoleId
    ? await assignRoleWithRetry(auth0User.auth0Id, clientRoleId, email, 'auth.register.roleAssign')
    : true

  const userData: CreateUserInput = {
    name,
    email,
    password: managedPassword,
    phone,
    surname: lastName ?? '',
    role: UserRole.Client,
  }
  const user = await createUser(userData)

  logger.info({ userId: user.id, email, role: UserRole.Client, roleAssigned, action: 'auth.user.registered' }, 'Client registered')

  return {
    userId: user.id,
    email: auth0User?.email ?? email,
    emailVerified: auth0User?.emailVerified ?? false,
    roleAssigned,
    message: roleAssigned ? 'Usuario registrado exitosamente' : ROLE_ASSIGN_WARNING,
  }
}

export const registerWorker = async (input: RegisterWorkerInput) => {
  const name = input.name!.trim()
  const lastName = input.lastName?.trim()
  const email = input.email!.trim().toLowerCase()
  const password = input.password!
  const phone = input.phone?.trim() || undefined

  if (!input.categories || input.categories.length === 0) {
    throw createHttpError(400, 'Debes seleccionar al menos una especialidad')
  }

  const existing = await findByEmail(email)
  if (existing) throw createHttpError(409, 'El correo electrónico ya está registrado')

  const auth0User = await createAuth0User({ email, password, name, lastName })

  const workerRoleId = env.AUTH0_WORKER_ROLE_ID
  const roleAssigned = workerRoleId
    ? await assignRoleWithRetry(auth0User.auth0Id, workerRoleId, email, 'auth.register.roleAssign')
    : true

  const user = await createUser({
    name: lastName ? `${name} ${lastName}` : name,
    email,
    password: managedPassword,
    phone,
    role: UserRole.Worker,
  })

  const categoryIds = await Promise.all(
    input.categories.map(async (catName) => {
      const cat = await upsertCategoryByName(catName)
      return cat.id
    })
  )

  await addUserCategories(user.id, categoryIds)

  logger.info({ userId: user.id, email, role: UserRole.Worker, categories: input.categories, roleAssigned, action: 'auth.user.registered' }, 'Worker registered')

  return {
    userId: user.id,
    email: auth0User?.email ?? email,
    emailVerified: auth0User?.emailVerified ?? false,
    roleAssigned,
    message: roleAssigned ? 'Trabajador registrado exitosamente' : ROLE_ASSIGN_WARNING,
  }
}

export const loginUser = async (input: LoginInput) => {
  const email = input.email?.trim().toLowerCase()
  const password = input.password

  if (!email) throw createHttpError(400, 'El correo electrónico es obligatorio')
  if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

  const tokenData = await loginWithAuth0(email, password)
  const profile = await getAuth0UserInfo(tokenData.access_token)

  if (profile.email_verified !== true) {
    throw createHttpError(403, 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisá tu bandeja de entrada.')
  }

  const profileEmail = profile.email?.toLowerCase() ?? email
  const existing = await findByEmail(profileEmail)
  const user = existing
    ? {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        photo: existing.photo,
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

  logger.info({ userId: user.id, email, action: 'auth.user.loggedIn' }, 'User logged in')

  return {
    accessToken: tokenData.access_token,
    idToken: tokenData.id_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, photo: user.photo, role: user.role, createdAt: user.createdAt },
  }
}

export const resendVerificationEmail = async (email: string | undefined) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) throw createHttpError(400, 'El correo electrónico es obligatorio')

  const auth0User = await getAuth0UserByEmail(normalizedEmail)
  if (!auth0User) throw createHttpError(404, 'No encontramos una cuenta con ese correo')
  if (auth0User.email_verified) throw createHttpError(400, 'El correo ya fue verificado')

  await sendAuth0VerificationEmail(auth0User.user_id)

  logger.info({ email: normalizedEmail, action: 'auth.verificationEmailResent' }, 'Verification email resent')

  return { message: 'Email de verificación reenviado. Revisá tu bandeja de entrada.' }
}

export const forgotPassword = async (email: string | undefined) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) throw createHttpError(400, 'El correo electrónico es obligatorio')

  await sendAuth0PasswordReset(normalizedEmail)

  logger.info({ email: normalizedEmail, action: 'auth.passwordResetRequested' }, 'Password reset email requested')

  return { message: 'Si el correo está registrado, recibirás un email para restablecer tu contraseña' }
}

export const syncAuth0User = async (claims: Auth0Claims | undefined, isRegistration = false) => {
  if (!claims?.sub) throw Object.assign(new Error('Invalid Auth0 token: missing sub claim'), { status: 401 })

  const fallbackEmail = `${claims.sub}@auth0.local`
  const email = claims.email ?? fallbackEmail

  if (claims.email) {
    const realUserExists = await findByEmail(claims.email)
    if (!realUserExists) {
      const ghost = await findByEmail(fallbackEmail)
      if (ghost) {
        const goodName = claims.name ?? claims.nickname
        await updateUserByEmail(fallbackEmail, {
          email: claims.email,
          ...(goodName && ghost.name === claims.sub ? { name: goodName } : {}),
        })
      }
    }
  }

  const existing = await findByEmail(email)
  if (existing) {
    const { password: _, ...safeUser } = existing
    const updates: Record<string, string> = {}
    if (claims.role && safeUser.role === 'user') updates.role = claims.role
    const goodName = claims.name ?? claims.nickname
    if (goodName && safeUser.name === claims.sub) updates.name = goodName

    if (Object.keys(updates).length > 0) {
      logger.info({ email, updates, action: 'auth.syncedUser' }, 'Auth0 user synced with updates')
      return updateUserByEmail(email, updates)
    }
    logger.info({ email, action: 'auth.syncedUser' }, 'Auth0 user synced (no updates)')
    return safeUser
  }

  if (!isRegistration) {
    throw createHttpError(404, 'No encontramos una cuenta con este correo. Por favor registrate primero.')
  }

  const user = await createUser({
    email,
    name: claims.name ?? claims.nickname ?? claims.sub,
    password: managedPassword,
    phone: claims.phone_number,
    role: UserRole.Client,
  })

  logger.info({ userId: user.id, email, action: 'auth.syncedUser' }, 'Auth0 user created during sync')

  return user
}
