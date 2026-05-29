import type { StoredUser } from '../types/user'

interface AuthState {
  user: StoredUser | null
  isLoggedIn: boolean
}

export function useAuth(): AuthState {
  const token = localStorage.getItem('token')
  if (!token) return { user: null, isLoggedIn: false }
  try {
    const raw = localStorage.getItem('user')
    const user = raw ? (JSON.parse(raw) as StoredUser) : null
    return { user, isLoggedIn: user !== null }
  } catch {
    return { user: null, isLoggedIn: false }
  }
}
