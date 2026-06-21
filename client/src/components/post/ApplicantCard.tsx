import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StarRating from '../ui/StarRating'
import ConfirmModal from '../ui/ConfirmModal'
import { acceptApplication, dismissWorker } from '../../services/applications'
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
}

interface ApplicantCardProps {
  applicant: Applicant
  applicationId: string
  applicationStatus: string
  postStatus: string
  postTitle: string
  onHire?: () => void
  onDismiss?: () => void
  onReview?: () => void
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

export default function ApplicantCard({ applicant, applicationId, applicationStatus, postStatus, postTitle, onHire, onDismiss, onReview }: ApplicantCardProps) {
  const navigate = useNavigate()
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const initials = applicant.name.split(' ').map((n) => n[0]).join('')

  const isoDays = applicant.availableDays.filter(isISODate)
  const legacyDays = applicant.availableDays.filter((d) => !isISODate(d))

  const canHire = postStatus === 'Active' && applicationStatus === 'Pending'

  const handleConfirmHire = async (scheduledDate: string) => {
    setLoading(true)
    try {
      await acceptApplication(applicationId, scheduledDate || undefined)
      setHireModalOpen(false)
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

  const renderAction = () => {
    if (applicationStatus === 'Accepted' || applicationStatus === 'Completed') {
      const canReview = (postStatus === 'Completed' || postStatus === 'Cancelled') && onReview && !applicant.hasReview
      return (
        <>
          <span className="text-green-700 bg-green-100 px-3 py-1 rounded text-sm font-medium">Contratado</span>
          {applicant.phone && (
            <button
              onClick={() => window.open(
                `https://api.whatsapp.com/send?phone=${formatWhatsAppNumber(applicant.phone!)}&text=${encodeURIComponent('Hola, te contraté en la publicación: ' + postTitle)}`,
                '_blank'
              )}
              className="btn-outline"
            >
              Chatear
            </button>
          )}
          {canReview && (
            <button
              onClick={onReview}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Calificar
            </button>
          )}
          {postStatus !== 'Completed' && postStatus !== 'Cancelled' && (
            <>
              <button
                onClick={() => setDismissModalOpen(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors"
              >
                Despedir
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
      )
    }
    if (applicationStatus === 'Rejected') return null
    if ((postStatus === 'Completed' || postStatus === 'Cancelled') && applicationStatus === 'Pending') return null
    if (applicationStatus === 'Dismissed') {
      return <span className="text-red-700 bg-red-100 px-3 py-1 rounded text-sm font-medium">Despedido</span>
    }

    return (
      <>
        <button
          onClick={() => setHireModalOpen(true)}
          disabled={!canHire}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${canHire ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Contratar
        </button>
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
      </>
    )
  }

  return (
    <div className="applicant-card">
      <div className="avatar">
        {applicant.photo ? (
          <img src={applicant.photo} alt={applicant.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          initials
        )}
      </div>
      <div className="info">
        <Link to={`/profile/worker/${applicant.id}`} className="font-medium hover:text-blue-600 transition-colors">
          {applicant.name}
        </Link>
        <div className="meta">{applicant.category} — {applicant.address}</div>
        <div className="stats">
          <StarRating rating={applicant.rating} count={applicant.reviewCount} />
          {' · '}{applicant.jobCount} trabajos
        </div>
        {applicant.message && (
          <p style={{ fontSize: 13, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>
            "{applicant.message}"
          </p>
        )}

        {isoDays.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Días disponibles:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {isoDays.map((ymd) => (
                <span key={ymd} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#D1FAE5', color: '#065F46' }}>
                  {formatYMD(ymd)}
                </span>
              ))}
              {applicant.availableTimeFrom && applicant.availableTimeTo && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#F1F5F9', color: '#475569' }}>
                  {applicant.availableTimeFrom} – {applicant.availableTimeTo}
                </span>
              )}
            </div>
          </div>
        )}

        {legacyDays.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {legacyDays.map((day) => (
              <span key={day} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#D1FAE5', color: '#065F46' }}>
                {day}
              </span>
            ))}
            {applicant.availableTimeFrom && applicant.availableTimeTo && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#F1F5F9', color: '#475569' }}>
                {applicant.availableTimeFrom} – {applicant.availableTimeTo}
              </span>
            )}
          </div>
        )}

        {applicant.scheduledDate && (applicationStatus === 'Accepted' || applicationStatus === 'Completed') && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>
              Visita pactada: {formatYMD(applicant.scheduledDate)}
            </span>
          </div>
        )}
        <p style={{ fontSize: 12, color: applicant.chargesVisit ? '#92400E' : '#6B7280', marginTop: 4 }}>
          {applicant.chargesVisit
            ? `Cobra visita: $${applicant.visitCost?.toLocaleString('es-AR') ?? '-'}`
            : 'No cobra visita'}
        </p>
      </div>
      <div className="actions">
        <button className="btn-outline" onClick={() => navigate(`/profile/worker/${applicant.id}`)}>Ver perfil</button>
        {renderAction()}
      </div>
    </div>
  )
}
