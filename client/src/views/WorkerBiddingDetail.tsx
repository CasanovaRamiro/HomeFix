import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { fetchBiddingById, fetchWorkerBiddings } from '../services/posts'
import { applyToBidding } from '../services/applications'
import type { Post } from '../types/post'
import type { WorkerBiddingDTO } from '../services/posts'
import { DollarSign, User, Star, Calendar, Building, ArrowLeft } from 'lucide-react'

export default function WorkerBiddingDetail() {
  const { id } = useParams<{ id: string }>()
  const theme = useTheme()
  const navigate = useNavigate()
  const [bidding, setBidding] = useState<Post | null>(null)
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
    if (!id) return
    Promise.all([
      fetchBiddingById(id).then((r) => setBidding(r.data)),
      fetchWorkerBiddings().then((r) => {
        const found = r.data.find((a) => a.bidding.id === id)
        if (found) {
          setMyApp(found)
          setOfferedCost(found.offeredCost?.toString() ?? '')
          setOfferedDuration(found.offeredDuration?.toString() ?? '')
          setOfferedStartDate(found.offeredStartDate ?? '')
          setMessage(found.message ?? '')
        }
      }),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const statusLabel = (s?: string) => {
    switch (s) {
      case 'Active': return 'Activa'
      case 'Evaluating': return 'En evaluación'
      case 'InProgress': return 'En curso'
      case 'Completed': return 'Completada'
      default: return s ?? ''
    }
  }

  const appStatusLabel = (s?: string) => {
    switch (s) {
      case 'Pending': return 'Tu oferta está pendiente'
      case 'Evaluating': return 'El cliente está evaluando las ofertas'
      case 'Accepted': return 'Felicitaciones, tu oferta fue aceptada'
      case 'Rejected': return 'Tu oferta no fue seleccionada'
      case 'Dismissed': return 'Fuiste desestimado de esta licitación'
      default: return ''
    }
  }

  const handleSubmit = async () => {
    if (!id) return
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
      const res = await fetchWorkerBiddings()
      const found = res.data.find((a) => a.bidding.id === id)
      if (found) setMyApp(found)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      setError(e?.response?.data?.error || e?.message || 'Error al enviar la oferta')
    } finally {
      setSubmitting(false)
    }
  }

  const s = {
    page: { maxWidth: '80rem', margin: '0 auto', padding: '2rem' },
    back: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: theme.muted, fontSize: '0.875rem', marginBottom: '1.5rem', background: 'none', border: 'none', padding: 0 },
    card: { background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
    label: { fontSize: '0.8125rem', fontWeight: 600, color: theme.muted, marginBottom: '0.3rem', display: 'block' },
    input: { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '0.875rem', background: theme.card, color: 'inherit', boxSizing: 'border-box' as const },
    badge: (_name: string) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: theme.activeBg, color: theme.primaryDark, marginRight: '0.4rem', marginBottom: '0.4rem' }),
  }

  if (loading) return <div style={s.page}><div style={{ color: theme.muted }}>Cargando...</div></div>
  if (!bidding) return <div style={s.page}><div style={{ color: theme.muted }}>Licitación no encontrada</div></div>

  const hasApplied = !!myApp

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={s.card}>
        <div style={{ marginBottom: '0.75rem' }}>
          {bidding.categories?.map((c: { id: string; name: string }) => (
            <span key={c.id} style={s.badge(c.name)}>{c.name}</span>
          ))}
        </div>

        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.primaryDark, marginBottom: '0.5rem' }}>
          {bidding.title}
        </div>

        <div style={{ fontSize: '0.875rem', color: theme.muted, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
          {bidding.description}
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: theme.muted, marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '1rem' }}>
            <User size={14} /> {bidding.user?.name} {bidding.user?.surname}
          </span>
          {'clientRating' in bidding && bidding.clientRating != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginRight: '1rem' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {bidding.clientRating.toFixed(1)}
            </span>
          )}
          {bidding.budgetMax != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '1rem' }}>
              <DollarSign size={14} /> Hasta ${bidding.budgetMax.toLocaleString()}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '1rem' }}>
            <Building size={14} /> {bidding.materialResponsibility === 'client' ? 'Material: cliente' : bidding.materialResponsibility === 'worker' ? 'Material: worker' : 'A convenir'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} /> Estado: {statusLabel(bidding.status)}
          </span>
        </div>
      </div>

      {myApp && (
        <div style={s.card}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.primaryDark, marginBottom: '0.75rem' }}>
            Tu oferta
          </div>
          <div style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.75rem' }}>
            {appStatusLabel(myApp.status)}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: theme.primaryDark }}>
            <span><strong>Costo:</strong> ${myApp.offeredCost?.toLocaleString() ?? '-'}</span>
            <span><strong>Duración:</strong> {myApp.offeredDuration ?? '-'} días</span>
            {myApp.offeredStartDate && <span><strong>Inicio:</strong> {new Date(myApp.offeredStartDate).toLocaleDateString()}</span>}
          </div>
          {myApp.message && <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: theme.muted, fontStyle: 'italic' }}>"{myApp.message}"</div>}
        </div>
      )}

      {!hasApplied && bidding.status === 'Active' && (
        <div style={s.card}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.primaryDark, marginBottom: '1rem' }}>
            Enviar oferta
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={s.label}>Costo ofertado ($) *</label>
            <input style={s.input} type="number" placeholder="Ej: 250000" value={offeredCost} onChange={(e) => setOfferedCost(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={s.label}>Duración estimada (días) *</label>
            <input style={s.input} type="number" placeholder="Ej: 15" value={offeredDuration} onChange={(e) => setOfferedDuration(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={s.label}>Fecha de inicio estimada</label>
            <input style={s.input} type="date" value={offeredStartDate} onChange={(e) => setOfferedStartDate(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={s.label}>Mensaje al cliente</label>
            <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} placeholder="Contá por qué te gustaría tomar este trabajo..."
              value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{success}</div>}

          <button
            style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.primaryDark, color: '#fff', opacity: submitting ? 0.6 : 1 }}
            disabled={submitting} onClick={handleSubmit}
          >
            {submitting ? 'Enviando...' : 'Enviar oferta'}
          </button>
        </div>
      )}

      {!hasApplied && bidding.status !== 'Active' && (
        <div style={{ color: theme.muted, fontSize: '0.875rem' }}>
          Esta licitación ya no está disponible para recibir ofertas.
        </div>
      )}
    </div>
  )
}
