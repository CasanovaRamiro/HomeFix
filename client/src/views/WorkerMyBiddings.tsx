import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchWorkerBiddings } from '../services/posts'
import type { WorkerBiddingDTO } from '../services/posts'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, Clock, CheckCircle, XCircle, AlertTriangle, MapPin, ChevronRight, AlertCircle, Star } from 'lucide-react'
import { formatAddress } from '../utils/address'
import ReviewModal from '../components/review/ReviewModal'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  Pending:   { label: 'Pendiente',   color: '#D97706', bg: '#FFFBEB', icon: Clock },
  Accepted:  { label: 'Aceptada',    color: '#059669', bg: '#ECFDF5', icon: CheckCircle },
  Rejected:  { label: 'Rechazada',   color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  Dismissed: { label: 'Desestimada', color: '#64748B', bg: '#F1F5F9', icon: AlertTriangle },
  Completed: { label: 'Completada',  color: '#059669', bg: '#ECFDF5', icon: CheckCircle },
}

type FilterTab = 'Todas' | 'Pending' | 'Accepted' | 'Historial'
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'Todas', label: 'Todas' },
  { key: 'Pending', label: 'Pendientes' },
  { key: 'Accepted', label: 'Aceptadas' },
  { key: 'Historial', label: 'Historial' },
]

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: '#64748B', bg: '#F1F5F9', icon: AlertTriangle }
  const Icon = s.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      <Icon size={13} />
      {s.label}
    </span>
  )
}



export default function WorkerMyBiddings() {
  useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<WorkerBiddingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('Todas')
  const [reviewTarget, setReviewTarget] = useState<{ applicationId: string; clientName: string } | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWorkerBiddings()
        setApplications(res.data)
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = (() => {
    if (filter === 'Todas') return applications
    if (filter === 'Historial') return applications.filter((a) => ['Completed', 'Rejected', 'Dismissed'].includes(a.status))
    return applications.filter((a) => a.status === filter)
  })()

  const counts = {
    Todas: applications.length,
    Pending: applications.filter((a) => a.status === 'Pending').length,
    Accepted: applications.filter((a) => a.status === 'Accepted').length,
    Historial: applications.filter((a) => ['Completed', 'Rejected', 'Dismissed'].includes(a.status)).length,
  }

  const historyCounts = {
    Completed: applications.filter((a) => a.status === 'Completed').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length,
    Dismissed: applications.filter((a) => a.status === 'Dismissed').length,
  }

  const formatCurrency = (n: number | null) =>
    n != null ? `$${n.toLocaleString()}` : '—'

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1E293B 100%)',
        width: '100%', paddingTop: 40, paddingBottom: 48,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(59,130,246,0.06)' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => navigate('/worker')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: '#94A3B8', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <GitBranch size={28} color="#3B82F6" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Mis licitaciones</h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 0 38px' }}>
            {loading ? 'Cargando…' : (
              <>{counts.Pending} pendientes · {counts.Accepted} aceptadas · {counts.Historial} finalizadas</>
            )}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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
                  (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== tab.key) {
                  (e.currentTarget as HTMLElement).style.background = '#fff'
                }
              }}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 16 }}>Cargando ofertas…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#fff' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={24} color="#3B82F6" />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: '1.1rem', color: '#0F172A', fontWeight: 600 }}>
              {filter === 'Historial' ? 'Sin historial' : `Sin ofertas ${filter === 'Pending' ? 'pendientes' : filter === 'Accepted' ? 'aceptadas' : ''}`}
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {filter === 'Todas' && 'No te postulaste a ninguna licitación todavía.'}
              {filter === 'Pending' && 'No hay ofertas pendientes. Explorá licitaciones activas para postularte.'}
              {filter === 'Accepted' && 'No tenés ofertas aceptadas.'}
              {filter === 'Historial' && 'Las ofertas completadas, rechazadas o desestimadas aparecerán acá.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && filter === 'Historial' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 13, color: '#64748B' }}>
            <span>Total: <strong>{filtered.length}</strong></span>
            <span>&middot;</span>
            <span style={{ color: '#059669' }}>Completadas: <strong>{historyCounts.Completed}</strong></span>
            <span>&middot;</span>
            <span style={{ color: '#DC2626' }}>Rechazadas: <strong>{historyCounts.Rejected}</strong></span>
            <span>&middot;</span>
            <span style={{ color: '#64748B' }}>Desestimadas: <strong>{historyCounts.Dismissed}</strong></span>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((app) => (
              <div
                key={app.applicationId}
                style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s',
                }}
                onClick={() => navigate(`/worker/biddings/${app.bidding.id}`)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{app.bidding.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {app.bidding.client.name} {app.bidding.client.surname}
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#475569' }}>
                    <span><strong>Costo:</strong> {formatCurrency(app.offeredCost)}</span>
                    <span><strong>Duración:</strong> {app.offeredDuration ? `${app.offeredDuration} días` : '—'}</span>
                    {app.offeredStartDate && <span><strong>Inicio:</strong> {formatDate(app.offeredStartDate)}</span>}
                  </div>

                  {app.message && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                      {app.message}
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
                    <span>Ofertado el {formatDate(app.createdAt)}</span>
                    <span>&middot;</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={11} /> {formatAddress(app.bidding.description)}
                    </span>
                    {app.status === 'Accepted' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/create-subcontract', { state: { parentPostId: app.bidding.id } })
                        }}
                        style={{
                          marginLeft: 'auto',
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: '#0F172A', border: 'none', borderRadius: 8,
                          color: '#fff', fontSize: 12, fontWeight: 600,
                          padding: '6px 14px', cursor: 'pointer',
                        }}
                      >
                        Subcontratar
                      </button>
                    ) : app.status === 'Completed' && !app.hasReview ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setReviewTarget({ applicationId: app.applicationId, clientName: `${app.bidding.client.name} ${app.bidding.client.surname}` })
                        }}
                        style={{
                          marginLeft: 'auto',
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: '#10B981', border: 'none', borderRadius: 8,
                          color: '#fff', fontSize: 12, fontWeight: 600,
                          padding: '6px 14px', cursor: 'pointer',
                        }}
                      >
                        <Star size={13} /> Dejar reseña
                      </button>
                    ) : app.status === 'Completed' && app.hasReview ? (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                        <CheckCircle size={13} /> Reseña enviada
                      </span>
                    ) : (
                      <span style={{ marginLeft: 'auto', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600 }}>
                        Ver detalle <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          applicationId={reviewTarget.applicationId}
          clientName={reviewTarget.clientName}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setApplications((prev) => prev.map((a) =>
              a.applicationId === reviewTarget.applicationId ? { ...a, hasReview: true } : a
            ))
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
