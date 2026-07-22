import { env } from '../lib/envConfig'
import axios from 'axios'

const api = axios.create({ baseURL: env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Extracts a user-facing message from a failed API call. The backend only
 * ever sends a safe-to-show string in `error` (see server error.middleware.ts),
 * so this never needs to fall back to raw error internals — just to `fallback`
 * when there's no response at all (network error, timeout, CORS, etc).
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (typeof data?.error === 'string' && data.error !== '') return data.error
  }
  return fallback
}

export default api
