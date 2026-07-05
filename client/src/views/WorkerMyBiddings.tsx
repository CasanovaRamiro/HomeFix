import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'
import { fetchWorkerBiddings } from '../services/posts'
import type { WorkerBiddingDTO } from '../services/posts'
import { DollarSign, User, CalendarDays, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function WorkerMyBiddings() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [apps, setApps] = useState<WorkerBiddingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchWorkerBiddings()
      .then((res) => setApps(res.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  const active = useMemo(() =>
    apps.filter((a) => !['Completed', 'Rejected', 'Dismissed'].includes(a.status) && !['Completed', 'Cancelled'].includes(a.bidding.status)),
    [apps],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return active
    return active.filter((a) => a.status === filter)
  }, [active, filter])

  const statusColor = (s: string) => {
    switch (s) {
      case 'Pending': return '#f59e0b'
      case 'Evaluating': return '#3b82f6'
      case 'Accepted': return '#16a34a'
      case 'InProgress': return '#059669'
      default: return theme.muted
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'Pending': return 'Pendiente'
      case 'Evaluating': return 'En evaluación'
      case 'Accepted': return 'Aceptada'
      case 'InProgress': return 'En curso'
      default: return s
    }
  }

  const s = {
    page: { maxWidth: '80rem', margin: '0 auto', padding: '2rem' },
    header: { fontSize: '1.5rem', fontWeight: 700, color: theme.primaryDark, marginBottom: '0.5rem' },
    subheader: { fontSize: '0.875rem', color: theme.muted, marginBottom: '1.5rem' },
    card: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1rem',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
    },
    badge: (_name: string) => ({
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: theme.activeBg,
      color: theme.primaryDark,
      marginRight: '0.4rem',
      marginBottom: '0.4rem',
    }),
    tab: (active: boolean) => ({
      padding: '0.4rem 1rem',
      borderRadius: '8px',
      fontSize: '0.8125rem',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      background: active ? theme.primaryDark : 'transparent',
      color: active ? '#fff' : theme.muted,
      transition: 'background 0.15s',
    }),
  }

  return (
    <div style={s.page}>
      <div style={s.header}>Gestor de licitaciones</div>
      <div style={s.subheader}>Tus ofertas activas en licitaciones</div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'Pending', label: 'Pendientes' },
          { key: 'Evaluating', label: 'En evaluación' },
          { key: 'Accepted', label: 'Aceptadas' },
        ].map((t) => (
          <button key={t.key} style={s.tab(filter === t.key)} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: theme.muted }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: theme.muted }}>No tenés ofertas activas en licitaciones</div>
      ) : (
        filtered.map((app) => (
          <div key={app.applicationId} style={s.card}
            onClick={() => navigate(`/worker/biddings/${app.bidding.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.primaryDark }}>
                {app.bidding.title}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor(app.status), background: `${statusColor(app.status)}15`, padding: '2px 10px', borderRadius: '999px' }}>
                {statusLabel(app.status)}
              </span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              {app.bidding.categories.map((c) => (
                <span key={c.id} style={s.badge(c.name)}>{c.name}</span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: theme.muted, marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <DollarSign size={14} /> ${app.offeredCost?.toLocaleString() ?? '-'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CalendarDays size={14} /> {app.offeredDuration ?? '-'} días
              </span>
              {app.offeredStartDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={14} /> Inicio: {new Date(app.offeredStartDate).toLocaleDateString()}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={14} style={{ color: theme.muted }} />
              <span style={{ fontSize: '0.8125rem', color: theme.primaryDark }}>
                {app.bidding.client.name} {app.bidding.client.surname}
              </span>
              <span style={{ fontSize: '0.75rem', color: theme.muted }}>
                Licitación: {statusLabel(app.bidding.status)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
