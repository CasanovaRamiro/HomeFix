import { findByEmail, createUser } from '../data/user.data.js'

interface Auth0Claims {
  sub?: string
  email?: string
  name?: string
  nickname?: string
  phone_number?: string
}

const managedPassword = 'AUTH0_MANAGED_ACCOUNT'

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
