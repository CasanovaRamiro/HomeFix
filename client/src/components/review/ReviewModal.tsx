import { useState } from 'react'
import { Star } from 'lucide-react'
import { useLeaveClientReview } from '../../hooks/useLeaveClientReview'
import ReviewStarRating from './ReviewStarRating'

interface ReviewModalProps {
  applicationId: string
  clientName: string
  onClose: () => void
  onSuccess: () => void
}

export default function ReviewModal({
  applicationId,
  clientName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { submitting, submitted, error, submit } = useLeaveClientReview()
  const [rating, setRating] = useState(0)
  const [description, setDescription] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) return
    await submit({ applicationId, rating, description: description || undefined })
  }

  if (submitted) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Star size={26} color="#10B981" fill="#10B981" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>¡Reseña enviada!</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 }}>
            Tu reseña sobre <strong>{clientName}</strong> se ha publicado correctamente.
          </p>
          <button onClick={() => { onSuccess(); onClose() }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', textAlign: 'center' }}>
          Calificar a {clientName}
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 24px', textAlign: 'center' }}>
          ¿Cómo fue tu experiencia trabajando con este cliente?
        </p>
        <div style={{ marginBottom: 24 }}>
          <ReviewStarRating value={rating} onChange={setRating} />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contanos cómo fue tu experiencia (opcional)"
          maxLength={500}
          rows={4}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }}
        />
        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 4 }}>
          {description.length}/500
        </div>
        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', margin: '12px 0 0', textAlign: 'center' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: submitting || rating === 0 ? '#6EE7B7' : '#10B981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {submitting ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
