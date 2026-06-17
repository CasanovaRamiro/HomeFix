import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { exchangeCodeForTokens } from '../lib/auth0'
import { emitAuthChange } from '../hooks/useAuth'
import api from '../services/api'
import { UserRole } from '../types/user'

function getInitialError(): string {
  const params = new URLSearchParams(window.location.search)
  const errorParam = params.get('error')
  if (!errorParam || errorParam === 'access_denied') return ''
  const errorDescription = params.get('error_description')
  return decodeURIComponent(errorDescription ?? errorParam)
}

function getCode(): string | null {
  const params = new URLSearchParams(window.location.search)
  const errorParam = params.get('error')
  if (errorParam) return null
  const code = params.get('code')
  if (!code) return null
  return code
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>(() => {
    const urlError = getInitialError()
    if (urlError) return urlError
    if (!getCode()) return 'No se recibió código de autorización de Google.'
    return ''
  })
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')

    if (errorParam) {
      if (errorParam === 'access_denied') {
        const isRegister = sessionStorage.getItem('pkce_register') === '1'
        sessionStorage.removeItem('pkce_register')
        sessionStorage.removeItem('pkce_verifier')
        navigate(isRegister ? '/register' : '/login', { replace: true })
      }
      return
    }

    const code = params.get('code')
    if (!code) return

    ;(async () => {
      try {
        const tokens = await exchangeCodeForTokens(code)

        const isRegister = sessionStorage.getItem('pkce_register') === '1'
        sessionStorage.removeItem('pkce_register')

        const headers: Record<string, string> = {
          Authorization: `Bearer ${tokens.access_token}`,
        }
        if (isRegister) headers['x-auth-source'] = 'register'

        const { data: user } = await api.get<{
          id: string
          name: string
          email: string
          photo: string | null
          role: string
        }>('/auth/me', { headers })

        localStorage.setItem('token', tokens.access_token)
        localStorage.setItem('user', JSON.stringify({ id: user.id, name: user.name, email: user.email,role: user.role, photo: user.photo ?? null }))
        emitAuthChange()

        navigate(user.role === UserRole.Worker ? '/worker' : '/dashboard', { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          navigate('/login?google=unregistered', { replace: true })
          return
        }
        setError('No se pudo completar el inicio de sesión con Google. Intenta de nuevo.')
      }
    })()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 p-8">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Completando inicio de sesión con Google…</p>
      </div>
    </div>
  )
}
