import { useState, useMemo } from 'react'
import { Star, ChevronDown, Flag } from 'lucide-react'
import type { WorkerReview } from '../../services/workers'
import ViewReviewModal from '../review/ViewReviewModal'
import ReportModal from '../report/ReportModal'

interface Props {
  reviews: WorkerReview[]
  loading: boolean
  workerName: string
  currentUserId?: string
}

function parseMediaUrls(urls: string | null): string[] {
  if (!urls) return []
  try {
    const parsed = JSON.parse(urls)
    return Array.isArray(parsed) ? parsed : [urls]
  } catch {
    return [urls]
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.6}
          className={n <= rating ? 'fill-warning text-warning' : 'fill-transparent text-slate-300'}
        />
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
      {initials}
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'highest', label: 'Mejor calificados' },
  { value: 'lowest', label: 'Peor calificados' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

export default function WorkerReviews({ reviews, loading, workerName, currentUserId }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('recent')
  const [selectedReview, setSelectedReview] = useState<WorkerReview | null>(null)
  const [reportReview, setReportReview] = useState<WorkerReview | null>(null)

  const avg = useMemo(() => {
    if (!reviews.length) return null
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  }, [reviews])

  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]
    reviews.forEach((r) => dist[r.rating - 1]++)
    return dist
  }, [reviews])

  const sortedReviews = useMemo(() => {
    const copy = [...reviews]
    if (sortBy === 'highest') return copy.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'lowest') return copy.sort((a, b) => a.rating - b.rating)
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reviews, sortBy])

  const maxCount = Math.max(...distribution, 1)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
          <Star size={24} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Sin reseñas aún</h3>
        <p className="text-sm text-slate-500">Este trabajador aún no tiene reseñas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Reseñas</h2>
            {avg && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900">{avg.toFixed(1)}</span>
                <StarDisplay rating={Math.round(avg)} size={18} />
                <span className="text-sm text-slate-500">({reviews.length})</span>
              </div>
            )}
          </div>
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Rating distribution */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1]
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 py-1">
                <span className="text-sm font-medium text-slate-600 w-4 text-right">{star}</span>
                <Star size={13} className="fill-warning text-warning shrink-0" />
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>

        {/* Review list */}
        <div className="space-y-0">
          {sortedReviews.map((review) => {
            const images = parseMediaUrls(review.mediaUrls)
            return (
              <div
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className="group cursor-pointer py-4 border-t border-slate-100 first:border-t-0 hover:bg-slate-50/50 -mx-6 px-6 transition-colors"
              >
                <div className="flex gap-3">
                  <Avatar name={review.reviewer.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {review.reviewer.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {currentUserId && currentUserId === review.workerId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setReportReview(review) }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94A3B8' }}
                            title="Reportar reseña"
                          >
                            <Flag size={13} />
                          </button>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {fmtDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StarDisplay rating={review.rating} size={13} />

                    {review.application?.post?.title && (
                      <p className="text-xs text-slate-400 mt-1">
                        Servicio: <span className="text-slate-500">{review.application.post.title}</span>
                      </p>
                    )}

                    {review.description && (
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                        {review.description}
                      </p>
                    )}

                    {images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {images.slice(0, 3).map((url, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {images.length > 3 && (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-medium shrink-0">
                            +{images.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-amber-600 font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalle →
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ViewReviewModal
        open={!!selectedReview}
        review={selectedReview}
        workerName={workerName}
        onClose={() => setSelectedReview(null)}
      />

      {reportReview && (
        <ReportModal
          open={!!reportReview}
          targetType="worker_review"
          targetId={reportReview.id}
          targetName={reportReview.reviewer.name}
          onClose={() => setReportReview(null)}
        />
      )}
    </>
  )
}
