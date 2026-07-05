import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'
import { fetchWorkerBiddings } from '../services/posts'
import type { WorkerBiddingDTO } from '../services/posts'
import { DollarSign, User, CalendarDays, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function WorkerBiddingHistory() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [apps, setApps] = useState<WorkerBiddingDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkerBiddings()
      .then((res) => setApps(res.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  const history = useMemo(() =>
    apps.filter((a) =>
      ['Completed', 'Rejected', 'Dismissed'].includes(a.status) ||
      ['Completed', 'Cancelled'].includes(a.bidding.status)
    ),
    [apps],
  )

  const statusColor = (s: string) => {
    switch (s) {
      case 'Completed': return '#16a34a'
      case 'Rejected': return '#dc2626'
      case 'Dismissed': return '#f59e0b'
      default: return theme.muted
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'Completed': return 'Completada'
      case 'Rejected': return 'Rechazada'
      case 'Dismissed': return 'Desestimada'
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
  }

  return (
    <div style={s.page}>
      <div style={s.header}>Historial de licitaciones</div>
      <div style={s.subheader}>Tus ofertas finalizadas en licitaciones</div>

      {loading ? (
        <div style={{ color: theme.muted }}>Cargando...</div>
      ) : history.length === 0 ? (
        <div style={{ color: theme.muted }}>No tenés ofertas finalizadas en licitaciones</div>
      ) : (
        history.map((app) => (
          <div key={app.applicationId} style={s.card}
            onClick={() => navigate(`/worker/biddings/${app.bidding.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.primaryDark }}>
                {app.bidding.title}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor(app.status), background: `${statusColor(app.status)}15`, padding: '2px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {app.status === 'Completed' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {statusLabel(app.status)}
              </span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              {app.bidding.categories.map((c) => (
                <span key={c.id} style={s.badge(c.name)}>{c.name}</span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: theme.muted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <DollarSign size={14} /> ${app.offeredCost?.toLocaleString() ?? '-'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CalendarDays size={14} /> {app.offeredDuration ?? '-'} días
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} /> {app.bidding.client.name} {app.bidding.client.surname}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
