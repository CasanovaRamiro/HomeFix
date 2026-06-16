import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  FileCheck,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import { startKycVerification, confirmKycSession, fetchKycStatus } from '../services/kyc'
import { useAuth } from '../hooks/useAuth'
import DiditVerificationModal from '../components/DiditVerificationModal'

type ViewState = 'idle' | 'loading' | 'error'

type Tone = 'success' | 'review' | 'declined' | 'unknown'

interface StatusCopy {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  description: string
}

const STATUS_COPY: Record<string, StatusCopy> = {
  Approved: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Identidad validada',
    description:
      'Tu verificación fue aprobada. Ya podés empezar a recibir trabajos.',
  },
  'In Review': {
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Verificación en revisión',
    description:
      'Tu validación está siendo revisada. Te avisaremos por mail cuando se confirme en tu cuenta.',
  },
  IN_REVIEW: {
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Verificación en revisión',
    description:
      'Tu validación está siendo revisada. Te avisaremos por mail cuando se confirme en tu cuenta.',
  },
  NOT_STARTED: {
    icon: Clock,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: 'Verificación pendiente',
    description:
      'Aún no iniciaste la verificación de identidad. Hacelo cuando quieras desde el botón de abajo.',
  },
  Declined: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'No pudimos validar tu identidad',
    description: 'Podés volver a intentarlo desde el botón de abajo.',
  },
  Expired: {
    icon: XCircle,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: 'La verificación expiró',
    description: 'Volvé a iniciar el proceso para validarte cuando quieras.',
  },
  Abandoned: {
    icon: Clock,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: 'Verificación incompleta',
    description: 'No completaste el proceso. Retomalo cuando quieras desde el botón de abajo.',
  },
}

const DEFAULT_COPY: StatusCopy = {
  icon: Clock,
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-600',
  title: 'Verificación recibida',
  description:
    'Estamos procesando tu validación. Te avisaremos por mail cuando se confirme en tu cuenta.',
}

function resolveStatusCopy(rawStatus: string | null): StatusCopy {
  if (!rawStatus) return DEFAULT_COPY
  const match = Object.keys(STATUS_COPY).find((k) => k.toLowerCase() === rawStatus.toLowerCase())
  return match ? STATUS_COPY[match] : DEFAULT_COPY
}

const TONE_BADGE: Record<Tone, { label: string; bg: string; color: string }> = {
  success:  { label: 'Aprobada',   bg: 'bg-emerald-50', color: 'text-emerald-700' },
  review:   { label: 'En revisión', bg: 'bg-amber-50',   color: 'text-amber-700' },
  declined: { label: 'Rechazada',   bg: 'bg-red-50',      color: 'text-red-700' },
  unknown:  { label: 'Recibida',    bg: 'bg-slate-50',    color: 'text-slate-700' },
}

function toneForStatus(rawStatus: string | null): Tone {
  if (!rawStatus) return 'unknown'
  const match = Object.keys(STATUS_COPY).find((k) => k.toLowerCase() === rawStatus.toLowerCase())
  if (!match) return 'unknown'
  const c = STATUS_COPY[match]
  if (c.iconBg.includes('emerald')) return 'success'
  if (c.iconBg.includes('amber')) return 'review'
  if (c.iconBg.includes('red')) return 'declined'
  return 'unknown'
}

