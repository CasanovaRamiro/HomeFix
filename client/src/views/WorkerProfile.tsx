import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorker, getWorkerReviews, type Worker, type WorkerReview } from '../services/api'
import WorkerHeader from '../components/worker/WorkerHeader'
import WorkerAbout from '../components/worker/WorkerAbout'
import WorkerReviews from '../components/worker/WorkerReviews'
import WorkerActions from '../components/worker/WorkerActions'
import WorkerStats from '../components/worker/WorkerStats'

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-gray-100">

      {/* Header bar */}
      <div className="bg-primary-dark w-full">
        <div className="max-w-[1024px] mx-auto px-4 py-3.5 md:px-6 md:py-4">
          <div className="flex items-center justify-between md:mb-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-white/7 border border-white/15 text-gray-200 text-[13px] font-medium px-4 py-2.25 rounded-xl cursor-pointer tracking-[0.01em]"
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
      <div className="max-w-[1024px] mx-auto px-4 py-5 md:px-6 md:py-8">
        {loading && <p className="text-center text-text-muted pt-20">Cargando...</p>}
        {error   && <p className="text-center text-danger pt-20">{error}</p>}

        {worker && (
          <div className="md:grid md:grid-cols-[2fr_1fr] md:gap-6 md:items-start flex flex-col gap-5">
            <div className="flex flex-col gap-5 md:gap-6">
              <WorkerHeader worker={worker} />
              <div className="hidden md:block">
                <WorkerAbout worker={worker} />
              </div>
              <WorkerReviews reviews={reviews} loading={reviewsLoading} />
            </div>
            <div className="flex flex-col gap-5 md:gap-6">
              <div className="md:hidden">
                <WorkerActions />
              </div>
              <div className="md:hidden">
                <WorkerStats reviewCount={reviews.length} avgRating={avgRating} />
              </div>
              <div className="hidden md:block md:order-first">
                <WorkerActions />
              </div>
              <div className="hidden md:block">
                <WorkerStats reviewCount={reviews.length} avgRating={avgRating} />
              </div>
              <div className="md:hidden">
                <WorkerAbout worker={worker} />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
