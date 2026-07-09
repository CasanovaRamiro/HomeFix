import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, MessageSquare, Star, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import type { UserPost } from '../services/posts'
import { fetchClientStats, fetchClientPosts, type ClientStats } from '../services/client'
import { PostStatus } from '../types/post'
import StatCard from '../components/dashboard/StatCard'
import TurnoCard from '../components/dashboard/TurnoCard'
import LandingFooter from '../components/landing/LandingFooter'

type HistoryTab = 'Todas' | 'Completadas' | 'Canceladas'

const PAGE_SIZE = 10

export default function ClientHistory() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [posts, setPosts] = useState<UserPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<HistoryTab>('Todas')

  const fetchPosts = useCallback((p: number) => {
    fetchClientPosts(p, PAGE_SIZE)
      .then((res) => {
        setPosts(res.data.data)
        setTotal(res.data.total)
      })
  }, [])

  useEffect(() => {
    Promise.all([
      fetchClientStats(),
      fetchClientPosts(1, PAGE_SIZE),
    ])
      .then(([statsRes, postsRes]) => {
        setStats(statsRes.data)
        setPosts(postsRes.data.data)
        setTotal(postsRes.data.total)
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPosts(page)
  }, [page, fetchPosts])

  const handleFilterChange = (tab: HistoryTab) => {
    setFilter(tab)
    setPage(1)
    fetchPosts(1)
  }

  const rating = stats?.clientRating
  const unreviewed = posts.filter(
    (p) => p.status === PostStatus.Completed && !p.hasReview
  )

  const filtered = posts
    .filter((p) => {
      if (filter === 'Completadas') return p.status === PostStatus.Completed
      if (filter === 'Canceladas') return p.status === PostStatus.Cancelled
      return true
    })
    .sort((a, b) => {
      if (filter !== 'Todas') return 0
      if (a.status !== b.status) return a.status === PostStatus.Completed ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-[linear-gradient(135deg,#EEF4FF_0%,#DBE7FF_100%)] px-6 pb-10 pt-6">
        <div className="mx-auto max-w-5xl">
          <p
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            &larr; Volver al inicio
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900">Historial de publicaciones</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 -mt-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : !stats ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-md">
            <FileText size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">No se pudieron cargar los datos</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Completadas" value={stats.completedPosts} icon={CheckCircle} iconColor="#10B981" />
              <StatCard label="Canceladas" value={stats.cancelledPosts} icon={XCircle} iconColor="#EF4444" />
              <StatCard label="Trabajos sin calificar" value={stats.unreviewedJobs} icon={MessageSquare} iconColor="#F59E0B" />
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: '#8B5CF61a' }}>
                  <Star size={20} style={{ color: '#8B5CF6' }} />
                </span>
                <div className="min-w-0">
                  {rating && rating.reviewCount > 0 ? (
                    <>
                      <p className="text-3xl font-extrabold leading-none text-slate-900">{rating.averageRating}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">Mi puntaje ({rating.reviewCount} {rating.reviewCount === 1 ? 'reseña' : 'reseñas'})</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-extrabold leading-none text-slate-400">&mdash;</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">Sin historial de reviews</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {unreviewed.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-slate-800">Trabajos sin calificar</h2>
                <div className="flex flex-col gap-4">
                  {unreviewed.map((p) => (
                    <TurnoCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Todas las publicaciones</h2>
              </div>
              <div className="mb-4 flex gap-2">
                {(['Todas', 'Completadas', 'Canceladas'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleFilterChange(tab)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                      filter === tab
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-md">
                  <p className="text-sm text-slate-400">No hay publicaciones {filter.toLowerCase()}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filtered.map((p) => (
                    <TurnoCard key={p.id} post={p} />
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="mt-16">
        <LandingFooter />
      </div>
    </div>
  )
}
