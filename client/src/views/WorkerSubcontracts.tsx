import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayCircle, PauseCircle, CheckCircle, Star, ArrowLeft, GitBranch, Calendar, Users, AlertCircle, XCircle } from 'lucide-react'
import LandingFooter from '../components/landing/LandingFooter'
import { fetchMySubcontractManager } from '../services/posts'
import type { SubcontractDetailDTO } from '../types/post'

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

function RatingCard({
  averageRating,
  reviewCount,
}: {
  averageRating: number
  reviewCount: number
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
        background: 'rgba(139, 92, 246, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Star size={22} color="#8B5CF6" />
      </div>
      <div>
        {reviewCount > 0 ? (
          <>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>
              {averageRating}
            </p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
              Calificación ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#94A3B8', margin: 0, lineHeight: 1.1 }}>
              &mdash;
            </p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
              Sin reseñas
            </p>
          </>
        )}
      </div>
    </div>
  )
}

type FilterTab = 'Todas' | 'Active' | 'Paused' | 'Completed' | 'Cancelled'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Active', label: 'Activas' },
  { key: 'Paused', label: 'Pausadas' },
  { key: 'Completed', label: 'Completadas' },
  { key: 'Cancelled', label: 'Canceladas' },
]

const statusColor: Record<string, string> = {
  Active: '#2563EB',
  Paused: '#F59E0B',
  Completed: '#10B981',
  Cancelled: '#EF4444',
}

const statusBg: Record<string, string> = {
  Active: 'rgba(37, 99, 235, 0.1)',
  Paused: 'rgba(245, 158, 11, 0.1)',
  Completed: 'rgba(16, 185, 129, 0.1)',
  Cancelled: 'rgba(239, 68, 68, 0.1)',
}

const statusLabel: Record<string, string> = {
  Active: 'Activa',
  Paused: 'Pausada',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
}

export default function WorkerSubcontracts() {
  const navigate = useNavigate()
  const [data, setData] = useState<{
    stats: { active: number; paused: number; completed: number; averageRating: number; reviewCount: number }
    subcontracts: SubcontractDetailDTO[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('Todas')

  useEffect(() => {
    fetchMySubcontractManager()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'Todas') return data.subcontracts
    return data.subcontracts.filter((s) => s.status === filter)
  }, [data, filter])

  return (
    <div style={{
      minHeight: '100vh', background: '#F3F4F6',
      fontFamily: "'Montserrat', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)', border: 'none', padding: '6px 12px',
              borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'background 0.15s', marginBottom: 20,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={14} />
            Volver
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Gestión de subcontratos
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '4px 0 0' }}>
            Gestioná tus subcontratos
          </p>
        </div>
      </div>

      {/* Metrics strip */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
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
            <div className="wd-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <MetricCard icon={PlayCircle} iconColor="#2563EB" iconBg="rgba(37, 99, 235, 0.1)" value={data.stats.active} label="Activas" />
              <MetricCard icon={PauseCircle} iconColor="#F59E0B" iconBg="rgba(245, 158, 11, 0.1)" value={data.stats.paused} label="Pausadas" />
              <MetricCard icon={CheckCircle} iconColor="#10B981" iconBg="rgba(16, 185, 129, 0.1)" value={data.stats.completed} label="Completadas" />
              <RatingCard averageRating={data.stats.averageRating} reviewCount={data.stats.reviewCount} />
            </div>

            {/* Subcontracts list */}
            <div style={{ marginTop: 36 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
                Mis subcontratos
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
                      if (filter !== tab.key) {
                        ;(e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== tab.key) {
                        ;(e.currentTarget as HTMLElement).style.background = '#fff'
                      }
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
                  {data.subcontracts.length === 0 ? (
                    <>
                      <GitBranch size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No creaste ningún subcontrato todavía.</p>
                    </>
                  ) : (
                    <>
                      <XCircle size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No hay subcontratos con ese estado.</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => navigate(`/worker/subcontracts/group/${sub.id}`)}
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
                          {sub.title}
                        </h3>
                        <span style={{
                          display: 'inline-block', borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700,
                          background: statusBg[sub.status] || 'rgba(148, 163, 184, 0.1)',
                          color: statusColor[sub.status] || '#64748B',
                          whiteSpace: 'nowrap',
                        }}>
                          {statusLabel[sub.status] || sub.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} />
                          {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={13} />
                          {sub.categories.reduce((a, c) => a + c.quantity, 0)} puesto{sub.categories.reduce((a, c) => a + c.quantity, 0) !== 1 ? 's' : ''}
                        </span>
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
        .spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @media (max-width: 768px) { .wd-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>
    </div>
  )
}
