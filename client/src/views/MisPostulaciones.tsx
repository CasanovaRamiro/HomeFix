import { useState, useMemo, useEffect, useCallback } from 'react'
import { MapPin, Calendar, ArrowLeft, Bell, XCircle, FileText } from 'lucide-react'
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
}

const tabs = ['Todas', 'Pendientes', 'Aceptadas', 'Rechazadas', 'Completadas'] as const
type Tab = (typeof tabs)[number]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// ─── Postulacion Card ─────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    Accepted:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'Aceptada' },
    Rejected:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Rechazada' },
    Pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Pendiente' },
    Completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Completada' },
  }
  const s = cfg[estado] ?? { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0', label: estado }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 12px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  )
}

function ClientAvatar({ name }: { name: string }) {
  const initials = getInitials(name)
  // pick a color based on first char
  const colors = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6']
  const idx = (name.charCodeAt(0) ?? 0) % colors.length
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: colors[idx],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function PostulacionCard({ p }: { p: Application }) {
  const appliedAt = p.appliedAt?.substring(0, 10) ?? ''
  const serviceDate = p.serviceDate?.substring(0, 10) ?? ''

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* ── Card body ── */}
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', gap: 14 }}>

        {/* Left content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Title + badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
              {p.title}
            </h3>
            <StatusBadge estado={p.status} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 12px' }} />

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <ClientAvatar name={p.client} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{p.client}</span>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Applied {appliedAt}{serviceDate ? ` — Service on ${serviceDate}` : ''}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{p.location}</span>
          </div>

          {/* Description quote */}
          {p.description && (
            <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.5 }}>
              &ldquo;{p.description}&rdquo;
            </p>
          )}

          {/* Category chip */}
          {p.category && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 12, color: '#15803D', fontWeight: 500 }}>{p.category}</span>
            </div>
          )}
        </div>

        {/* Right image (optional) */}
        {p.image && (
          <div style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 10, overflow: 'hidden', alignSelf: 'center' }}>
            <img src={p.image} alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* ── Contact button ── */}
      {p.status !== 'Completed' && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            style={{
              width: '100%',
              background: '#16A34A',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#15803D' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#16A34A' }}
          >
            📞 Contactar cliente
          </button>
        </div>
      )}
    </article>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState<Application[]>([])
  const [filter, setFilter] = useState<Tab>('Todas')
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchPostulaciones = useCallback(async () => {
    try {
      const res = await api.get<Application[]>('/applications/my-applications')
      const data = res.data
      setPostulaciones((prev) => {
        const prevMap = new Map(prev.map((p) => [p.id, p.status]))
        const changes: string[] = []
        for (const p of data) {
          const old = prevMap.get(p.id)
          if (old && old !== p.status) changes.push(`"${p.title}" → ${p.status}`)
        }
        if (changes.length > 0)
          setNotification(`Status updated! ${changes.join(', ')}`)
        return data
      })
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    void fetchPostulaciones()
    const iv = setInterval(() => { void fetchPostulaciones() }, 20_000)
    return () => clearInterval(iv)
  }, [fetchPostulaciones])

  const metrics = useMemo(() => ({
    total: postulaciones.length,
    pendientes:   postulaciones.filter((p) => p.status === 'Pending').length,
    aceptadas:    postulaciones.filter((p) => p.status === 'Accepted').length,
    rechazadas:   postulaciones.filter((p) => p.status === 'Rejected').length,
    completadas:  postulaciones.filter((p) => p.status === 'Completed').length,
  }), [postulaciones])

  const filtered = useMemo(() => {
    if (filter === 'Todas') return postulaciones
    const map: Record<Tab, string> = {
      Todas:       '',
      Pendientes:  'Pending',
      Aceptadas:   'Accepted',
      Rechazadas:  'Rejected',
      Completadas: 'Completed',
    }
    return postulaciones.filter((p) => p.status === map[filter])
  }, [postulaciones, filter])

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>

      {/* ── Toast notification ── */}
      {notification && (
        <div
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 100,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 14, padding: '14px 16px', maxWidth: 380,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        >
          <Bell size={18} color="#10B981" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#064E3B', margin: 0 }}>{notification}</p>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#6EE7B7', flexShrink: 0 }}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* ── Dark header ── */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/worker')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', padding: 0,
              color: '#94A3B8', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} />
            Volver al Dashboard
          </button>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FileText size={28} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Mis Postulaciones
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px 38px' }}>
            Revisa el estado de tus postulaciones a trabajos
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <MetricCard value={metrics.total}       label="Total"       valueColor="#fff" />
            <MetricCard value={metrics.pendientes}  label="Pendientes"  valueColor="#F59E0B" />
            <MetricCard value={metrics.aceptadas}   label="Aceptadas"   valueColor="#10B981" />
            <MetricCard value={metrics.rechazadas}  label="Rechazadas"  valueColor="#EF4444" />
            <MetricCard value={metrics.completadas} label="Completadas" valueColor="#3B82F6" />
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                border: filter === tab ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                background: filter === tab ? '#0F172A' : '#fff',
                color: filter === tab ? '#fff' : '#475569',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div
              style={{
                width: 36, height: 36,
                border: '4px solid #E2E8F0',
                borderTopColor: '#0F172A',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '64px 24px',
              textAlign: 'center',
            }}
          >
            <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>
              No hay postulaciones
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {filter === 'Todas'
                ? 'Todavía no te postulaste a ningún trabajo.'
                : `No tenés postulaciones en "${filter}".`}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {filtered.map((p) => (
              <PostulacionCard key={`${p.id}-${p.postId}`} p={p} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  value,
  label,
  valueColor,
}: {
  value: number
  label: string
  valueColor: string
}) {
  return (
    <div
      style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 36, fontWeight: 700, color: valueColor, margin: '0 0 6px' }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}
