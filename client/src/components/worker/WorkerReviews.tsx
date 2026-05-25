import type { WorkerReview } from '../../services/api'

interface Props {
  reviews: WorkerReview[]
  loading: boolean
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
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
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: '#E5E7EB', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#374151',
    }}>
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
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Reseñas</h3>
        {avg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Stars rating={Math.round(Number(avg))} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{avg}</span>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>({reviews.length})</span>
          </div>
        )}
      </div>

      {/* States */}
      {loading && (
        <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Cargando reseñas...</p>
      )}

      {!loading && reviews.length === 0 && (
        <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Este trabajador aún no tiene reseñas.</p>
      )}

      {/* Review list */}
      {!loading && reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {reviews.map((review, i) => (
            <div
              key={review.id}
              style={{
                paddingTop: i === 0 ? 0 : 20,
                paddingBottom: 20,
                borderBottom: i < reviews.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Avatar name={review.reviewer.name} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{review.reviewer.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stars rating={review.rating} />
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{review.description}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
