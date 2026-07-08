import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, CheckCircle, XCircle, Calendar, ArrowLeft } from 'lucide-react'
import { fetchClientBiddings } from '../services/posts'
import type { Post } from '../types/post'
import { PostStatus } from '../types/post'
import LandingFooter from '../components/landing/LandingFooter'

type HistoryTab = 'Todas' | 'Completed' | 'Cancelled'

const statusColor: Record<string, string> = {
  Completed: '#10B981',
  Cancelled: '#EF4444',
}

const statusBg: Record<string, string> = {
  Completed: 'rgba(16, 185, 129, 0.1)',
  Cancelled: 'rgba(239, 68, 68, 0.1)',
}

const statusLabel: Record<string, string> = {
  Completed: 'Completada',
  Cancelled: 'Cancelada',
}

export default function BiddingHistory() {
  const navigate = useNavigate()
  const [biddings, setBiddings] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<HistoryTab>('Todas')

  useEffect(() => {
    fetchClientBiddings()
      .then((res) => {
        const all = res.data.biddings || []
        setBiddings(all.filter((b) => b.status === PostStatus.Completed || b.status === PostStatus.Cancelled))
      })
      .catch(() => setBiddings([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = biddings.filter((b) => {
    if (filter === 'Completed') return b.status === PostStatus.Completed
    if (filter === 'Cancelled') return b.status === PostStatus.Cancelled
    return true
  })

  return (
    <div className="min-h-screen bg-slate-100">
      <div style={{ background: '#059669', width: '100%', paddingTop: 32, paddingBottom: 40 }}>
        <div className="mx-auto max-w-5xl px-6">
          <button
            onClick={() => navigate('/client/biddings')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)',
              fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 0, marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} /> Volver a licitaciones
          </button>
          <h1 className="text-2xl font-extrabold text-white">Historial de Licitaciones</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 -mt-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : biddings.length === 0 && filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-md">
            <Gavel size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">No hay licitaciones finalizadas todavía.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: '#10B9811a' }}>
                  <CheckCircle size={20} style={{ color: '#10B981' }} />
                </span>
                <div className="min-w-0">
                  <p className="text-3xl font-extrabold leading-none text-slate-900">{biddings.filter(b => b.status === PostStatus.Completed).length}</p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">Completadas</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: '#EF44441a' }}>
                  <XCircle size={20} style={{ color: '#EF4444' }} />
                </span>
                <div className="min-w-0">
                  <p className="text-3xl font-extrabold leading-none text-slate-900">{biddings.filter(b => b.status === PostStatus.Cancelled).length}</p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">Canceladas</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: '#8B5CF61a' }}>
                  <Gavel size={20} style={{ color: '#8B5CF6' }} />
                </span>
                <div className="min-w-0">
                  <p className="text-3xl font-extrabold leading-none text-slate-900">{biddings.length}</p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">Total</p>
                </div>
              </div>
            </div>

            <section className="mt-8 mb-6">
              <div className="mb-4 flex gap-2">
                {(['Todas', 'Completed', 'Cancelled'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                      filter === tab
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'Todas' ? 'Todas' : tab === 'Completed' ? 'Completadas' : 'Canceladas'}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-md">
                  <p className="text-sm text-slate-400">No hay licitaciones {filter === 'Completed' ? 'completadas' : 'canceladas'}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filtered.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/client/biddings/${b.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      style={{
                        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
                        padding: 20, cursor: 'pointer', transition: 'box-shadow 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{b.title}</h3>
                        <span style={{
                          display: 'inline-block', borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700,
                          background: statusBg[b.status] || 'rgba(148,163,184,0.1)',
                          color: statusColor[b.status] || '#64748B',
                          whiteSpace: 'nowrap',
                        }}>
                          {statusLabel[b.status] || b.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} />
                          {new Date(b.createdAt).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #10B981; border-radius: 50%; animation: spin 0.7s linear infinite; }
      `}</style>
      <div className="mt-16">
        <LandingFooter />
      </div>
    </div>
  )
}
