import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Briefcase,
  AlertCircle, ArrowRight, ArrowLeft, Shield, Check,
  CreditCard, MailCheck,
} from 'lucide-react'
import { registerWorker, login } from '../services/auth'
import { useCategories } from '../hooks/useCategories'
import { getCategoryMeta } from './categoryMeta'
import { startKycVerification, confirmKycSession } from '../services/kyc'
import DiditVerificationModal from '../components/DiditVerificationModal'
import { emitAuthChange } from '../hooks/useAuth'

// min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const inputBase =
  'w-full h-10 rounded-xl border bg-white text-[13px] text-slate-900 placeholder:text-slate-400 ' +
  'outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const strengthColors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-accent']
const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']

export default function RegisterWorker() {
  const navigate = useNavigate()
  const { categories, loading: loadingCategories } = useCategories()

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

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
  const [kycMethod, setKycMethod] = useState<'automatic' | 'manual'>('automatic')
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true)
      await registerWorker({
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        categories: selected,
      })

      if (kycMethod === 'automatic') {
        try {
          const loginData = await login({ email: form.email, password: form.password })
          localStorage.setItem('token', loginData.accessToken)
          localStorage.setItem('user', JSON.stringify({ id: loginData.user.id, name: loginData.user.name, email: loginData.user.email, role: loginData.user.role, photo: loginData.user.photo ?? null }))
          emitAuthChange()

          const { sessionUrl: url } = await startKycVerification()
          setSessionUrl(url)
          setIsModalOpen(true)
          setErrors({})
          return
        } catch {
          setSubmitted(true)
        }
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr.response?.data?.error ?? 'No se pudo completar el registro'
      setErrors({ email: msg })
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalComplete = useCallback(async (sessionId: string, status: string) => {
    setIsModalOpen(false)
    setSessionUrl(null)
    const email = form.email
    if (!email) return
    try {
      await confirmKycSession(sessionId, email, status)
    } catch {
      // silent
    }
  }, [form.email])

  const handleModalCancelled = () => {
    setIsModalOpen(false)
    setSessionUrl(null)
  }

  const handleModalFailed = () => {
    setIsModalOpen(false)
    setSessionUrl(null)
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
                    <MailCheck className="w-8 h-8 text-white" />
                  </span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                {kycMethod === 'automatic'
                  ? 'Verificá tu email para continuar'
                  : '¡Verificá tu email!'}
              </h1>
              <p className="mt-3 text-slate-500">
                {kycMethod === 'automatic'
                  ? <>Antes de poder validar tu identidad con Didit, debés verificar tu correo.</>
                  : <>Te enviamos un email de verificación a{' '}
                    {form.email ? <span className="font-medium text-slate-900">{form.email}</span> : 'tu correo'}.
                    Hacé clic en el enlace para activar tu cuenta.</>}
              </p>
              <p className="mt-2 text-sm text-slate-400">Si no lo ves, revisá la carpeta de spam.</p>

              {/* KYC next step */}
              <div className="mt-6 flex gap-3 text-left bg-slate-900/5 border border-slate-900/10 rounded-xl p-4">
                <Shield className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Después de verificar</p>
                  <p className="text-slate-500 mt-1">
                    {kycMethod === 'automatic'
                      ? 'Te vamos a pedir tu DNI y una selfie para validar tu identidad automáticamente.'
                      : 'Deberás ingresar tu DNI manualmente y realizar la prueba de vida en video al iniciar sesión.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {kycMethod === 'automatic' ? 'Validar email e iniciar verificación de identidad' : 'Ir a iniciar sesión'}
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
    <>
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-5 pt-5 pb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Estás creando una</p>
                  <h1 className="text-xl font-extrabold leading-tight">Cuenta de Profesional</h1>
                </div>
              </div>
              <p className="text-[12px] text-white/70 mb-3">Recibe solicitudes y haz crecer tu negocio.</p>
              <div className="bg-white/10 -mx-5 px-5 py-2 flex items-center justify-between text-[12px]">
                <span className="text-white/70">¿Buscas contratar?</span>
                <Link to="/register"
                  className="font-semibold inline-flex items-center gap-1 transition-colors"
                  style={{ color: '#d1fae5' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6ee7b7' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#d1fae5' }}>
                  Regístrate como cliente <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${step >= s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                    {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              {/* Title */}
              <div className="text-center mb-4">
                {step === 3 ? (
                  <>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-semibold mb-1">
                      <Shield className="w-3 h-3" /> Verificación KYC
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">Elige tu método de verificación</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">Verificá tu identidad para comenzar a recibir trabajos.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-slate-900">
                      {step === 1 ? 'Ingresa tus datos' : 'Selecciona tus especialidades'}
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      {step === 1 ? 'Completa tu información personal' : 'Elige las categorías en las que te especializas'}
                    </p>
                  </>
                )}
              </div>

              {/* Step 1: Form */}
              {step === 1 && (
                <form onSubmit={handleNext} className="space-y-3">
                  {/* Nombre + Apellido */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input placeholder="Carlos" value={form.name} onChange={handleChange('name')}
                          className={`${inputBase} pl-9 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
                      </div>
                      {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1">Apellido</label>
                      <input placeholder="Rodríguez" value={form.lastName} onChange={handleChange('lastName')}
                        className={`${inputBase} px-3 ${errors.lastName ? 'border-red-400' : 'border-slate-200'}`} />
                      {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange('email')}
                        className={`${inputBase} pl-9 ${errors.email ? 'border-red-400' : 'border-slate-200'}`} />
                    </div>
                    {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" placeholder="+54 11 1234-5678" value={form.phone} onChange={handleChange('phone')}
                        className={`${inputBase} pl-9 ${errors.phone ? 'border-red-400' : 'border-slate-200'}`} />
                    </div>
                    {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Mín 8 caracteres"
                        value={form.password} onChange={handleChange('password')}
                        className={`${inputBase} pl-9 pr-9 ${errors.password ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-slate-100'}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500">Fortaleza: {strengthLabels[strength - 1] || 'Muy débil'}</p>
                      </div>
                    )}
                    {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Confirmar contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                        value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                        className={`${inputBase} pl-9 pr-9 ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200'}`} />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <button type="submit"
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-[14px]">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Categories */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {errors.categorias && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.categorias}
                      </div>
                    )}
                    {loadingCategories ? (
                      <p className="text-[12px] text-slate-500 text-center py-4">Cargando categorías…</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => {
                          const isSelected = selected.includes(cat.name)
                          const meta = getCategoryMeta(cat.name)
                          return (
                            <button key={cat.id} type="button" onClick={() => toggleCategory(cat.name)}
                              className={`relative p-2.5 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                                  <meta.Icon className={`w-4 h-4 ${meta.text}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 text-[12px] truncate">{cat.name}</p>
                                  {meta.count > 0 && <p className="text-[10px] text-slate-500">{meta.count}+ trabajos</p>}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {selected.length > 0 && (
                      <p className="text-[12px] text-emerald-600 font-medium text-center">
                        {selected.length} categoría{selected.length > 1 ? 's' : ''} seleccionada{selected.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-[13px]">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" onClick={() => { if (selected.length > 0) setStep(3) }}
                      className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px]">
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: KYC */}
              {step === 3 && (
                <div className="space-y-2.5">
                  {[
                    { key: 'automatic', icon: CreditCard, title: 'DNI + Reconocimiento Facial', desc: 'Sube fotos de tu DNI y una selfie para verificación automática.', tags: ['Rápido', 'Automático'] },
                    { key: 'manual', icon: User, title: 'DNI Manual + Prueba de Vida', desc: 'Ingresa tu DNI manualmente y completa una prueba de vida en video.', tags: ['Alternativo', 'Seguro'] },
                  ].map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setKycMethod(opt.key as 'automatic' | 'manual')}
                      className={`w-full relative p-3 rounded-xl border-2 text-left transition-all flex gap-3 ${kycMethod === opt.key ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      {kycMethod === opt.key && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${kycMethod === opt.key ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <opt.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-[13px]">{opt.title}</h3>
                        <p className="text-slate-500 text-[11px] mt-0.5">{opt.desc}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {opt.tags.map(t => (
                            <span key={t} className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                              <Check className="w-3 h-3 stroke-[3]" /> {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}

                  <div className="flex gap-2 pt-0.5">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-[13px]">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={handleFinalSubmit}
                      className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 text-[13px]">
                      {isSubmitting
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Registrando…</>
                        : <>{kycMethod === 'automatic' ? 'Iniciar verificación' : 'Continuar'} <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>

                  <button type="button" disabled={isSubmitting}
                    onClick={async () => {
                      try {
                        setIsSubmitting(true)
                        await registerWorker({
                          name: form.name, lastName: form.lastName, email: form.email,
                          password: form.password, phone: form.phone || undefined, categories: selected,
                        })
                        navigate('/login', { state: { registered: true, email: form.email } })
                      } catch (err) {
                        const axiosErr = err as { response?: { data?: { error?: string } } }
                        setErrors({ email: axiosErr.response?.data?.error ?? 'No se pudo completar el registro' })
                        setStep(1)
                      } finally { setIsSubmitting(false) }
                    }}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white text-slate-500 text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-70">
                    {isSubmitting ? 'Registrando…' : 'Omitir KYC e iniciar sesión'}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px]">
                    <Shield className="w-3 h-3" /> Integración con Didit KYC · Datos encriptados
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 info */}
          {step === 2 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/5 border border-slate-200 rounded-xl text-[12px] text-slate-600">
              <Shield className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <p>Después de crear tu cuenta, deberás verificar tu identidad.</p>
            </div>
          )}

          {/* Login link */}
          <p className="text-center text-[12px] text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Inicia sesión</Link>
          </p>
        </div>
      </main>
    </div>

    <DiditVerificationModal
      sessionUrl={sessionUrl ?? ''}
      isOpen={isModalOpen}
      onClose={() => { setIsModalOpen(false); setSessionUrl(null) }}
      onComplete={handleModalComplete}
      onCancelled={handleModalCancelled}
      onFailed={handleModalFailed}
    />
    </>
  )
}
