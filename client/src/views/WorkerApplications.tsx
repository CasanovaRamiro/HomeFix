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

const tabs = ['All', 'Pending', 'Accepted', 'Rejected', 'Completed'] as const
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

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    Accepted:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'Accepted' },
    Rejected:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Rejected' },
    Pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Pending' },
    Completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Completed' },
  }
  const s = cfg[status] ?? { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0', label: status }
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
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
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

// ─── Application Card ────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const appliedAt = app.appliedAt?.substring(0, 10) ?? ''
  const serviceDate = app.serviceDate?.substring(0, 10) ?? ''

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
              {app.title}
            </h3>
            <StatusBadge status={app.status} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 12px' }} />

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <ClientAvatar name={app.client} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{app.client}</span>
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
            <span style={{ fontSize: 12, color: '#6B7280' }}>{app.location}</span>
          </div>

          {/* Description quote */}
          {app.description && (
            <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.5 }}>
              &ldquo;{app.description}&rdquo;
            </p>
          )}

          {/* Category chip */}
          {app.category && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 12, color: '#15803D', fontWeight: 500 }}>{app.category}</span>
            </div>
          )}
        </div>

        {/* Right image (optional) */}
        {app.image && (
          <div style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 10, overflow: 'hidden', alignSelf: 'center' }}>
            <img src={app.image} alt={app.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* ── Contact button ── */}
      {app.status !== 'Completed' && (
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
            Contact client
          </button>
        </div>
      )}
    </article>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function WorkerApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter] = useState<Tab>('All')
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get<Application[]>('/applications/my-applications')
      const data = res.data
      setApplications((prev) => {
        const prevMap = new Map(prev.map((a) => [a.id, a.status]))
        const changes: string[] = []
        for (const a of data) {
          const old = prevMap.get(a.id)
          if (old && old !== a.status) changes.push(`"${a.title}" → ${a.status}`)
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
    void fetchApplications()
    const iv = setInterval(() => { void fetchApplications() }, 20_000)
    return () => clearInterval(iv)
  }, [fetchApplications])

  const metrics = useMemo(() => ({
    total: applications.length,
    pending:   applications.filter((a) => a.status === 'Pending').length,
    accepted:    applications.filter((a) => a.status === 'Accepted').length,
    rejected:   applications.filter((a) => a.status === 'Rejected').length,
    completed:  applications.filter((a) => a.status === 'Completed').length,
  }), [applications])

  const filtered = useMemo(() => {
    if (filter === 'All') return applications
    const map: Record<Tab, string> = {
      All:       '',
      Pending:  'Pending',
      Accepted:   'Accepted',
      Rejected:  'Rejected',
      Completed: 'Completed',
    }
    return applications.filter((a) => a.status === map[filter])
  }, [applications, filter])

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
            Back to Dashboard
          </button>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FileText size={28} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              My Applications
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px 38px' }}>
            Review the status of your job applications
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <MetricCard value={metrics.total}       label="Total"       valueColor="#fff" />
            <MetricCard value={metrics.pending}  label="Pending"  valueColor="#F59E0B" />
            <MetricCard value={metrics.accepted}   label="Accepted"   valueColor="#10B981" />
            <MetricCard value={metrics.rejected}  label="Rejected"  valueColor="#EF4444" />
            <MetricCard value={metrics.completed} label="Completed" valueColor="#3B82F6" />
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
              No applications found
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {filter === 'All'
                ? "You haven't applied to any jobs yet."
                : `You don't have any applications in "${filter}".`}
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
            {filtered.map((a) => (
              <ApplicationCard key={`${a.id}-${a.postId}`} app={a} />
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
