import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Gavel, ArrowLeft, Calendar, MapPin, DollarSign, Trophy, User, Loader, Package, Image, MessageCircle, PauseCircle, Play, CheckCircle, XCircle, UserX } from 'lucide-react'
import { fetchBiddingById, selectBiddingWinner } from '../services/posts'
import { fetchBiddingApplications, type ApplicationDTO } from '../services/applications'
import { pausePost, cancelPost, closeBidding, completePost } from '../services/posts'
import type { Post } from '../types/post'
import { formatWhatsAppNumber } from '../services/formatWhatsApp'
import { computeScores } from '../services/filtroPonderado'
import { dismissWorker } from '../services/applications'
import ConfirmModal from '../components/ui/ConfirmModal'
import LandingFooter from '../components/landing/LandingFooter'

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  Active: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)', label: 'Activa' },
  Evaluating: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Evaluando' },
  'In progress': { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'En curso' },
  Completed: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Completada' },
  Cancelled: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Cancelada' },
}

const materialLabels: Record<string, string> = {
  client: 'Cliente',
  licitator: 'Licitador (profesional)',
  to_agree: 'A convenir',
}

const materialColors: Record<string, string> = {
  client: '#059669',
  licitator: '#2563EB',
  to_agree: '#F59E0B',
}

export default function BiddingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [bidding, setBidding] = useState<Post | null>(null)
  const [applications, setApplications] = useState<ApplicationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selecting, setSelecting] = useState<string | null>(null)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('bestOffer')
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false)
  const [pauseLoading, setPauseLoading] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchBiddingById(id),
      fetchBiddingApplications(id).catch(() => null),
    ])
      .then(([bRes, appsRes]) => {
        if (cancelled) return
        setBidding(bRes.data)
        setApplications(appsRes?.data ?? [])
        if (bRes.data.status === 'In progress') {
          const winner = appsRes?.data?.find((app: ApplicationDTO) => app.status === 'Accepted')
          if (winner) setSelectedWinner(winner.id)
        }
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar la licitación') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const weights: string[] = (() => {
    if (!bidding) return []
    try {
      const parsed = JSON.parse((bidding as unknown as Record<string, unknown>).bidWeights as string || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const weightLabels: Record<string, string> = {
    offeredCost: 'Costo',
    duration: 'Duración',
    startDate: 'Fecha inicio',
    minRating: 'Calificación del licitante',
  }

  const scored = computeScores(applications, weights)

  const displayApp = selectedWinner
    ? applications.find((a) => a.id === selectedWinner) ?? null
    : scored[0]?.app ?? null

  const sortedApps = (() => {
    const list = sortBy === 'bestOffer' ? [...scored] : [...scored]
    switch (sortBy) {
      case 'price':
        list.sort((a, b) => (a.app.offeredCost ?? Infinity) - (b.app.offeredCost ?? Infinity))
        break
      case 'duration':
        list.sort((a, b) => (a.app.offeredDuration ?? Infinity) - (b.app.offeredDuration ?? Infinity))
        break
      case 'startDate':
        list.sort((a, b) => (a.app.offeredStartDate ?? '').localeCompare(b.app.offeredStartDate ?? ''))
        break
      case 'rating':
        list.sort((a, b) => (b.app.workerRating ?? 0) - (a.app.workerRating ?? 0))
        break
    }
    return list
  })()

  const Stars = ({ rating }: { rating: number }) => {
    const rounded = Math.round(rating)
    return (
      <span style={{ display: 'inline-flex', gap: 1, verticalAlign: 'middle' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ fontSize: 13, color: i <= rounded ? '#F59E0B' : '#CBD5E1' }}>
            {i <= rounded ? '★' : '☆'}
          </span>
        ))}
      </span>
    )
  }

  const canSelectWinner = bidding && (bidding.status === 'Active' || bidding.status === 'Evaluating') && !selectedWinner

  const handleSelectWinner = async (applicationId: string) => {
    if (!id) return
    setSelecting(applicationId)
    try {
      await selectBiddingWinner(id, applicationId)
      setSelectedWinner(applicationId)
      setBidding((prev) => prev ? { ...prev, status: 'In progress' } : prev)
    } catch {
      setError('Error al seleccionar el ganador')
    } finally {
      setSelecting(null)
    }
  }

  const handlePause = async () => {
    if (!id) return
    setPauseLoading(true)
    try {
      await pausePost(id)
      window.location.reload()
    } catch {
      setPauseLoading(false)
      setPauseConfirmOpen(false)
      setError('Error al pausar la licitación')
    }
  }

  const handleClose = async () => {
    if (!id) return
    setCloseLoading(true)
    try {
      await closeBidding(id)
      window.location.reload()
    } catch {
      setCloseLoading(false)
      setCloseConfirmOpen(false)
      setError('Error al cerrar la licitación')
    }
  }

  const handleCancel = async () => {
    if (!id) return
    setCancelLoading(true)
    try {
      await cancelPost(id)
      window.location.reload()
    } catch {
      setCancelLoading(false)
      setCancelConfirmOpen(false)
      setError('Error al cancelar la licitación')
    }
  }

  const winnerApp = applications.find((app) => app.id === selectedWinner)

  const handleDismiss = async () => {
    if (!id || !selectedWinner) return
    setDismissing(true)
    try {
      await dismissWorker(selectedWinner)
      setDismissModalOpen(false)
      navigate('/review', {
        state: {
          postId: id,
          applicationId: selectedWinner,
          titulo: bidding?.title,
          fecha: bidding?.endDate,
          ubicacion: bidding?.address,
          trabajador: {
            id: winnerApp?.workerId ?? '',
            nombre: winnerApp?.workerName ?? '',
            categoria: '',
            imagen: winnerApp?.workerPhoto ?? undefined,
            verificado: false,
          },
        },
      })
    } catch {
      setDismissing(false)
      setError('Error al despedir al trabajador')
    }
  }

  const handleFinalize = async () => {
    if (!id || !selectedWinner) return
    setFinalizeLoading(true)
    try {
      await completePost(id)
      navigate('/review', {
        state: {
          postId: id,
          titulo: bidding?.title,
          fecha: bidding?.endDate,
          ubicacion: bidding?.address,
          trabajador: {
            id: winnerApp?.workerId ?? '',
            nombre: winnerApp?.workerName ?? '',
            categoria: '',
            imagen: winnerApp?.workerPhoto ?? undefined,
            verificado: false,
          },
        },
      })
    } catch {
      setFinalizeLoading(false)
      setFinalizeConfirmOpen(false)
      setError('Error al finalizar la licitación')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader size={32} style={{ animation: 'spin 0.7s linear infinite', color: '#10B981' }} />
      </div>
    )
  }

  if (error || !bidding) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#64748B' }}>{error || 'Licitación no encontrada'}</p>
        <button onClick={() => navigate('/client/biddings')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Volver a licitaciones
        </button>
      </div>
    )
  }

  const ss = statusStyles[bidding.status] || { color: '#64748B', bg: 'rgba(148,163,184,0.1)', label: bidding.status }
  const materialLabel = materialLabels[bidding.materialResponsibility || '']
  const materialColor = materialColors[bidding.materialResponsibility || '']

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      {/* Header verde */}
      <div style={{ background: '#059669', width: '100%', paddingTop: 32, paddingBottom: 40 }}>
        <div className="hf-container" style={{ padding: '0 32px' }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>{bidding.title}</h1>
        </div>
      </div>

      <div className="hf-container" style={{ padding: '0 32px', marginTop: -20, position: 'relative', zIndex: 10 }}>
        <div className="bd-grid">
          {/* Info card */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, background: ss.bg, color: ss.color }}>
              {ss.label}
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>{bidding.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontSize: 13, color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> Cierre: {new Date(bidding.endDate).toLocaleDateString('es-AR')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> {bidding.address}
            </span>
            {materialLabel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={14} style={{ color: materialColor }} />
                Materiales: <strong style={{ color: materialColor }}>{materialLabel}</strong>
              </span>
            )}
          </div>

          {(bidding.budgetMin || bidding.budgetMax) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              <DollarSign size={14} style={{ color: '#10B981' }} />
              Presupuesto estimado: <strong style={{ color: '#0F172A' }}>
                ${(bidding.budgetMin || 0).toLocaleString('es-AR')} — ${(bidding.budgetMax || 0).toLocaleString('es-AR')}
              </strong>
            </div>
          )}

          {bidding.categories && bidding.categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {bidding.categories.map(c => (
                <span key={c.id} style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                  background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
                }}>
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {bidding.images && bidding.images.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Image size={13} /> Imágenes
              </p>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {bidding.images.map((img, i) => (
                  <img key={i} src={img.url} alt=""
                    style={{ width: 100, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ))}
              </div>
            </div>
          )}

          {weights.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
              <Trophy size={13} style={{ color: '#F59E0B' }} />
              Prioridad: {weights.map(w => weightLabels[w] || w).join(' > ')}
            </div>
          )}

          {bidding.status === 'Active' && (
            <div className="pc-manage">
              <button className="pd-btn pd-btn--warning" onClick={() => setPauseConfirmOpen(true)}>
                <PauseCircle size={16} /> Pausar licitación
              </button>
              <button className="pd-btn pd-btn--accent" onClick={() => setCloseConfirmOpen(true)}>
                <CheckCircle size={16} /> Poner en evaluación
              </button>
              <button className="pd-btn pd-btn--danger" onClick={() => setCancelConfirmOpen(true)}>
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          )}

          {bidding.status === 'Evaluating' && (
            <div className="pc-manage">
              <button className="pd-btn pd-btn--danger" onClick={() => setCancelConfirmOpen(true)}>
                <XCircle size={16} /> Cancelar licitación
              </button>
            </div>
          )}

          {bidding.status === 'In progress' && selectedWinner && (
            <div className="pc-manage" style={{ justifyContent: 'space-between' }}>
              <button className="pd-btn pd-btn--accent" onClick={() => setFinalizeConfirmOpen(true)}>
                <CheckCircle size={16} /> Finalizar
              </button>
              <button className="pd-btn pd-btn--danger" onClick={() => setDismissModalOpen(true)}>
                <UserX size={16} /> Despedir Adjudicatario
              </button>
            </div>
          )}

          <ConfirmModal
            open={dismissModalOpen}
            title="Despedir Adjudicatario"
            message="¿Seguro que querés despedir al adjudicatario? La licitación volverá a estado de evaluación y podrás seleccionar otra oferta."
            confirmLabel="Sí, despedir"
            onConfirm={handleDismiss}
            onCancel={() => { setDismissModalOpen(false); setDismissing(false) }}
            loading={dismissing}
            danger
          />

          <ConfirmModal
            open={pauseConfirmOpen}
            title={bidding.status === 'Paused' ? 'Reanudar licitación' : 'Pausar licitación'}
            message={bidding.status === 'Paused' ? '¿Reanudar la licitación para recibir nuevas ofertas?' : '¿Pausar la licitación? Las ofertas actuales se conservarán pero no se aceptarán nuevas.'}
            confirmLabel={bidding.status === 'Paused' ? 'Reanudar' : 'Pausar'}
            onConfirm={handlePause}
            onCancel={() => { setPauseConfirmOpen(false); setPauseLoading(false) }}
            loading={pauseLoading}
            danger={bidding.status === 'Active'}
          />

          <ConfirmModal
            open={closeConfirmOpen}
            title="Poner en evaluación"
            message="¿Cerrar la licitación y pasar las ofertas a evaluación? Ya no se aceptarán nuevas ofertas."
            confirmLabel="Cerrar y evaluar"
            onConfirm={handleClose}
            onCancel={() => { setCloseConfirmOpen(false); setCloseLoading(false) }}
            loading={closeLoading}
          />

          <ConfirmModal
            open={cancelConfirmOpen}
            title="Cancelar licitación"
            message="¿Estás seguro de cancelar esta licitación? Esta acción no se puede deshacer."
            confirmLabel="Sí, cancelar"
            onConfirm={handleCancel}
            onCancel={() => { setCancelConfirmOpen(false); setCancelLoading(false) }}
            loading={cancelLoading}
            danger
          />

          <ConfirmModal
            open={finalizeConfirmOpen}
            title="Finalizar licitación"
            message="¿Estás seguro de finalizar esta licitación? El trabajador recibirá notificación y podrás dejar una reseña."
            confirmLabel="Sí, finalizar"
            onConfirm={handleFinalize}
            onCancel={() => { setFinalizeConfirmOpen(false); setFinalizeLoading(false) }}
            loading={finalizeLoading}
          />

          {bidding.status === 'Paused' && (
            <div className="pc-manage">
              <button className="pd-btn pd-btn--warning" onClick={() => setPauseConfirmOpen(true)}>
                <Play size={16} /> Reanudar licitación
              </button>
              <button className="pd-btn pd-btn--accent" onClick={() => setCloseConfirmOpen(true)}>
                <CheckCircle size={16} /> Poner en evaluación
              </button>
              <button className="pd-btn pd-btn--danger" onClick={() => setCancelConfirmOpen(true)}>
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          )}
        </div>

          {displayApp && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {selectedWinner ? (
                  <CheckCircle size={18} color="#10B981" />
                ) : (
                  <Trophy size={18} color="#F59E0B" />
                )}
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {selectedWinner ? 'Oferta contratada' : 'Mejor oferta'}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {displayApp.workerPhoto ? (
                  <img src={displayApp.workerPhoto} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={20} style={{ color: '#94A3B8' }} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{displayApp.workerName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    <Stars rating={displayApp.workerRating} />
                    <span>({displayApp.workerReviewCount} reseñas)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, fontSize: 13 }}>
                <div style={{ color: '#475569' }}>
                  <span style={{ color: '#64748B' }}>Presupuesto:</span>{' '}
                  <strong>${displayApp.offeredCost?.toLocaleString('es-AR') ?? '—'}</strong>
                </div>
                {displayApp.offeredDuration != null && (
                  <div style={{ color: '#475569' }}>
                    <span style={{ color: '#64748B' }}>Días estimados:</span>{' '}
                    <strong>{displayApp.offeredDuration} días</strong>
                  </div>
                )}
                {displayApp.offeredStartDate && (
                  <div style={{ color: '#475569' }}>
                    <span style={{ color: '#64748B' }}>Inicio de obra:</span>{' '}
                    <strong>{new Date(displayApp.offeredStartDate).toLocaleDateString('es-AR')}</strong>
                  </div>
                )}
              </div>

              {displayApp.message && (
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', fontStyle: 'italic' }}>
                  "{displayApp.message}"
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pd-btn pd-btn--whatsapp"
                  style={{ flex: 1 }}
                  onClick={() => window.open(
                    `https://wa.me/${formatWhatsAppNumber(displayApp.workerPhone!)}?text=${encodeURIComponent('Hola, vi tu oferta en la licitación: ' + bidding?.title)}`,
                    '_blank'
                  )}
                >
                  <MessageCircle size={16} /> Contactar
                </button>

                {!selectedWinner && canSelectWinner && (
                  <button
                    className="pd-btn pd-btn--accent"
                    style={{ flex: 1 }}
                    onClick={() => handleSelectWinner(displayApp.id)}
                    disabled={selecting === displayApp.id}
                  >
                    {selecting === displayApp.id ? 'Contratando...' : 'Contratar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Offers section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Ofertas recibidas ({applications.length})
          </h2>
          {applications.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                fontSize: 13, fontWeight: 500, color: '#0F172A', background: '#fff',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="bestOffer">Mejor oferta</option>
              <option value="price">Precio</option>
              <option value="duration">Duración</option>
              <option value="startDate">Inicio Estimado</option>
              <option value="rating">Calificación</option>
            </select>
          )}
        </div>

        {applications.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
            <Gavel size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>Todavía no hay ofertas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
            {sortedApps.map(({ app }) => {
              const isWinner = selectedWinner === app.id
              return (
                <div key={app.id} style={{
                  background: isWinner ? '#F0FDF4' : '#fff',
                  border: `1px solid ${isWinner ? '#BBF7D0' : '#E2E8F0'}`,
                  borderRadius: 16, padding: 20, position: 'relative', transition: 'box-shadow 0.2s',
                }}>
                  {isWinner && (
                    <div style={{ position: 'absolute', top: -1, right: 20, background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: '0 0 8px 8px' }}>
                      Ganador
                    </div>
                  )}

                  {/* Flex row: left content + right buttons */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Left: Avatar + Name + Stars + Details + Message */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        {app.workerPhoto ? (
                          <img src={app.workerPhoto} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={18} style={{ color: '#94A3B8' }} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{app.workerName}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            <Stars rating={app.workerRating} />
                            <span style={{ color: '#94A3B8' }}>({app.workerReviewCount} reseñas)</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 13 }}>
                        {app.offeredCost !== null && (
                          <div style={{ color: '#475569' }}>
                            <span style={{ color: '#64748B' }}>Presupuesto:</span>{' '}
                            <strong>${app.offeredCost.toLocaleString('es-AR')}</strong>
                          </div>
                        )}
                        {app.offeredDuration !== null && (
                          <div style={{ color: '#475569' }}>
                            <span style={{ color: '#64748B' }}>Días estimados de ejecución:</span>{' '}
                            <strong>{app.offeredDuration} días</strong>
                          </div>
                        )}
                        {app.offeredStartDate && (
                          <div style={{ color: '#475569' }}>
                            <span style={{ color: '#64748B' }}>Inicio de obra:</span>{' '}
                            <strong>{new Date(app.offeredStartDate).toLocaleDateString('es-AR')}</strong>
                          </div>
                        )}
                      </div>

                      {app.message && (
                        <p style={{ fontSize: 13, color: '#475569', margin: 0, fontStyle: 'italic' }}>
                          "{app.message}"
                        </p>
                      )}
                    </div>

                    {/* Right: Buttons apilados */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      {app.workerPhone && (
                        <button
                          className="pd-btn pd-btn--whatsapp"
                          onClick={() => window.open(
                            `https://wa.me/${formatWhatsAppNumber(app.workerPhone!)}?text=${encodeURIComponent('Hola, vi tu oferta en la licitación: ' + bidding?.title)}`,
                            '_blank'
                          )}
                        >
                          <MessageCircle size={16} /> Contactar
                        </button>
                      )}
                      {canSelectWinner && !selectedWinner && (
                        <button
                          className="pd-btn pd-btn--accent"
                          onClick={() => handleSelectWinner(app.id)}
                          disabled={selecting === app.id}
                        >
                          {selecting === app.id ? 'Contratando...' : 'Contratar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        @media (max-width: 768px) { .bd-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>
    </div>
  )
}
