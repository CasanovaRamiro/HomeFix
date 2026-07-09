import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import type { WorkerReview } from '../../services/workers'
import ImageModal from '../ui/ImageModal'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function StarsReadOnly({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={18}
          className={n <= rating ? 'fill-warning text-warning' : 'fill-transparent text-slate-300'}
          strokeWidth={1.6}
        />
      ))}
    </div>
  )
}

interface Props {
  open: boolean
  review: WorkerReview | null
  workerName: string
  loading?: boolean
  onClose: () => void
}

export default function ViewReviewModal({ open, review, workerName, loading, onClose }: Props) {
  const [selectedImg, setSelectedImg] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const imageUrls: string[] = (() => {
    if (!review?.mediaUrls) return []
    try {
      const parsed = JSON.parse(review.mediaUrls)
      return Array.isArray(parsed) ? parsed : [review.mediaUrls]
    } catch {
      return [review.mediaUrls]
    }
  })()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{
          background: '#10B981', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
            Reseña de {workerName}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            Cargando reseña...
          </div>
        )}

        {!loading && !review && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#DC2626', fontSize: 14 }}>
            No se encontró la reseña.
          </div>
        )}

        {!loading && review && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <StarsReadOnly rating={review.rating} />
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{fmtDate(review.createdAt)}</span>
            </div>

            {imageUrls.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {imageUrls.map((url, i) => (
                  <img key={i} src={url} alt=""
                    onClick={() => setSelectedImg(i)}
                    style={{
                      width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12,
                      border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{
              background: '#F8FAFC', borderRadius: 10, padding: '16px 18px',
              border: '1px solid #E2E8F0',
            }}>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                {review.description || 'Sin descripción.'}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                marginTop: 20, width: '100%', padding: '12px 0', borderRadius: 10,
                border: 'none', background: '#10B981', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {selectedImg !== null && imageUrls[selectedImg] && (
        <ImageModal
          src={imageUrls[selectedImg]}
          alt={`Foto ${selectedImg + 1}`}
          onClose={() => setSelectedImg(null)}
          onPrev={selectedImg > 0 ? () => setSelectedImg(selectedImg - 1) : undefined}
          onNext={selectedImg < imageUrls.length - 1 ? () => setSelectedImg(selectedImg + 1) : undefined}
        />
      )}
    </div>
  )
}
