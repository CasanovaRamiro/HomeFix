import { env } from '../lib/envConfig'
import axios from 'axios'
import { AUTH_RETURN_PATH_KEY, clearAuth } from '../hooks/useAuth'

const api = axios.create({ baseURL: env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/register/worker', '/auth/resend-verification', '/auth/forgot-password']

function isPublicAuthRequest(url: string | undefined): boolean {
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url === endpoint || url?.startsWith(`${endpoint}?`))
}

function getRequestToken(config: { headers?: Record<string, unknown>; url?: string }): string | null {
  const value = config.headers?.Authorization ?? config.headers?.authorization
  return typeof value === 'string' && value.startsWith('Bearer ') ? value.slice(7) : null
}

export function shouldInvalidateSession(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) return false
  if (isPublicAuthRequest(error.config.url)) return false
  const requestToken = getRequestToken(error.config)
  return requestToken !== null && requestToken === localStorage.getItem('token')
}

export function handleAuthResponseError(error: unknown): Promise<never> {
  if (shouldInvalidateSession(error)) {
    const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (returnPath !== '/login' && !returnPath.startsWith('/auth/')) {
      sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath)
    }
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login?expired=1')
    }
  }
  return Promise.reject(error instanceof Error ? error : new Error('Request failed'))
}

api.interceptors.response.use(
  (response) => response,
  handleAuthResponseError,
)

export default api
