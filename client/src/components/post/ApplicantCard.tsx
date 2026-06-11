import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StarRating from '../ui/StarRating'
import ConfirmModal from '../ui/ConfirmModal'
import { acceptApplication } from '../../services/applications'

interface Applicant {
  id: string
  name: string
  photo: string | null
  category: string
  address: string
  rating: number
  reviewCount: number
  jobCount: number
}

interface ApplicantCardProps {
  applicant: Applicant
  applicationId: string
  applicationStatus: string
  postStatus: string
  postTitle: string
  onHire?: () => void
}

export default function ApplicantCard({ applicant, applicationId, applicationStatus, postStatus, postTitle, onHire }: ApplicantCardProps) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const renderAction = () => {
    if (applicationStatus === 'Accepted') {
      return <span className="text-green-700 bg-green-100 px-3 py-1 rounded text-sm font-medium">Contratado</span>
    }
    if (applicationStatus === 'Rejected') return null

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
      </div>
      <div className="actions">
        <button className="btn-outline" onClick={() => navigate(`/profile/worker/${applicant.id}`)}>Ver perfil</button>
        <button className="btn-outline">Chatear</button>
        {renderAction()}
      </div>
    </div>
  )
}