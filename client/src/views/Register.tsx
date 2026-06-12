import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  AlertCircle, ArrowRight, ArrowLeft, Check, CheckCircle2, ShieldCheck, MailCheck,
} from 'lucide-react'
import api from '../services/api'
import { useTheme } from '../hooks/useTheme'
import { loginWithGoogle } from '../lib/auth0'

type RegisterResponse = {
  userId: string
  email: string
  emailVerified: boolean
  message: string
}

const inputBase =
  'w-full h-11 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'

const REQUIREMENTS = [
  { key: 'length', label: 'Al menos 8 caracteres' },
  { key: 'upper', label: 'Una letra mayúscula' },
  { key: 'lower', label: 'Una letra minúscula' },
  { key: 'number', label: 'Un número' },
  { key: 'special', label: 'Un carácter especial' },
] as const

export default function Register() {
  const navigate = useNavigate()
  const theme = useTheme()

  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  })

  const validatePassword = (password: string) => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'password') validatePassword(value)
    if (error) setError('')
  }

  const allValid = Object.values(validations).every(Boolean)
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!allValid) {
      setError('La contraseña no cumple con todos los requisitos')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      }
      await api.post<RegisterResponse>('/auth/register', payload)
      setSubmitted(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'No se pudo completar el registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== Success view =====
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <span className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
                <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-accent/10">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-accent">
                    <MailCheck className="w-8 h-8 text-white" />
                  </span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">¡Verificá tu email!</h1>
              <p className="mt-3 text-slate-500">
                Te enviamos un email de verificación a{' '}
                {form.email ? <span className="font-medium text-slate-900">{form.email}</span> : 'tu correo'}.
                Hacé clic en el enlace del email para activar tu cuenta.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Si no lo ves, revisá la carpeta de spam.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Ir a iniciar sesión
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '16px 2rem 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: theme.muted, padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', transition: 'color 0.15s, background 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Volver
        </button>
      </div>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Unified registration card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Role identity header — emerald = Cliente */}
            <div className="bg-gradient-to-br from-accent to-emerald-600 text-white">
            <div className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">Estás creando una</p>
                <h1 className="text-2xl font-extrabold leading-tight">Cuenta de Cliente</h1>
                <p className="text-sm text-white/85 mt-0.5">Publica trabajos y contrata profesionales verificados.</p>
              </div>
            </div>
            <div className="bg-black/10 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-white/80">¿Eres profesional?</span>
              <Link to="/register/worker" className="inline-flex items-center gap-1 font-semibold text-white underline-offset-2">
                <span className="text-white/80 hover:underline">Regístrate como profesional</span> <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            </div>

            {/* Form body */}
            <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="María"
                      value={form.name}
                      onChange={set('name')}
                      required
                      className={`${inputBase} pl-10 pr-3 border-slate-200`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Apellido</label>
                  <input
                    placeholder="González"
                    value={form.lastName}
                    onChange={set('lastName')}
                    className={`${inputBase} px-3 border-slate-200`}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                    className={`${inputBase} pl-10 pr-3 border-slate-200`}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Teléfono <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+54 11 1234-5678"
                    value={form.phone}
                    onChange={set('phone')}
                    className={`${inputBase} pl-10 pr-3 border-slate-200`}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mín 8 caracteres"
                    value={form.password}
                    onChange={set('password')}
                    required
                    className={`${inputBase} pl-10 pr-10 border-slate-200`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-slate-400 hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Requirements checklist */}
                {form.password && (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                    {REQUIREMENTS.map((req) => {
                      const ok = validations[req.key]
                      return (
                        <li
                          key={req.key}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ok ? 'text-accent-hover' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                              ok ? 'bg-accent text-white' : 'bg-slate-200 text-transparent'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </span>
                          {req.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    required
                    className={`${inputBase} pl-10 pr-10 ${
                      form.confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-slate-400 hover:text-slate-900"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-accent-hover flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creando cuenta…
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">o continúa con</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={() => void loginWithGoogle(true)}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar con Google
            </button>
            </div>
          </div>

          {/* Trust note */}
          <div className="bg-slate-900/5 border border-slate-900/10 rounded-2xl p-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500">
                Tus datos están protegidos y encriptados. Nunca los compartiremos sin tu permiso.
              </p>
            </div>
          </div>

          {/* Login link */}
          <p className="text-center text-slate-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
