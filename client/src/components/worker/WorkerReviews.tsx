import type { WorkerReview } from '../../services/api'

interface Props {
  reviews: WorkerReview[]
  loading: boolean
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={n <= rating ? '#F59E0B' : 'none'}
          stroke={n <= rating ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-[13px] font-bold text-gray-700">
      {initials}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default function WorkerReviews({ reviews, loading }: Props) {
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="bg-card rounded-2xl shadow-sm p-7">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[17px] font-bold text-gray-900">Reseñas</h3>
        {avg && (
          <div className="flex items-center gap-1.5">
            <Stars rating={Math.round(Number(avg))} />
            <span className="text-sm font-bold text-gray-900">{avg}</span>
            <span className="text-[13px] text-gray-400">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-gray-400 text-center py-5">Cargando reseñas...</p>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-5">Este trabajador aún no tiene reseñas.</p>
      )}

      {/* Review list */}
      {!loading && reviews.length > 0 && (
        <div className="flex flex-col">
          {reviews.map((review, i) => (
            <div
              key={review.id}
              className={`${i > 0 ? 'pt-5' : ''} pb-5 ${i < reviews.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <Avatar name={review.reviewer.name} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{review.reviewer.name}</p>
                  <div className="flex items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{review.description}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
