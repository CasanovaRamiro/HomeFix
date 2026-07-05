import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchBiddingById, fetchWorkerBiddings } from '../services/posts'
import { applyToBidding } from '../services/applications'
import type { Post } from '../types/post'
import type { WorkerBiddingDTO } from '../services/posts'
import StarRating from '../components/ui/StarRating'
import { ArrowLeft, GitBranch, MapPin, Image as ImageIcon, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { formatAddress } from '../utils/address'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  Active:      { label: 'Activa',          color: '#059669', bg: '#ECFDF5' },
  Evaluating:  { label: 'En evaluación',   color: '#D97706', bg: '#FFFBEB' },
  InProgress:  { label: 'En progreso',     color: '#3B82F6', bg: '#EFF6FF' },
  Completed:   { label: 'Completada',      color: '#059669', bg: '#ECFDF5' },
  Cancelled:   { label: 'Cancelada',       color: '#DC2626', bg: '#FEF2F2' },
}

const APP_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  Pending:   { label: 'Pendiente',     color: '#D97706', bg: '#FFFBEB' },
  Active:    { label: 'Activa',        color: '#059669', bg: '#ECFDF5' },
  Accepted:  { label: 'Aceptada',      color: '#059669', bg: '#ECFDF5' },
  Rejected:  { label: 'Rechazada',     color: '#DC2626', bg: '#FEF2F2' },
  Dismissed: { label: 'Desestimada',   color: '#64748B', bg: '#F1F5F9' },
  Completed: { label: 'Completada',    color: '#059669', bg: '#ECFDF5' },
}

