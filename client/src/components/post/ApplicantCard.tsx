import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Star, BadgeCheck, Briefcase, Clock, Banknote, Check, User,
  MessageCircle, UserX, UserCheck, CalendarCheck, KeyRound, CheckCircle, Flag,
} from 'lucide-react'
import ConfirmModal from '../ui/ConfirmModal'
import { acceptApplication, dismissWorker, validateStartToken } from '../../services/applications'
import { formatWhatsAppNumber } from '../../services/formatWhatsApp'

interface Applicant {
  id: string
  name: string
  photo: string | null
  category: string
  address: string
  rating: number
  reviewCount: number
  jobCount: number
  message: string | null
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  phone: string | null
  scheduledDate?: string | null
  hasReview: boolean
  /** Optional — KYC-verified worker. Falls back to false until the API exposes it. */
  verified?: boolean
  requiresStartToken?: boolean
  tokenValidatedAt?: string | null
}

interface ApplicantCardProps {
  applicant: Applicant
  applicationId: string
  applicationStatus: string
  postStatus: string
  postTitle: string
  /** Disables the hire button once someone else is already hired. */
  hireLocked?: boolean
  isEmergency?: boolean
  onHire?: () => void | Promise<void>
  onDismiss?: () => void
  onReview?: () => void
  onViewReview?: () => void
  onTokenValidated?: () => void | Promise<void>
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function formatYMD(ymd: string): string {
  const datePart = ymd.split('T')[0]
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayName = DAY_NAMES[date.getDay()]
  return `${dayName} ${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span className="a-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={i <= full ? undefined : 'off'} />
      ))}
    </span>
  )
}

function HireModal({ open, applicantName, postTitle, availableDays, timeFrom, timeTo, onConfirm, onCancel, loading }: {
  open: boolean
  applicantName: string
  postTitle: string
  availableDays: string[]
  timeFrom: string | null
  timeTo: string | null
  onConfirm: (scheduledDate: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!open) return null

  const isoDays = availableDays.filter(isISODate)

  const handleConfirm = () => {
    if (isoDays.length > 0 && !selectedDate) {
      setError('Tenés que elegir un día para confirmar la contratación.')
      return
    }
    setError('')
    onConfirm(selectedDate ?? '')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Confirmar contratación</h3>
        <p className="text-slate-500 text-sm mb-4">
          ¿Querés contratar a <strong>{applicantName}</strong> para "{postTitle}"?
        </p>

        {isoDays.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Elegí el día de la visita:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {isoDays.map((ymd) => {
                const active = selectedDate === ymd
                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => { setSelectedDate(active ? null : ymd); setError('') }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1.5px solid',
                      borderColor: active ? '#10B981' : '#CBD5E1',
                      background: active ? '#D1FAE5' : '#fff',
                      color: active ? '#065F46' : '#475569',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {formatYMD(ymd)}
                  </button>
                )
              })}
            </div>
            {timeFrom && timeTo && (
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                Horario disponible: {timeFrom} – {timeTo}
              </p>
            )}
            {error && (
              <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>{error}</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Contratando...' : 'Confirmar'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function StartTokenValidateBox({ applicationId, onValidated }: { applicationId: string; onValidated?: () => void | Promise<void> }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleValidate = async () => {
    if (loading || !/^\d{4}$/.test(code)) {
      setError('Ingresá el código de 4 dígitos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await validateStartToken(applicationId, code)
      await onValidated?.()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string; attemptsLeft?: number } } }
      const data = axiosErr.response?.data
      const left = data?.attemptsLeft
      setError(
        left === 0
          ? 'Demasiados intentos. Pedile al trabajador que genere un nuevo código.'
          : `${data?.error ?? 'No se pudo validar el código.'}${typeof left === 'number' ? ` (${left} intentos restantes)` : ''}`,
      )
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginTop: 12, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <KeyRound size={16} color="#0F172A" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Confirmar inicio del trabajo</span>
      </div>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px', lineHeight: 1.5 }}>
        Pedile al trabajador el código de 4 dígitos y validalo para confirmar que el trabajo comenzó.
      </p>
      <div className="stv-input-row" style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
          inputMode="numeric"
          placeholder="0000"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1',
            fontSize: 18, fontWeight: 700, letterSpacing: '0.25em', textAlign: 'center',
            color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums',
          }}
        />
        <button
          onClick={handleValidate}
          disabled={loading}
          style={{
            padding: '10px 18px', borderRadius: 10, border: 'none', background: '#10B981',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Validando...' : 'Validar'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#DC2626', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}

export default function ApplicantCard({
  applicant, applicationId, applicationStatus, postStatus, postTitle, hireLocked, isEmergency, onHire, onDismiss, onReview, onViewReview, onTokenValidated,
}: ApplicantCardProps) {
  const navigate = useNavigate()
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const initials = applicant.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const isHired = applicationStatus === 'Accepted' || applicationStatus === 'Completed'
  const isOut = applicationStatus === 'Dismissed'
  const canHire = postStatus === 'Active' && applicationStatus === 'Pending' && !hireLocked
  const canReviewOrView = (postStatus === 'Completed' || postStatus === 'Cancelled') && isHired && (
    (!applicant.hasReview && !!onReview) || (applicant.hasReview && !!onViewReview)
  )
  const tokenActive = postStatus !== 'Completed' && postStatus !== 'Cancelled'
  const showTokenValidate = isHired && !!applicant.requiresStartToken && !applicant.tokenValidatedAt && tokenActive
  const tokenConfirmed = isHired && !!applicant.requiresStartToken && !!applicant.tokenValidatedAt

  const handleConfirmHire = async (scheduledDate: string) => {
    setLoading(true)
    try {
      await Promise.all([
        acceptApplication(applicationId, scheduledDate || undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ])
      setHireModalOpen(false)
      onHire?.()
    } catch {
      setLoading(false)
    }
  }

  const handleEmergencyHire = async () => {
    setLoading(true)
    try {
      await acceptApplication(applicationId, undefined)
      onHire?.()
    } catch {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await dismissWorker(applicationId)
      setDismissModalOpen(false)
      onDismiss?.()
    } catch {
      setDismissing(false)
    }
  }

  return (
    <div className={`acard${isHired ? ' is-hired' : ''}${isOut ? ' is-out' : ''}`}>
      <div className="acard-top">
        <div className="avatar">
          {applicant.photo ? <img src={applicant.photo} alt={applicant.name} /> : initials}
        </div>
        <div className="a-id">
          <div className="a-name-row">
            <Link to={`/profile/worker/${applicant.id}`} className="a-name">{applicant.name}</Link>
            {applicant.verified && <span className="a-verified"><BadgeCheck size={14} />Verificado</span>}
            {isHired && <span className="a-tag a-tag--hired"><Check size={12} />Contratado</span>}
            {isOut && <span className="a-tag a-tag--out"><UserX size={12} />Despedido</span>}
          </div>
          <div className="a-trade">
            <span>{applicant.category}</span><span className="dot" /><span>{applicant.address}</span>
          </div>
          <div className="a-rep">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Stars rating={applicant.rating} />
              <span className="a-rep-num">{applicant.rating.toFixed(1)}</span>
              <span className="a-rep-sub">({applicant.reviewCount})</span>
            </span>
            <span className="a-rep-chip"><Briefcase size={14} />{applicant.jobCount} trabajos</span>
          </div>
        </div>
      </div>

      {applicant.message && (
        <div className="a-msg">"{applicant.message}"</div>
      )}

      <div className="a-chips">
        {applicant.availableDays.map((day) => (
          <span key={day} className="a-chip-day">{isISODate(day) ? formatYMD(day) : day}</span>
        ))}
        {applicant.availableTimeFrom && applicant.availableTimeTo && (
          <span className="a-chip-time"><Clock size={12} />{applicant.availableTimeFrom}–{applicant.availableTimeTo}</span>
        )}
        <span className={`a-chip-visit ${applicant.chargesVisit ? 'yes' : 'no'}`}>
          {applicant.chargesVisit ? <Banknote size={12} /> : <Check size={12} />}
          {applicant.chargesVisit
            ? `Visita $${applicant.visitCost?.toLocaleString('es-AR') ?? '-'}`
            : 'No cobra visita'}
        </span>
        {applicant.scheduledDate && isHired && (
          <span className="a-chip-scheduled"><CalendarCheck size={12} />Visita: {formatYMD(applicant.scheduledDate)}</span>
        )}
      </div>

      <div className="a-actions">
        <button className="pd-btn pd-btn--outline pd-btn--grow" onClick={() => navigate(`/profile/worker/${applicant.id}`)}>
          <User size={16} />Ver perfil
        </button>

        {isHired ? (
          <>
            {applicant.phone && (
              <button
                className="pd-btn pd-btn--whatsapp pd-btn--grow"
                onClick={() => window.open(
                  `https://wa.me/${formatWhatsAppNumber(applicant.phone!)}?text=${encodeURIComponent('Hola, te contraté en la publicación: ' + postTitle)}`,
                  '_blank',
                )}
              >
                <MessageCircle size={16} />Chatear
              </button>
            )}
            {canReviewOrView && (
              <button className="pd-btn pd-btn--accent" onClick={applicant.hasReview ? onViewReview : onReview}>
                <Star size={16} />
                {applicant.hasReview ? 'Ver reseña' : 'Calificar'}
              </button>
            )}
            {postStatus !== 'Completed' && postStatus !== 'Cancelled' && (
              <>
                <button className="pd-btn pd-btn--danger" onClick={() => setDismissModalOpen(true)}>
                  <UserX size={16} />Despedir
                </button>
                <button className="pd-btn pd-btn--outline" onClick={() => {}}>
                  <Flag size={16} />Reportar
                </button>
                <ConfirmModal
                  open={dismissModalOpen}
                  title="Despedir trabajador"
                  message={`¿Seguro que querés dar de baja a ${applicant.name} de "${postTitle}"? La publicación vuelve a estar activa y vas a poder contratar a otro trabajador.`}
                  onConfirm={handleDismiss}
                  onCancel={() => setDismissModalOpen(false)}
                  loading={dismissing}
                  danger
                />
              </>
            )}
          </>
        ) : isOut ? null : (
          <>
            <button className="pd-btn pd-btn--accent pd-btn--grow" disabled={!canHire || loading} onClick={isEmergency ? handleEmergencyHire : () => setHireModalOpen(true)}>
              {loading ? 'Contratando...' : <><UserCheck size={16} />Contratar</>}
            </button>
            {!isEmergency && (
              <HireModal
                open={hireModalOpen}
                applicantName={applicant.name}
                postTitle={postTitle}
                availableDays={applicant.availableDays}
                timeFrom={applicant.availableTimeFrom}
                timeTo={applicant.availableTimeTo}
                onConfirm={handleConfirmHire}
                onCancel={() => setHireModalOpen(false)}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {showTokenValidate && (
        <StartTokenValidateBox applicationId={applicationId} onValidated={onTokenValidated} />
      )}
      {tokenConfirmed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#059669', fontSize: 13, fontWeight: 700 }}>
          <CheckCircle size={16} />
          Inicio confirmado el {new Date(applicant.tokenValidatedAt!).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  )
}
