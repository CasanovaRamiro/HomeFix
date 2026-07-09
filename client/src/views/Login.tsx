import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react'
import api from '../services/api'
import { emitAuthChange } from '../hooks/useAuth'
import { UserRole } from '../types/user'
import { loginWithGoogle } from '../lib/auth0'
import logo from '../assets/homefix-logo.png'
import heroBg from '../assets/hero-bg.jpg'
import './auth.css'

const STATS = [
  { value: '15K+', label: 'Profesionales' },
  { value: '50K+', label: 'Trabajos' },
  { value: '4,9', label: 'Calificacion' },
]

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const googleUnregistered = searchParams.get('google') === 'unregistered'
  const registrationRoleWarning = (location.state as { roleWarning?: string } | null)?.roleWarning

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
    if (emailNotVerified) setEmailNotVerified(false)
    if (error) setError('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setEmailNotVerified(false)
    setResendSuccess('')

    try {
      setIsSubmitting(true)
      const { data } = await api.post<{
        accessToken: string
        idToken?: string
        user: { id: string; name: string; email: string; photo: string | null; role: UserRole }
      }>('/auth/login', form)
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('user', JSON.stringify({ id: data.user.id, name: data.user.name, email:data.user.email, role: data.user.role, photo: data.user.photo ?? null }))
      emitAuthChange()
      const destination = data.user.role === UserRole.Worker ? '/worker' : '/dashboard'
      setSuccess('Sesion iniciada con exito. Redirigiendo...')
      setTimeout(() => navigate(destination), 1200)
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (axiosErr.response?.status === 403) {
        setEmailNotVerified(true)
      } else {
        setError(axiosErr.response?.data?.error ?? 'Error al iniciar sesion')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendSuccess('')
    try {
      await api.post('/auth/resend-verification', { email: form.email })
      setResendSuccess('Email reenviado. Revisá tu bandeja de entrada.')
    } catch {
      setResendSuccess('No se pudo reenviar. Intentá de nuevo más tarde.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="au-root">
      <main className="au-shell">
        {/* ===== LEFT — form ===== */}
        <section className="au-panel">
          <div className="au-form-wrap">
            <Link to="/" className="au-back">
              <ArrowLeft /> Volver al inicio
            </Link>

            <Link to="/">
              <img className="au-logo" src={logo} alt="HomeFix" />
            </Link>

            <div className="au-head">
              <h1>Bienvenido de vuelta</h1>
              <p>Ingresa tus credenciales para acceder a tu cuenta</p>
            </div>

            {registrationRoleWarning != null && registrationRoleWarning !== '' && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{registrationRoleWarning}</span>
              </div>
            )}
            {error && (
              <div className="au-error"><AlertCircle /> {error}</div>
            )}
            {success && (
              <div className="au-success"><CheckCircle2 /> {success}</div>
            )}
            {emailNotVerified && (
              <div className="flex flex-col gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Debés verificar tu correo antes de iniciar sesión. Revisá tu bandeja de entrada
                    {form.email ? <> en <strong>{form.email}</strong></> : null}.
                  </span>
                </div>
                {resendSuccess ? (
                  <p className="text-xs text-amber-700 pl-6">{resendSuccess}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResendVerification()}
                    disabled={resendLoading || !form.email}
                    className="self-start ml-6 text-xs font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                  >
                    {resendLoading ? 'Reenviando…' : 'Reenviar email de verificación'}
                  </button>
                )}
              </div>
            )}

            <form className="au-form" onSubmit={handleSubmit} noValidate>
              <div className="au-field">
                <label htmlFor="email">Correo electronico</label>
                <div className="au-input-wrap">
                  <Mail className="au-lead" />
                  <input
                    className="au-input"
                    type="email"
                    id="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
              </div>

              <div className="au-field">
                <div className="au-label-row">
                  <label htmlFor="password">Contrasena</label>
                  <Link to="/forgot-password" className="au-forgot">Olvidaste tu contrasena?</Link>
                </div>
                <div className="au-input-wrap">
                  <Lock className="au-lead" />
                  <input
                    className="au-input au-has-eye"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Tu contrasena"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button
                    type="button"
                    className="au-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="au-btn-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="au-spinner" /> Iniciando sesion...
                  </>
                ) : (
                  <>
                    Iniciar Sesion <ArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="au-divider"><span>o</span></div>

            <button
              type="button"
              className="au-btn-google"
              onClick={() => void loginWithGoogle()}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar con Google
            </button>

            {googleUnregistered && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                <span>
                  Este correo de Google no está registrado.{' '}
                  <Link to="/register" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                    Registrate gratis
                  </Link>{' '}
                  para continuar.
                </span>
              </div>
            )}

            <p className="au-register" style={{ marginTop: '20px' }}>
              No tienes una cuenta? <Link to="/register">Registrate gratis</Link>
            </p>

          
          </div>
        </section>

        {/* ===== RIGHT — visual ===== */}
        <aside className="au-visual">
          <img className="au-visual-img" src={heroBg} alt="Profesional de HomeFix" />
          <div className="au-visual-tint" />

          <div className="au-visual-content">
            <span className="au-secure-badge">
              <Shield /> Plataforma 100% Segura
            </span>

            <div className="au-visual-mid">
              <h2>Tu hogar merece las mejores manos</h2>
              <p className="au-vsub">
                Conectamos a mas de 15.000 profesionales verificados con familias que buscan
                soluciones confiables para su hogar.
              </p>

              <div className="au-stats">
                {STATS.map((s) => (
                  <div className="au-stat" key={s.label}>
                    <div className="au-stat-num">{s.value}</div>
                    <div className="au-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="au-testimonial">
              <p className="au-testimonial-quote">
                &ldquo;Encontre un electricista verificado en minutos. El proceso fue simple y el
                trabajo impecable.&rdquo;
              </p>
              <div className="au-testimonial-by">
                <span className="au-testimonial-avatar"><CheckCircle2 /></span>
                <div>
                  <div className="au-testimonial-name">Maria Gonzalez</div>
                  <div className="au-testimonial-role">Cliente verificado</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
