import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchWorkerBiddings } from '../services/posts'
import type { WorkerBiddingDTO } from '../services/posts'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, Clock, CheckCircle, XCircle, AlertTriangle, MapPin, ChevronRight } from 'lucide-react'
import { formatAddress } from '../utils/address'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  Completed:  { label: 'Completada',  color: '#059669', bg: '#ECFDF5', icon: CheckCircle },
  Rejected:   { label: 'Rechazada',   color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  Dismissed:  { label: 'Desestimada', color: '#64748B', bg: '#F1F5F9', icon: AlertTriangle },
}

const FINAL_STATUSES = ['Completed', 'Rejected', 'Dismissed']

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

export default function WorkerBiddingHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<WorkerBiddingDTO[]>([])
  const [loading, setLoading] = useState(true)

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

  const filtered = applications.filter((a) => FINAL_STATUSES.includes(a.status))
  const counts = {
    Completed: filtered.filter((a) => a.status === 'Completed').length,
    Rejected: filtered.filter((a) => a.status === 'Rejected').length,
    Dismissed: filtered.filter((a) => a.status === 'Dismissed').length,
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
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Historial de licitaciones</h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 0 38px' }}>
            {loading ? 'Cargando…' : <><strong style={{ color: '#fff' }}>{filtered.length}</strong> ofertas finalizadas</>}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 3rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 16 }}>Cargando historial…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#fff' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <GitBranch size={24} color="#3B82F6" />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: '1.1rem', color: '#0F172A', fontWeight: 600 }}>Sin historial</h3>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              No tenés ofertas finalizadas. Las ofertas completadas, rechazadas o desestimadas aparecerán acá.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 13, color: '#64748B' }}>
              <span>Total: <strong>{filtered.length}</strong></span>
              <span>&middot;</span>
              <span style={{ color: '#059669' }}>Completadas: <strong>{counts.Completed}</strong></span>
              <span>&middot;</span>
              <span style={{ color: '#DC2626' }}>Rechazadas: <strong>{counts.Rejected}</strong></span>
              <span>&middot;</span>
              <span style={{ color: '#64748B' }}>Desestimadas: <strong>{counts.Dismissed}</strong></span>
            </div>

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
                      <span style={{ marginLeft: 'auto', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600 }}>
                        Ver detalle <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
