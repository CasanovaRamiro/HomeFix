import { useState, useEffect } from 'react'
import type { StoredUser } from '../types/user'

interface AuthState {
  user: StoredUser | null
  isLoggedIn: boolean
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
