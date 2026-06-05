import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCodeForTokens } from '../lib/auth0'
import { emitAuthChange } from '../hooks/useAuth'
import api from '../services/api'
import { UserRole } from '../types/user'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')

    if (errorParam) {
      setError(decodeURIComponent(errorDescription ?? errorParam))
      return
    }

    if (!code) {
      setError('No se recibió código de autorización de Google.')
      return
    }

    ;(async () => {
      try {
        const tokens = await exchangeCodeForTokens(code)

        const { data: user } = await api.get<{
          id: string
          name: string
          email: string
          role: string
        }>('/auth/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })

        localStorage.setItem('token', tokens.access_token)
        localStorage.setItem('user', JSON.stringify({ id: user.id, name: user.name, role: user.role }))
        emitAuthChange()

        navigate(user.role === UserRole.Worker ? '/worker' : '/dashboard', { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
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
