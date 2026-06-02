import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Briefcase,
  AlertCircle, ArrowRight, ArrowLeft, Shield, Check, CheckCircle2,
} from 'lucide-react'
import api from '../services/api'
import { useTheme } from '../hooks/useTheme'
import { useCategories } from '../hooks/useCategories'
import { getCategoryMeta } from './categoryMeta'

type RegisterResponse = {
  userId: string
  email: string
  emailVerified: boolean
  message: string
}

// min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const inputBase =
  'w-full h-11 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'

const strengthColors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-accent']
const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']

export default function RegisterWorker() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { categories, loading: loadingCategories } = useCategories()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [selected, setSelected] = useState<string[]>([])

  const handleChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleCategory = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
    if (errors.categorias) setErrors((prev) => ({ ...prev, categorias: '' }))
  }

  const passwordStrength = () => {
    const p = form.password
    let s = 0
    if (p.length >= 8) s++
    if (/[a-z]/.test(p)) s++
    if (/[A-Z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z\d]/.test(p)) s++
    return s
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'El nombre es requerido'
    if (!form.lastName.trim()) e.lastName = 'El apellido es requerido'
    if (!form.email.trim()) e.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (!form.phone.trim()) e.phone = 'El teléfono es requerido'
    else if (!/^\d{10,}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Teléfono inválido (mín 10 dígitos)'
    if (!form.password) e.password = 'La contraseña es requerida'
    else if (!passwordRegex.test(form.password)) e.password = 'Mín 8 caracteres, mayúscula, minúscula, número y símbolo'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (selected.length === 0) {
      setErrors({ categorias: 'Debes seleccionar al menos una categoría' })
      return
    }
    try {
      setIsSubmitting(true)
      const { data } = await api.post<RegisterResponse>('/auth/register/worker', {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        categories: selected,
      })
      setErrors({})
      // Cuenta creada — mostrar pantalla de éxito.
      void data
      setSubmitted(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr.response?.data?.error ?? 'No se pudo completar el registro'
      setErrors({ email: msg })
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const strength = passwordStrength()

  // ===== Success view (after the account is created) =====
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              {/* Animated check */}
              <div className="relative mx-auto mb-6 w-20 h-20">
                <span className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
                <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-accent/10">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-accent">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">¡Cuenta creada con éxito!</h1>
              <p className="mt-3 text-slate-500">
                Tu cuenta de profesional fue creada correctamente
                {form.email ? <> para <span className="font-medium text-slate-900">{form.email}</span></> : null}.
                Ya puedes iniciar sesión.
              </p>

              {/* KYC next step */}
              <div className="mt-6 flex gap-3 text-left bg-slate-900/5 border border-slate-900/10 rounded-xl p-4">
                <Shield className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Siguiente paso: verifica tu identidad</p>
                  <p className="text-slate-500 mt-1">
                    Para empezar a recibir trabajos deberás completar la verificación de identidad desde tu panel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Ir a iniciar sesión
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-slate-500 text-sm">
              ¿Necesitas ayuda?{' '}
              <Link to="/" className="text-accent hover:text-accent-hover font-semibold">
                Vuelve al inicio
              </Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <div style={{ padding: '20px 24px 0' }}>
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
            {/* Role identity header — navy = Profesional */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Estás creando una</p>
                <h1 className="text-2xl font-extrabold leading-tight">Cuenta de Profesional</h1>
                <p className="text-sm text-white/75 mt-0.5">Recibe solicitudes y haz crecer tu negocio.</p>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-white/70">¿Buscas contratar?</span>
              <Link to="/register" className="inline-flex items-center gap-1 font-semibold text-white underline-offset-2 ">
                <span className="text-white/70 hover:underline">Regístrate como cliente</span> <ArrowRight className="w-4 h-4 text-accent" />
              </Link>
            </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
            {/* Progress */}
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-accent' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Datos personales</span>
            </div>
            <div className={`w-12 h-0.5 ${step > 1 ? 'bg-accent' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-accent' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Especialidades</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {step === 1 ? 'Ingresa tus datos' : 'Selecciona tus especialidades'}
            </h1>
            <p className="text-slate-500">
              {step === 1
                ? 'Completa tu información personal para crear tu cuenta'
                : 'Elige las categorías en las que te especializas'}
            </p>
          </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <>
                  {/* Nombre + Apellido */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          placeholder="Carlos"
                          value={form.name}
                          onChange={handleChange('name')}
                          className={`${inputBase} pl-10 pr-3 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900">Apellido</label>
                      <input
                        placeholder="Rodríguez"
                        value={form.lastName}
                        onChange={handleChange('lastName')}
                        className={`${inputBase} px-3 ${errors.lastName ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
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
                        onChange={handleChange('email')}
                        className={`${inputBase} pl-10 pr-3 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="+54 11 1234-5678"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        className={`${inputBase} pl-10 pr-3 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
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
                        onChange={handleChange('password')}
                        className={`${inputBase} pl-10 pr-10 ${errors.password ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-slate-400 hover:text-slate-900"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-slate-100'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Fortaleza: {strengthLabels[strength - 1] || 'Muy débil'}
                        </p>
                      </div>
                    )}
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
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
                        onChange={handleChange('confirmPassword')}
                        className={`${inputBase} pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-slate-400 hover:text-slate-900"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  {/* Categories */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                      Selecciona una o más categorías donde ofreces tus servicios:
                    </p>

                    {errors.categorias && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{errors.categorias}</p>
                      </div>
                    )}

                    {loadingCategories ? (
                      <p className="text-sm text-slate-500">Cargando categorías…</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat) => {
                          const isSelected = selected.includes(cat.name)
                          const meta = getCategoryMeta(cat.name)
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.name)}
                              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                                  <meta.Icon className={`w-5 h-5 ${meta.text}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{cat.name}</p>
                                  {meta.count > 0 && <p className="text-xs text-slate-500">{meta.count}+ trabajos</p>}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {selected.length > 0 && (
                      <p className="text-sm text-accent font-medium">
                        {selected.length} categoría{selected.length > 1 ? 's' : ''} seleccionada{selected.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Creando…
                        </>
                      ) : (
                        <>
                          Crear cuenta
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
            </div>
          </div>

          {/* Step 2 info */}
          {step === 2 && (
            <div className="bg-slate-900/5 border border-slate-900/10 rounded-2xl p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Verificación requerida</p>
                  <p className="text-slate-500 mt-1">
                    Después de crear tu cuenta, deberás verificar tu identidad para comenzar a recibir trabajos.
                  </p>
                </div>
              </div>
            </div>
          )}

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
