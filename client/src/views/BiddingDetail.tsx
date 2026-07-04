import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Gavel, ArrowLeft, Calendar, MapPin, Clock, DollarSign, Trophy, User, Loader, Package, Image, Phone } from 'lucide-react'
import { fetchBiddingById, fetchBiddingApplications, selectBiddingWinner } from '../services/posts'
import type { Post } from '../types/post'
import type { ApplicationDTO } from '../services/posts'
import { formatWhatsAppNumber } from '../services/formatWhatsApp'
import { computeScores } from '../services/filtroPonderado'
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

  const canSelectWinner = bidding && (bidding.status === 'Evaluating') && !selectedWinner

  const handleSelectWinner = async (applicationId: string) => {
    if (!id) return
    setSelecting(applicationId)
    try {
      await selectBiddingWinner(id, applicationId)
      setSelectedWinner(applicationId)
    } catch {
      setError('Error al seleccionar el ganador')
    } finally {
      setSelecting(null)
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
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

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', marginTop: -20, position: 'relative', zIndex: 10 }}>
        {/* Info card */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 24 }}>
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
            {sortedApps.map(({ app }, index) => {
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

                  {/* Row 1: Avatar + Name + Stars */}
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

                  {/* Row 2: Price + Duration + Start date */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#475569', marginBottom: 12 }}>
                    {app.offeredCost !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={14} style={{ color: '#10B981' }} />
                        <strong>${app.offeredCost.toLocaleString('es-AR')}</strong>
                      </span>
                    )}
                    {app.offeredDuration !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} style={{ color: '#64748B' }} />
                        {app.offeredDuration} días
                      </span>
                    )}
                    {app.offeredStartDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={14} style={{ color: '#64748B' }} />
                        Inicio: {new Date(app.offeredStartDate).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Message */}
                  {app.message && (
                    <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', fontStyle: 'italic', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                      "{app.message}"
                    </p>
                  )}

                  {/* Row 4: Contactar + Contratar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {app.workerPhone && (
                      <button
                        onClick={() => window.open(
                          `https://wa.me/${formatWhatsAppNumber(app.workerPhone!)}?text=${encodeURIComponent('Hola, vi tu oferta en la licitación: ' + bidding?.title)}`,
                          '_blank'
                        )}
                        style={{
                          padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                          border: '1px solid #25D366', cursor: 'pointer',
                          background: '#fff', color: '#25D366',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Phone size={14} /> Contactar
                      </button>
                    )}
                    {canSelectWinner && !selectedWinner && (
                      <button
                        onClick={() => handleSelectWinner(app.id)}
                        disabled={selecting === app.id}
                        style={{
                          padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          background: index === 0 ? '#10B981' : '#E2E8F0',
                          color: index === 0 ? '#fff' : '#64748B',
                          transition: 'all 0.15s',
                        }}
                      >
                        {selecting === app.id ? 'Contratando...' : 'Contratar'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>
    </div>
  )
}
