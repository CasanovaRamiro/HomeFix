import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClientProfile, getClientReviews, type ClientProfile, type ClientReview } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'
import { ArrowLeft, Star, Briefcase, Calendar } from 'lucide-react'

export default function PublicClientProfile() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [reviews, setReviews] = useState<ClientReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    const controller = new AbortController()
    getClientProfile(clientId)
      .then((c) => {
        if (controller.signal.aborted) return
        setClient(c)
        return getClientReviews(clientId)
      })
      .then((r) => {
        if (controller.signal.aborted || !r) return
        setReviews(r)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se encontró el cliente.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [clientId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#6B7280' }}>Cargando...</p>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: 16 }}>{error || 'Cliente no encontrado'}</p>
          <button
            onClick={() => navigate(-1 as never)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: '#0F172A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const fullName = `${client.name} ${client.surname}`.trim()
  const initials = fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = new Date(client.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const container = { maxWidth: 1024, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'system-ui, sans-serif' }}>
      {/* Back bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', height: 56 }}>
          <button
            onClick={() => navigate(-1 as never)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: '#374151',
              fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0,
            }}
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>

      <div style={{ ...container, paddingTop: isMobile ? 20 : 32, paddingBottom: 48 }}>

        {/* Mobile header */}
        {isMobile && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#E5E7EB', overflow: 'hidden' }}>
              {client.photo ? (
                <img src={client.photo} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 64, fontWeight: 700, color: '#9CA3AF',
                }}>
                  {initials}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                padding: 24,
              }}>
                <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{fullName}</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: '2px 0 0' }}>Cliente</p>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                  {client.averageRating > 0 ? client.averageRating.toFixed(1) : '—'}
                </span>
                <span style={{ color: '#6B7280', fontSize: 14 }}>
                  ({client.reviewCount} reseñas)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: Briefcase, label: 'Trabajos', value: String(client.completedJobs) },
                  { icon: Calendar, label: 'Miembro', value: memberSince },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ background: '#F3F4F6', borderRadius: 10, padding: 10 }}>
                    <p style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 2px' }}>{label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={13} color="#9CA3AF" />
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop layout */}
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Desktop header */}
            {!isMobile && (
              <div style={{ marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{fullName}</h1>
                <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 6px' }}>Cliente</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                    {client.averageRating > 0 ? client.averageRating.toFixed(1) : '—'}
                  </span>
                  <span style={{ color: '#6B7280', fontSize: 14 }}>
                    ({client.reviewCount} reseñas)
                  </span>
                </div>
              </div>
            )}

            {/* Bio */}
            {client.bio && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Sobre mí</h2>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{client.bio}</p>
              </div>
            )}

            {/* Desktop quick info */}
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Trabajos', value: String(client.completedJobs) },
                  { label: 'Calificación', value: client.averageRating > 0 ? client.averageRating.toFixed(1) : '—' },
                  { label: 'Miembro', value: memberSince },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16 }}>
                    <p style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                Reseñas ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map((r) => (
                    <div key={r.id} style={{ paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, color: '#111827', fontSize: 14, margin: 0 }}>{r.reviewer.name}</p>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={12} color={i <= r.rating ? '#10B981' : '#D1D5DB'} fill={i <= r.rating ? '#10B981' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{r.description}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>{new Date(r.createdAt).toLocaleDateString('es-AR')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0, padding: '24px 0' }}>
                  No hay reseñas aún
                </p>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Photo - only on desktop */}
            {!isMobile && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {client.photo ? (
                  <img src={client.photo} alt={fullName} style={{ width: '100%', display: 'block' }} />
                ) : (
                  <div style={{
                    width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#E5E7EB', fontSize: 64, fontWeight: 700, color: '#9CA3AF',
                  }}>
                    {initials}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Estadísticas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Trabajos Completados', value: String(client.completedJobs) },
                  { label: 'Calificación', value: client.averageRating > 0 ? client.averageRating.toFixed(1) : '—' },
                  { label: 'Reseñas', value: String(client.reviewCount) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
