import { useState, useEffect } from 'react'
import type { StoredUser } from '../types/user'

interface AuthState {
  user: StoredUser | null
  isLoggedIn: boolean
}

export const AUTH_RETURN_PATH_KEY = 'homefix_auth_return_path'

export function getSafeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value === '/login' || value.startsWith('/auth/')) {
    return null
  }
  return value
}

export function consumeAuthReturnPath(): string | null {
  const path = getSafeReturnPath(sessionStorage.getItem(AUTH_RETURN_PATH_KEY))
  sessionStorage.removeItem(AUTH_RETURN_PATH_KEY)
  return path
}

function readAuth(): AuthState {
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

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(readAuth)

  useEffect(() => {
    const handler = () => setState(readAuth())
    window.addEventListener('auth-change', handler)
    return () => window.removeEventListener('auth-change', handler)
  }, [])

  return state
}

export function emitAuthChange() {
  window.dispatchEvent(new Event('auth-change'))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  emitAuthChange()
}
