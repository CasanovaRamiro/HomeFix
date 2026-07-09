import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  AlertCircle, ArrowRight, ArrowLeft, Check, CheckCircle2, ShieldCheck, MailCheck,
} from 'lucide-react'
import api from '../services/api'
import { loginWithGoogle } from '../lib/auth0'

type RegisterResponse = {
  userId: string
  email: string
  emailVerified: boolean
  roleAssigned: boolean
  message: string
}

const inputBase =
  'w-full h-10 rounded-xl border bg-white text-[13px] text-slate-900 placeholder:text-slate-400 ' +
  'outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const REQUIREMENTS = [
  { key: 'length', label: 'Al menos 8 caracteres' },
  { key: 'upper', label: 'Una letra mayúscula' },
  { key: 'lower', label: 'Una letra minúscula' },
  { key: 'number', label: 'Un número' },
  { key: 'special', label: 'Un carácter especial' },
] as const

export default function Register() {
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

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
  const [roleWarning, setRoleWarning] = useState('')
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
      const { data } = await api.post<RegisterResponse>('/auth/register', payload)
      if (!data.roleAssigned) setRoleWarning(data.message)
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

              {roleWarning && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[12px] text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {roleWarning}
                </div>
              )}

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
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 font-sans" style={{ position: 'fixed', inset: 0 }}>
      {/* Back button */}
      <div className="px-6 pt-4 pb-1">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </div>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0 overflow-hidden">
        <div className="w-full max-w-[520px] space-y-3">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-accent to-emerald-600 text-white px-5 pt-5 pb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Estás creando una</p>
                  <h1 className="text-xl font-extrabold leading-tight">Cuenta de Cliente</h1>
                </div>
              </div>
              <p className="text-[12px] text-white/80 mb-3">Publica trabajos y contrata profesionales verificados.</p>
              <div className="bg-white/10 -mx-5 px-5 py-2 flex items-center justify-between text-[12px]">
                <span className="text-white/70">¿Eres profesional?</span>
                <Link to="/register/worker"
                  className="font-semibold inline-flex items-center gap-1 transition-colors"
                  style={{ color: '#dbeafe' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#dbeafe' }}>
                  Regístrate como profesional <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Form */}
            <div className="px-5 py-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                {/* Nombre + Apellido */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input placeholder="María" value={form.name} onChange={set('name')} required
                        className={`${inputBase} pl-9 border-slate-200`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Apellido</label>
                    <input placeholder="González" value={form.lastName} onChange={set('lastName')}
                      className={`${inputBase} px-3 border-slate-200`} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required
                      className={`${inputBase} pl-9 border-slate-200`} />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Teléfono <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" placeholder="+54 11 1234-5678" value={form.phone} onChange={set('phone')}
                      className={`${inputBase} pl-9 border-slate-200`} />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Mín 8 caracteres"
                      value={form.password} onChange={set('password')} required
                      className={`${inputBase} pl-9 pr-9 border-slate-200`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5">
                      {REQUIREMENTS.map(req => {
                        const ok = validations[req.key]
                        return (
                          <li key={req.key} className={`flex items-center gap-1 text-[11px] ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                              <Check className="w-2 h-2" strokeWidth={3} />
                            </span>
                            {req.label}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                      value={form.confirmPassword} onChange={set('confirmPassword')} required
                      className={`${inputBase} pl-9 pr-9 ${form.confirmPassword && !passwordsMatch ? 'border-red-400' : 'border-slate-200'}`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={isSubmitting}
                  className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-[14px]">
                  {isSubmitting
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando cuenta…</>
                    : <>Crear cuenta <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">o</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google */}
              <button type="button" onClick={() => void loginWithGoogle(true)}
                className="w-full h-10 flex items-center justify-center gap-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continuar con Google
              </button>
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tus datos están protegidos y encriptados.
          </div>

          {/* Login link */}
          <p className="text-center text-[12px] text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Inicia sesión</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