function StatusScreen({
  displayStatus,
  onRetry,
  retryLabel,
}: {
  displayStatus: string
  onRetry?: () => void
  retryLabel?: string
}) {
  const copy = resolveStatusCopy(displayStatus)
  const tone = toneForStatus(displayStatus)
  const badge = TONE_BADGE[tone]
  const Icon = copy.icon
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="max-w-md w-full space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className={`mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center ${copy.iconBg}`}>
            <Icon className={`w-8 h-8 ${copy.iconColor}`} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{copy.title}</h1>
          <p className="mt-3 text-slate-500">{copy.description}</p>
          <span className={`mt-4 inline-block text-xs font-semibold px-3 py-1 rounded-full ${badge.bg} ${badge.color}`}>
            {badge.label}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex items-center justify-center gap-2 w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {retryLabel ?? 'Reintentar'}
            </button>
          )}
          <Link
            to="/worker"
            className="mt-3 inline-flex items-center justify-center gap-2 w-full h-12 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors"
          >
            Volver a mi panel
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function KycVerify() {
  const [state, setState] = useState<ViewState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.email) {
      queueMicrotask(() => setCheckingStatus(false))
      return
    }

    let cancelled = false
    fetchKycStatus()
      .then((res) => {
        if (!cancelled) setCurrentStatus(res.kycStatus)
      })
      .catch(() => {
        if (!cancelled) setCurrentStatus(null)
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!currentStatus || currentStatus === 'NOT_STARTED') return

    const interval = setInterval(() => {
      fetchKycStatus()
        .then((res) => {
          if (res.kycStatus !== currentStatus) {
            console.log(`[KYC] Status cambió: ${currentStatus} → ${res.kycStatus}`)
            setCurrentStatus(res.kycStatus)
          }
        })
        .catch(() => {})
    }, 10_000)

    return () => clearInterval(interval)
  }, [currentStatus])

  const handleStart = async () => {
    setState('loading')
    setErrorMessage('')
    try {
      const { sessionUrl: url } = await startKycVerification()
      setSessionUrl(url)
      setIsModalOpen(true)
      setState('idle')
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error ?? 'No se pudo iniciar la verificación')
      setState('error')
    }
  }

  const handleRetry = async () => {
    setCurrentStatus(null)
    await handleStart()
  }

  const handleModalComplete = useCallback(async (sessionId: string, status: string) => {
    setIsModalOpen(false)
    setSessionUrl(null)
    const email = user?.email
    if (!email) {
      setErrorMessage('No se pudo identificar tu usuario')
      setState('error')
      return
    }
    try {
      const res = await confirmKycSession(sessionId, email, status)
      setCurrentStatus(res.status)
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error ?? 'Error al confirmar la verificación')
      setState('error')
    }
  }, [user?.email])

  const handleModalCancelled = () => {
    setIsModalOpen(false)
    setSessionUrl(null)
  }

  const handleModalFailed = (error: { message: string }) => {
    setIsModalOpen(false)
    setSessionUrl(null)
    setErrorMessage(error.message)
    setState('error')
  }

  const isLoading = state === 'loading'

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
        <div className="max-w-md w-full space-y-4 text-center">
          <Loader2 className="mx-auto w-10 h-10 animate-spin text-slate-400" />
          <p className="text-slate-500">Cargando…</p>
        </div>
      </div>
    )
  }

  if (currentStatus && currentStatus !== 'NOT_STARTED') {
    const canRetry = currentStatus === 'DECLINED' || currentStatus === 'EXPIRED'
    return (
      <>
        <StatusScreen
          displayStatus={currentStatus}
          onRetry={canRetry ? handleRetry : undefined}
          retryLabel="Iniciar nueva verificación"
        />
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

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
        <div className="max-w-md w-full space-y-4">
          <Link
            to="/worker"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mi panel
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/5 flex items-center justify-center mb-5">
                <Shield className="w-8 h-8 text-slate-900" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Verificá tu identidad</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-sm">
                Para empezar a recibir trabajos necesitamos validar tu identidad con tu documento y una selfie.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              <Feature icon={FileCheck} label="Vas a subir tu documento (DNI, pasaporte o licencia)" />
              <Feature icon={Shield} label="Te vamos a pedir una selfie para confirmar que sos vos" />
              <Feature icon={CheckCircle2} label="El proceso completo tarda menos de 2 minutos" />
            </ul>

            {state === 'error' && (
              <div className="mt-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={isLoading}
              className="mt-6 w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando verificación…
                </>
              ) : (
                'Iniciar verificación'
              )}
            </button>

            <p className="mt-4 text-xs text-center text-slate-400">
              La verificación se realiza dentro de la app a través de Didit, nuestro proveedor de identidad.
            </p>
          </div>
        </div>
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

function Feature({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-600">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-700" />
      </div>
      <span className="pt-0.5">{label}</span>
    </li>
  )
}
