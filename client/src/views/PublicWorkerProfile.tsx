import { useEffect, useState } from 'react'
import ImageViewer from '../components/ImageViewer'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorker, getWorkerReviews, getWorkerStats, type Worker, type WorkerReview, type WorkerStats } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'
import { ArrowLeft, Star, Briefcase, XCircle, Flag, CheckCircle2 } from 'lucide-react'
import WorkerReviews from '../components/worker/WorkerReviews'

export default function PublicWorkerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [worker, setWorker] = useState<Worker | null>(null)
  const [reviews, setReviews] = useState<WorkerReview[]>([])
  const [stats, setStats] = useState<WorkerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    Promise.all([
      getWorker(id),
      getWorkerReviews(id),
      getWorkerStats(id),
    ])
      .then(([w, r, s]) => {
        if (controller.signal.aborted) return
        setWorker(w)
        setReviews(r)
        setStats(s)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se encontró el profesional.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#6B7280' }}>Cargando...</p>
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: 16 }}>{error || 'Profesional no encontrado'}</p>
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

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const initials = worker.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = new Date(worker.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const categoryNames = worker.categories.map((c) => c.name)

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
            Volver a resultados
          </button>
        </div>
      </div>

      <div style={{ ...container, paddingTop: isMobile ? 20 : 32, paddingBottom: 48 }}>

        {/* Mobile layout */}
        {isMobile && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 }}>
            {/* Photo */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#E5E7EB', overflow: 'hidden' }}>
              {worker.photo ? (
                <img src={worker.photo} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{worker.name}</h1>
                  {worker.isVerified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(16, 185, 129, 0.2)', color: '#34D399',
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                      <CheckCircle2 size={13} />
                      Verificado
                    </span>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: '2px 0 0' }}>
                  {categoryNames.join(' · ')}
                </p>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: 16 }}>
              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
                <span style={{ color: '#6B7280', fontSize: 14 }}>
                  ({reviews.length} reseñas)
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: Briefcase, label: 'Trabajos Completados', value: stats ? String(stats.totalJobs) : '—' },
                  { icon: Star, label: 'Calificación', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
                  { icon: XCircle, label: 'Trabajos Cancelados', value: stats ? String(stats.cancelledJobs) : '—' },
                  { icon: Flag, label: 'Reportes', value: stats ? String(stats.reports) : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ background: '#F3F4F6', borderRadius: 10, padding: 10 }}>
                    <div style={{ height: 26, display: 'flex', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>{label}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Icon size={13} color="#9CA3AF" />
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile availability */}
              {worker.availability.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Disponibilidad Horaria</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                      const available = worker.availability.includes(day)
                      return (
                        <div key={day} style={{
                          padding: '8px 2px', borderRadius: 8, textAlign: 'center',
                          fontSize: 11, fontWeight: 600,
                          background: available ? '#10B981' : '#F3F4F6',
                          color: available ? '#fff' : '#9CA3AF',
                        }}>
                          {day.substring(0, 3)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{worker.name}</h1>
                  {worker.isVerified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#ECFDF5', color: '#059669',
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      border: '1px solid #A7F3D0',
                    }}>
                      <CheckCircle2 size={13} />
                      Verificado
                    </span>
                  )}
                </div>
                <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 6px' }}>{categoryNames.join(' · ')}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                  <span style={{ color: '#6B7280', fontSize: 14 }}>
                    ({reviews.length} reseñas)
                  </span>
                </div>
              </div>
            )}

            {/* Bio */}
            {worker.bio && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Sobre mí</h2>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{worker.bio}</p>
              </div>
            )}

            {/* Desktop quick info */}
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Trabajos Completados', value: stats ? String(stats.totalJobs) : '—' },
                  { label: 'Calificación', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
                  { label: 'Trabajos Cancelados', value: stats ? String(stats.cancelledJobs) : '—' },
                  { label: 'Reportes', value: stats ? String(stats.reports) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16 }}>
                    <div style={{ height: 26, display: 'flex', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>{label}</p>
                    </div>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: '8px 0 0' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Availability */}
            {worker.availability.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Disponibilidad Horaria</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                    const available = worker.availability.includes(day)
                    return (
                      <div key={day} style={{
                        padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                        fontSize: 12, fontWeight: 600,
                        background: available ? '#10B981' : '#F3F4F6',
                        color: available ? '#fff' : '#9CA3AF',
                      }}>
                        {day.substring(0, 3)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Gallery */}
            {worker.gallery?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Galería de Trabajos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {worker.gallery.map((img) => (
                    <div key={img.id}>
                      <img src={img.imageUrl} alt={img.caption ?? ''} onClick={() => setZoomedImage(img.imageUrl)} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }} />
                      {img.caption && <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>{img.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <WorkerReviews reviews={reviews} loading={loading} workerName={worker.name} />
          </div>

          {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Photo - only on desktop */}
              {!isMobile && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {worker.photo ? (
                  <img src={worker.photo} alt={worker.name} style={{ width: '100%', display: 'block' }} />
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
                    { label: 'Trabajos Completados', value: stats ? String(stats.totalJobs) : '—' },
                    { label: 'Calificación', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
                    { label: 'Trabajos Cancelados', value: stats ? String(stats.cancelledJobs) : '—' },
                    { label: 'Reportes', value: stats ? String(stats.reports) : '—' },
                    { label: 'Ubicación', value: worker.location ?? '—' },
                    { label: 'Miembro desde', value: memberSince },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificates */}
              {worker.certificates?.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Certificaciones</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {worker.certificates.map((c) => {
                      const isPdf = c.imageUrl?.endsWith('.pdf')
                      const thumb = isPdf ? c.imageUrl.replace('/upload/', '/upload/w_120,h_120,c_fill/') : c.imageUrl
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, background: '#F9FAFB', borderRadius: 12 }}>
                          <img src={thumb} alt={c.title} onClick={() => !isPdf && setZoomedImage(c.imageUrl)} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: isPdf ? 'default' : 'pointer' }} />
                          <div>
                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 14, margin: 0 }}>{c.title}</p>
                            {c.issuer && <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{c.issuer}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      {zoomedImage && <ImageViewer src={zoomedImage} alt="Galería" onClose={() => setZoomedImage(null)} />}
    </div>
  )
}
