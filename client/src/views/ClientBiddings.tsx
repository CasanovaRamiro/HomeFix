import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, PlayCircle, CheckCircle, XCircle, Activity, Calendar, Users, AlertCircle } from 'lucide-react'
import LandingFooter from '../components/landing/LandingFooter'
import { fetchClientBiddings } from '../services/client'
import type { Post } from '../types/post'
import { PostStatus } from '../types/post'

function MetricCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: typeof PlayCircle
  iconColor: string
  iconBg: string
  value: number | string
  label: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
          {label}
        </p>
      </div>
    </div>
  )
}

type FilterTab = 'Todas' | 'Active' | 'Evaluating' | 'InProgress' | 'Completed' | 'Cancelled'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Active', label: 'Activas' },
  { key: 'Evaluating', label: 'Evaluando' },
  { key: 'InProgress', label: 'En curso' },
  { key: 'Completed', label: 'Completadas' },
  { key: 'Cancelled', label: 'Canceladas' },
]

const statusColor: Record<string, string> = {
  Active: '#2563EB',
  'In progress': '#8B5CF6',
  Evaluating: '#F59E0B',
  Paused: '#F59E0B',
  Completed: '#10B981',
  Cancelled: '#EF4444',
}

const statusBg: Record<string, string> = {
  Active: 'rgba(37, 99, 235, 0.1)',
  'In progress': 'rgba(139, 92, 246, 0.1)',
  Evaluating: 'rgba(245, 158, 11, 0.1)',
  Paused: 'rgba(245, 158, 11, 0.1)',
  Completed: 'rgba(16, 185, 129, 0.1)',
  Cancelled: 'rgba(239, 68, 68, 0.1)',
}

const statusLabel: Record<string, string> = {
  Active: 'Activa',
  'In progress': 'En curso',
  Evaluating: 'Evaluando',
  Paused: 'Pausada',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
}

export default function ClientBiddings() {
  const navigate = useNavigate()
  const [data, setData] = useState<{
    stats: { active: number; evaluating: number; completed: number }
    biddings: Post[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('Todas')

  useEffect(() => {
    fetchClientBiddings()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'Todas') return data.biddings
    if (filter === 'Evaluating') return data.biddings.filter((b) => b.status === PostStatus.Evaluating)
    if (filter === 'InProgress') return data.biddings.filter((b) => b.status === PostStatus.InProgress)
    return data.biddings.filter((b) => b.status === filter)
  }, [data, filter])

  return (
    <div style={{
      minHeight: '100vh', background: '#F3F4F6',
      fontFamily: "'Montserrat', system-ui, sans-serif",
    }}>
      {/* Header verde cliente */}
      <div style={{ background: '#059669', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div className="hf-container" style={{ padding: '0 32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)', border: 'none', padding: '6px 12px',
              borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'background 0.15s', marginBottom: 20, opacity: 0.8,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          >
            Volver
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Mis Licitaciones
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
            Gestioná tus licitaciones activas
          </p>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="hf-container" style={{
        padding: '0 32px',
        marginTop: -28, position: 'relative', zIndex: 10,
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : !data ? (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
            padding: '40px 20px', textAlign: 'center', marginTop: 28,
          }}>
            <AlertCircle size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No se pudieron cargar los datos</p>
          </div>
        ) : (
          <>
            <div className="wd-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <MetricCard icon={PlayCircle} iconColor="#2563EB" iconBg="rgba(37, 99, 235, 0.1)" value={data.stats.active} label="Activas" />
              <MetricCard icon={Activity} iconColor="#F59E0B" iconBg="rgba(245, 158, 11, 0.1)" value={data.stats.evaluating} label="Evaluando" />
              <MetricCard icon={CheckCircle} iconColor="#10B981" iconBg="rgba(16, 185, 129, 0.1)" value={data.stats.completed} label="Completadas" />
            </div>

            {/* Biddings list */}
            <div style={{ marginTop: 36 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
                Licitaciones
              </h2>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    style={{
                      padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      border: filter === tab.key ? 'none' : '1.5px solid #E2E8F0',
                      background: filter === tab.key ? '#0F172A' : '#fff',
                      color: filter === tab.key ? '#fff' : '#475569',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== tab.key) { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== tab.key) { (e.currentTarget as HTMLElement).style.background = '#fff' }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{
                  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
                  padding: '40px 20px', textAlign: 'center',
                }}>
                  {data.biddings.length === 0 ? (
                    <>
                      <Gavel size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No creaste ninguna licitación todavía.</p>
                      <button
                        onClick={() => navigate('/create-bidding')}
                        style={{
                          marginTop: 16, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                          border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer',
                        }}
                      >
                        Crear primera licitación
                      </button>
                    </>
                  ) : (
                    <>
                      <XCircle size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No hay licitaciones con ese estado.</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/client/biddings/${b.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      style={{
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 16,
                        padding: 20,
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {b.title}
                        </h3>
                        <span style={{
                          display: 'inline-block', borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700,
                          background: statusBg[b.status] || 'rgba(148, 163, 184, 0.1)',
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
                        {b.categories && b.categories.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} />
                            {b.categories.map(c => c.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #10B981; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @media (max-width: 768px) { .wd-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>
    </div>
  )
}
