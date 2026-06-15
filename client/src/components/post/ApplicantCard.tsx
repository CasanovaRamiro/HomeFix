import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StarRating from '../ui/StarRating'
import ConfirmModal from '../ui/ConfirmModal'
import { acceptApplication, dismissWorker } from '../../services/applications'

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
}

interface ApplicantCardProps {
  applicant: Applicant
  applicationId: string
  applicationStatus: string
  postStatus: string
  postTitle: string
  onHire?: () => void
  onDismiss?: () => void
}

export default function ApplicantCard({ applicant, applicationId, applicationStatus, postStatus, postTitle, onHire, onDismiss }: ApplicantCardProps) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const initials = applicant.name.split(' ').map((n) => n[0]).join('')

  const canHire = postStatus === 'Active' && applicationStatus === 'Pending'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await acceptApplication(applicationId)
      setModalOpen(false)
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
    if (applicationStatus === 'Accepted') {
      return (
        <>
          <span className="text-green-700 bg-green-100 px-3 py-1 rounded text-sm font-medium">Contratado</span>
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
          />
        </>
      )
    }
    if (applicationStatus === 'Rejected') return null
    if (applicationStatus === 'Dismissed') {
      return <span className="text-red-700 bg-red-100 px-3 py-1 rounded text-sm font-medium">Despedido</span>
    }

    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          disabled={!canHire}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
            canHire
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Contratar
        </button>
        <ConfirmModal
          open={modalOpen}
          title="Confirmar contratación"
          message={`¿Estás seguro de que querés contratar a ${applicant.name} para "${postTitle}"?`}
          onConfirm={handleConfirm}
          onCancel={() => setModalOpen(false)}
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
        {applicant.availableDays.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {applicant.availableDays.map((day) => (
              <span key={day} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#D1FAE5', color: '#065F46' }}>
                {day}
              </span>
            ))}
            {applicant.availableTimeFrom && applicant.availableTimeTo && (
              <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 12, background: '#F1F5F9', color: '#475569' }}>
                {applicant.availableTimeFrom} – {applicant.availableTimeTo}
              </span>
            )}
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
        <button className="btn-outline">Chatear</button>
        {renderAction()}
      </div>
    </div>
  )
}