import { useState, useMemo, useEffect, useCallback } from 'react'
import { MapPin, Calendar, ArrowLeft, Bell, XCircle, FileText, Send, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 8
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Application {
  id: string
  postId: string
  title: string
  client: string
  location: string
  appliedAt: string
  serviceDate: string
  status: 'Accepted' | 'Rejected' | 'Pending' | 'Completed'
  description?: string
  category?: string
  image?: string
  hasReview?: boolean
  clientRating: number
}

const TABS = ['Todas', 'Pendientes', 'Aceptadas', 'Rechazadas', 'Completadas'] as const
type Tab = (typeof TABS)[number]

const TAB_TO_STATUS: Record<Tab, string> = {
  Todas:       '',
  Pendientes:  'Pending',
  Aceptadas:   'Accepted',
  Rechazadas:  'Rejected',
  Completadas: 'Completed',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'U'
  return name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  Accepted:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'Aceptada'   },
  Rejected:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Rechazada'  },
  Pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Pendiente'  },
  Completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Completada' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0', label: status }
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  )
}

function ClientAvatar({ name }: { name: string }) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
  const idx = (name.charCodeAt(0) ?? 0) % colors.length
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: colors[idx], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Cancel Modal ────────────────────────────────────────────────────────────

function CancelModal({
  title,
  onConfirm,
  onClose,
  loading,
}: {
  title: string
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}
      onClick={onClose}
    >
      <div style={{
        background: '#fff', borderRadius: 20,
        padding: '32px 28px', maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#FEF2F2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <XCircle size={26} color="#DC2626" />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', textAlign: 'center' }}>
          ¿Cancelar postulación?
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.6 }}>
          Estás por cancelar tu postulación a{' '}
          <strong style={{ color: '#0F172A' }}>&ldquo;{title}&rdquo;</strong>.
          Esta acción no se puede deshacer.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: '#fff',
              color: '#475569', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 10,
              border: 'none', background: loading ? '#FCA5A5' : '#EF4444',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#DC2626' }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#EF4444' }}
          >
            {loading ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app, onCancelled }: { app: Application; onCancelled: (id: string) => void }) {
  const appliedAt   = app.appliedAt?.substring(0, 10)   ?? ''
  const serviceDate = app.serviceDate?.substring(0, 10) ?? ''
  const [showCancel, setShowCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.delete(`/applications/${app.id}`)
      onCancelled(app.id)
    } catch {
      // silently keep modal open so user can retry
    } finally {
      setCancelling(false)
      setShowCancel(false)
    }
  }

  return (
    <>
    {showCancel && (
      <CancelModal
        title={app.title}
        onConfirm={handleCancel}
        onClose={() => setShowCancel(false)}
        loading={cancelling}
      />
    )}
    <article style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.transform = 'none'
      }}
    >
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Title + badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
              {app.title}
            </h3>
            <StatusBadge status={app.status} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 12px' }} />

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <ClientAvatar name={app.client} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{app.client}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#F59E0B', fontSize: 12, marginLeft: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i}>{i < Math.round(app.clientRating) ? '★' : '☆'}</span>
              ))}
              <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 2 }}>{app.clientRating}</span>
            </span>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Postulado el {appliedAt}{serviceDate ? ` — Servicio el ${serviceDate}` : ''}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{app.location}</span>
          </div>

          {/* Description */}
          {app.description && (
            <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.5 }}>
              &ldquo;{app.description}&rdquo;
            </p>
          )}

          {/* Category chip — always shown */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 20, padding: '3px 10px', marginTop: 4,
          }}>
            <span style={{ fontSize: 12, color: '#15803D', fontWeight: 500 }}>
              {app.category ?? 'Sin categoría'}
            </span>
          </div>
        </div>

        {/* Image */}
        {app.image && (
          <div style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 10, overflow: 'hidden', alignSelf: 'center' }}>
            <img src={app.image} alt={app.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Action button — varies by status */}
      {app.status !== 'Rejected' && (
        <div style={{ padding: '0 20px 20px' }}>
          {app.status === 'Accepted' && (
            <button style={{
              width: '100%', background: '#10B981', border: 'none',
              borderRadius: 10, color: '#fff',
              fontSize: 13, fontWeight: 600, padding: '11px 0',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
            >
              Contactar cliente
            </button>
          )}

          {app.status === 'Pending' && (
            <button
              onClick={() => setShowCancel(true)}
              style={{
                width: '100%', background: '#fff',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10, color: '#64748B',
                fontSize: 13, fontWeight: 600, padding: '11px 0',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FEF2F2'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#FECACA'
                ;(e.currentTarget as HTMLElement).style.color = '#DC2626'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#fff'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
                ;(e.currentTarget as HTMLElement).style.color = '#64748B'
              }}
            >
              Cancelar postulación
            </button>
          )}

          {app.status === 'Completed' && (
            app.hasReview ? (
              <button style={{
                width: '100%', background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: 10, color: '#2563EB',
                fontSize: 13, fontWeight: 600, padding: '11px 0',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#DBEAFE' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#EFF6FF' }}
              >
                Ver reseña
              </button>
            ) : (
              <button style={{
                width: '100%', background: '#2563EB', border: 'none',
                borderRadius: 10, color: '#fff',
                fontSize: 13, fontWeight: 600, padding: '11px 0',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1D4ED8' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563EB' }}
              >
                Calificar cliente
              </button>
            )
          )}
        </div>
      )}
    </article>
    </>
  )
}

// ─── Header Metric Card (matches dashboard style) ─────────────────────────────

function MetricCard({ value, label, valueColor }: { value: number; label: string; valueColor: string }) {
  return (
    <div style={{
      background: '#1E293B', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div>
        <p style={{ fontSize: 32, fontWeight: 700, color: valueColor, margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function WorkerApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter]             = useState<Tab>('Todas')
  const [page, setPage]                 = useState(1)
  const [loading, setLoading]           = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const navigate = useNavigate()

  const mockClientRating = (seed: string): number => {
    let sum = 0
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
    return Number((3.5 + ((sum % 100) / 100) * 1.5).toFixed(1))
  }

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get<Application[]>('/applications/my-applications')
      const data = res.data.map((a) => ({ ...a, clientRating: mockClientRating(a.postId) }))
      setApplications((prev) => {
        const prevMap = new Map(prev.map((a) => [a.id, a.status]))
        const changes: string[] = []
        for (const a of data) {
          const old = prevMap.get(a.id)
          const label = STATUS_CFG[a.status]?.label ?? a.status
          if (old && old !== a.status) changes.push(`"${a.title}" → ${label}`)
        }
        if (changes.length > 0)
          setNotification(`Estado actualizado: ${changes.join(', ')}`)
        return data
      })
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchApplications()
    const iv = setInterval(() => { void fetchApplications() }, 20_000)
    return () => clearInterval(iv)
  }, [fetchApplications])

  const metrics = useMemo(() => ({
    total:      applications.length,
    pending:    applications.filter((a) => a.status === 'Pending').length,
    accepted:   applications.filter((a) => a.status === 'Accepted').length,
    rejected:   applications.filter((a) => a.status === 'Rejected').length,
    completed:  applications.filter((a) => a.status === 'Completed').length,
  }), [applications])

  const filtered = useMemo(() => {
    const status = TAB_TO_STATUS[filter]
    return status === '' ? applications : applications.filter((a) => a.status === status)
  }, [applications, filter])

  useEffect(() => { setPage(1) }, [filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>

      {/* Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          borderRadius: 14, padding: '14px 16px', maxWidth: 380,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        }}>
          <Bell size={18} color="#10B981" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#064E3B', margin: 0 }}>{notification}</p>
          <button onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#6EE7B7', flexShrink: 0 }}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Dark header */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Back */}
          <button onClick={() => navigate('/worker')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: 0,
            color: '#94A3B8', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginBottom: 24,
          }}>
            <ArrowLeft size={14} />
            Volver al dashboard
          </button>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Send size={26} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Mis Postulaciones
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px 36px' }}>
            Seguí el estado de tus ofertas enviadas
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <MetricCard value={metrics.total}     label="Total"       valueColor="#fff"     />
            <MetricCard value={metrics.pending}   label="Pendientes"  valueColor="#F59E0B"  />
            <MetricCard value={metrics.accepted}  label="Aceptadas"   valueColor="#10B981"  />
            <MetricCard value={metrics.rejected}  label="Rechazadas"  valueColor="#EF4444"  />
            <MetricCard value={metrics.completed} label="Completadas" valueColor="#3B82F6"  />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: '7px 18px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              border: filter === tab ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
              background: filter === tab ? '#0F172A' : '#fff',
              color: filter === tab ? '#fff' : '#475569',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 36, height: 36,
              border: '4px solid #E2E8F0', borderTopColor: '#0F172A',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 16, padding: '64px 24px', textAlign: 'center',
          }}>
            <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>
              Sin postulaciones
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {filter === 'Todas'
                ? 'Todavía no te postulaste a ningún trabajo.'
                : `No tenés postulaciones en "${filter}".`}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {paginated.map((a) => (
                <ApplicationCard
                  key={`${a.id}-${a.postId}`}
                  app={a}
                  onCancelled={(id) => setApplications((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginTop: 24,
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 8,
                    border: '1.5px solid #E2E8F0', background: '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (page !== 1) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                >
                  <ChevronLeft size={16} color="#475569" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: p === page ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                      background: p === page ? '#0F172A' : '#fff',
                      color: p === page ? '#fff' : '#475569',
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (p !== page) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                    onMouseLeave={(e) => { if (p !== page) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 8,
                    border: '1.5px solid #E2E8F0', background: '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (page !== totalPages) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                >
                  <ChevronRight size={16} color="#475569" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
