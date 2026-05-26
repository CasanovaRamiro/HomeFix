import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorker, getWorkerReviews, type Worker, type WorkerReview } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'
import WorkerHeader from '../components/worker/WorkerHeader'
import WorkerAbout from '../components/worker/WorkerAbout'
import WorkerReviews from '../components/worker/WorkerReviews'
import WorkerActions from '../components/worker/WorkerActions'
import WorkerStats from '../components/worker/WorkerStats'

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [reviews, setReviews] = useState<WorkerReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getWorker(id)
      .then(setWorker)
      .catch(() => setError('No se encontró el trabajador.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getWorkerReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [id])

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header bar */}
      <div style={{ background: '#0F172A', width: '100%' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: isMobile ? '14px 16px' : '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 0 : 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#E5E7EB', fontSize: 13, fontWeight: 500,
                padding: '9px 16px', borderRadius: 10,
                cursor: 'pointer', letterSpacing: '0.01em',
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>
        {loading && <p style={{ textAlign: 'center', color: '#6B7280', paddingTop: 80 }}>Cargando...</p>}
        {error   && <p style={{ textAlign: 'center', color: '#EF4444', paddingTop: 80 }}>{error}</p>}

        {worker && isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <WorkerHeader worker={worker} />
            <WorkerActions />
            <WorkerStats reviewCount={reviews.length} avgRating={avgRating} />
            <WorkerAbout worker={worker} />
            <WorkerReviews reviews={reviews} loading={reviewsLoading} />
          </div>
        )}

        {worker && !isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <WorkerHeader worker={worker} />
              <WorkerAbout worker={worker} />
              <WorkerReviews reviews={reviews} loading={reviewsLoading} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <WorkerActions />
              <WorkerStats reviewCount={reviews.length} avgRating={avgRating} />
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