export default function WorkerBiddingDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState<Post | null>(null)
  const [myApp, setMyApp] = useState<WorkerBiddingDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const [offeredCost, setOfferedCost] = useState('')
  const [offeredDuration, setOfferedDuration] = useState('')
  const [offeredStartDate, setOfferedStartDate] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    (async () => {
      if (!id || !user) return
      try {
        const [postRes, appRes] = await Promise.all([
          fetchBiddingById(id),
          fetchWorkerBiddings(),
        ])
        setPost(postRes.data)
        const found = (appRes.data as WorkerBiddingDTO[]).find((a) => a.bidding.id === id)
        if (found) setMyApp(found)
      } catch {
        navigate('/worker')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user, navigate])

  const matLabel =
    post?.materialResponsibility === 'client' ? 'Cliente' :
    post?.materialResponsibility === 'worker' ? 'Worker' :
    'A convenir'

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleSubmit = async () => {
    if (!id || !user) return
    setError('')
    setSuccess('')

    const cost = parseFloat(offeredCost)
    if (!cost || cost <= 0) { setError('Ingresá un costo ofertado válido'); return }
    const dur = parseInt(offeredDuration)
    if (!dur || dur <= 0) { setError('Ingresá una duración estimada válida'); return }

    setSubmitting(true)
    try {
      await applyToBidding({
        postId: id,
        offeredCost: cost,
        offeredDuration: dur,
        offeredStartDate: offeredStartDate || undefined,
        message: message || undefined,
      })
      setSuccess('Oferta enviada exitosamente')
      const appRes = await fetchWorkerBiddings()
      const found = (appRes.data as WorkerBiddingDTO[]).find((a) => a.bidding.id === id)
      if (found) setMyApp(found)
      setTimeout(() => navigate('/worker/my-biddings'), 2000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      setError(e?.response?.data?.error || e?.message || 'Error al enviar la oferta')
    } finally {
      setSubmitting(false)
    }
  }

  const firstImage = post?.images?.[0]?.url

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 16, textAlign: 'center' }}>Cargando licitación…</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1E293B 100%)',
        width: '100%', paddingTop: 40, paddingBottom: 48,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(59,130,246,0.06)' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: '#94A3B8', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ArrowLeft size={14} />
              Volver
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_LABELS[post.status]?.bg ?? '#F1F5F9', color: STATUS_LABELS[post.status]?.color ?? '#64748B' }}>
              {STATUS_LABELS[post.status]?.label ?? post.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <GitBranch size={28} color="#3B82F6" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{post.title}</h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 0 38px' }}>
            Publicado el {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 32px 3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {firstImage && (
            <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 320, background: '#F1F5F9' }}>
              <img src={firstImage} alt="" style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            {post.categories?.map((c: { id?: string; name: string }) => (
              <span key={c.id ?? c.name} className="badge badge-bidding">{c.name}</span>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Descripción</h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{post.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <DollarSign size={16} color="#64748B" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Presupuesto máximo</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>
                {post.budgetMax ? `$${post.budgetMax.toLocaleString()}` : '—'}
              </span>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock size={16} color="#64748B" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Material a cargo</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{matLabel}</span>
            </div>

            {post.address && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MapPin size={16} color="#64748B" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Ubicación</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{formatAddress(post.address)}</span>
              </div>
            )}

            {post.endDate && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Calendar size={16} color="#64748B" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Fecha límite</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{formatDate(post.endDate)}</span>
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#3B82F6' }}>
              {post.user?.name?.charAt(0).toUpperCase() ?? 'C'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {post.user?.name} {post.user?.surname}
              </div>
              {post.user?.rating != null && <StarRating rating={post.user.rating} />}
            </div>
          </div>

          {myApp ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle size={20} color="#3B82F6" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Tu oferta</h2>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: APP_STATUS_LABELS[myApp.status]?.bg ?? '#F1F5F9', color: APP_STATUS_LABELS[myApp.status]?.color ?? '#64748B' }}>
                  {APP_STATUS_LABELS[myApp.status]?.label ?? myApp.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 12, fontSize: 14 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 12 }}>Costo ofertado</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {myApp.offeredCost != null ? `$${myApp.offeredCost.toLocaleString()}` : '—'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 12 }}>Duración estimada</span>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                    {myApp.offeredDuration ? `${myApp.offeredDuration} días` : '—'}
                  </div>
                </div>
                {myApp.offeredStartDate && (
                  <div>
                    <span style={{ color: '#64748B', fontSize: 12 }}>Inicio estimado</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{formatDate(myApp.offeredStartDate)}</div>
                  </div>
                )}
              </div>

              {myApp.message && (
                <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Mensaje:</span>
                  {myApp.message}
                </div>
              )}
            </div>
          ) : post.status === 'Active' ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Enviar oferta</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Costo ofertado ($) *</label>
                  <input
                    type="number" placeholder="Ej: 250000"
                    value={offeredCost} onChange={(e) => setOfferedCost(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Duración estimada (días) *</label>
                  <input
                    type="number" placeholder="Ej: 15"
                    value={offeredDuration} onChange={(e) => setOfferedDuration(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Fecha de inicio estimada</label>
                <input
                  type="date"
                  value={offeredStartDate} onChange={(e) => setOfferedStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Mensaje al cliente</label>
                <textarea
                  placeholder="Contá por qué te gustaría tomar este trabajo..."
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 80, resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#991B1B' }}>
                  <AlertCircle size={15} color="#DC2626" />
                  {error}
                </div>
              )}

              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#065F46' }}>
                  <CheckCircle size={15} color="#059669" />
                  {success}
                </div>
              )}

              <button
                disabled={submitting}
                onClick={handleSubmit}
                style={{
                  padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: '#3B82F6', color: '#fff', border: 'none',
                  opacity: submitting ? 0.6 : 1, fontFamily: 'inherit',
                }}
              >
                {submitting ? 'Enviando...' : 'Enviar oferta'}
              </button>
            </div>
          ) : (
            <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '16px 20px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9A3412' }}>
              <AlertCircle size={16} color="#EA580C" />
              Esta licitación no acepta nuevas ofertas ({STATUS_LABELS[post.status]?.label ?? post.status}).
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
