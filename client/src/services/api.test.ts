import { beforeEach, describe, expect, it } from 'vitest'
import { getSafeReturnPath } from '../hooks/useAuth'
import { handleAuthResponseError, shouldInvalidateSession } from './api'

function authError(status: number, token = 'current-token', url = '/posts') {
  const error = new Error(`HTTP ${status}`) as Error & {
    isAxiosError: boolean
    response: { status: number }
    config: { url: string; headers: { Authorization: string } }
  }
  error.isAxiosError = true
  error.response = { status }
  error.config = { url, headers: { Authorization: `Bearer ${token}` } }
  return error
}

describe('API session expiration handling', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.pushState({}, '', '/login')
  })

  it('invalidates a matching authenticated token on 401 without retrying', async () => {
    localStorage.setItem('token', 'current-token')
    const error = authError(401)

    expect(shouldInvalidateSession(error)).toBe(true)
    await expect(handleAuthResponseError(error)).rejects.toBe(error)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('does not invalidate public, forbidden, network, or stale-token failures', async () => {
    localStorage.setItem('token', 'new-token')

    expect(shouldInvalidateSession(authError(401, 'new-token', '/auth/login'))).toBe(false)
    expect(shouldInvalidateSession(authError(403, 'new-token'))).toBe(false)
    expect(shouldInvalidateSession(new Error('Network error'))).toBe(false)
    expect(shouldInvalidateSession(authError(401, 'old-token'))).toBe(false)

    await expect(handleAuthResponseError(authError(401, 'old-token'))).rejects.toBeInstanceOf(Error)
    expect(localStorage.getItem('token')).toBe('new-token')
  })

  it('accepts only safe internal return paths', () => {
    expect(getSafeReturnPath('/dashboard?tab=history')).toBe('/dashboard?tab=history')
    expect(getSafeReturnPath('https://evil.example')).toBeNull()
    expect(getSafeReturnPath('//evil.example')).toBeNull()
    expect(getSafeReturnPath('/login')).toBeNull()
    expect(getSafeReturnPath('/auth/callback')).toBeNull()
  })
})
