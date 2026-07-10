import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Clock, Tag, User,
  CheckCircle, AlertCircle, Loader2, ImageIcon, MessageCircle, Star, Flag,
} from 'lucide-react'
import api from '../services/api'
import { workerCompletePost } from '../services/posts'
import type { PostDTO } from '../types/post'
import { ApplicationStatus } from '../types/application'
import { formatWhatsAppNumber } from '../services/formatWhatsApp'
import { fetchMySubcontractManager } from '../services/posts'
import StartTokenWorkerCard from '../components/post/StartTokenWorkerCard'
import ReviewModal from '../components/review/ReviewModal'
import ReportModal from '../components/report/ReportModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyApplication {
  id: string
  postId: string
  status: string
  appliedAt: string
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  message: string | null
  clientPhone: string | null
  scheduledDate: string | null
  serviceDate: string | null
  hasReview: boolean
  requiresStartToken: boolean
  startToken: string | null
  startTokenExpiresAt: string | null
  tokenValidatedAt: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string; icon: typeof CheckCircle }> = {
  [ApplicationStatus.Pending]:   { label: 'Pendiente',   bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', icon: Clock },
  [ApplicationStatus.Accepted]:  { label: 'Aceptada',    bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: CheckCircle },
  [ApplicationStatus.Rejected]:  { label: 'Rechazada',   bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: AlertCircle },
  [ApplicationStatus.Completed]: { label: 'Completada',  bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: CheckCircle },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color="#64748B" />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function ImageGallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)

  if (images.length === 0) {
    return (
      <div style={{ height: 220, background: '#F8FAFC', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #E2E8F0' }}>
        <ImageIcon size={32} color="#CBD5E1" />
        <span style={{ fontSize: 13, color: '#94A3B8' }}>Sin imágenes</span>
      </div>
    )
  }

  return (
    <>
      <div style={{ borderRadius: 16, overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }} onClick={() => setZoom(true)}>
        <img src={images[active].url} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
        {images.length > 1 && (
          <span style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            {active + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
          {images.map((img, i) => (
            <img key={i} src={img.url} alt="" onClick={() => setActive(i)}
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', flexShrink: 0, border: i === active ? '2px solid #0F172A' : '2px solid transparent', opacity: i === active ? 1 : 0.6, transition: 'opacity 0.15s, border 0.15s' }} />
          ))}
        </div>
      )}
      {zoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoom(false)}>
          <img src={images[active].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} />
        </div>
      )}
    </>
  )
}

function ApplicationCard({ app }: { app: MyApplication }) {
  const cfg = STATUS_CFG[app.status] ?? { label: app.status, bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0', icon: Clock }
  const Icon = cfg.icon

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Tu postulación</h3>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px' }}>
          <Icon size={12} />
          {cfg.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: app.message ? 14 : 0 }}>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            {app.status === ApplicationStatus.Accepted ? 'Fecha visita' : 'Días disponibles'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: app.status === ApplicationStatus.Accepted ? '#059669' : '#0F172A', margin: 0 }}>
            {app.status === ApplicationStatus.Accepted
              ? (() => { const [y,m,d] = app.serviceDate!.split('T')[0].split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }) })()
              : app.availableDays.length > 0 ? app.availableDays.map(day => { const [y,m,d] = day.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }) }).join(', ') : '—'}
          </p>
        </div>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Horario</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {app.availableTimeFrom && app.availableTimeTo ? `${app.availableTimeFrom} – ${app.availableTimeTo}` : '—'}
          </p>
        </div>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Visita</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: app.chargesVisit ? '#DC2626' : '#059669', margin: 0 }}>
            {app.chargesVisit ? `Cobra visita${app.visitCost ? ` ($${app.visitCost})` : ''}` : 'No cobra visita'}
          </p>
        </div>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Postulado el</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{fmtDate(app.appliedAt)}</p>
        </div>
      </div>

      {app.message && (
        <div style={{ marginTop: 14, background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Tu mensaje</p>
          <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{app.message}"</p>
        </div>
      )}
    </div>
  )
}



// ─── Main view ────────────────────────────────────────────────────────────────

export default function WorkerPostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [post, setPost] = useState<PostDTO | null>(null)
  const [application, setApplication] = useState<MyApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkedSubcontractId, setLinkedSubcontractId] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      try {
        const [postRes, appsRes] = await Promise.all([
          api.get<PostDTO>(`/posts/${id}`),
          api.get<MyApplication[]>('/applications/my-applications'),
        ])
        if (cancelled) return
        setPost(postRes.data)
        const myApp = appsRes.data.find((a) => a.postId === id) ?? null
        setApplication(myApp)

        // Determinar si hay un subcontrato vinculado
        let linkedId: string | null = null
        if (postRes.data.type === 'subcontract') {
          linkedId = postRes.data.id
        }
        try {
          const subsRes = await fetchMySubcontractManager()
          const found = subsRes.data.subcontracts.find((s) => s.parentPostId === id)
          if (found) linkedId = found.id
        } catch (err) {
          console.error('Error al buscar subcontratos vinculados', err)
        }
        setLinkedSubcontractId(linkedId)
      } catch {
        setError('No se pudo cargar el detalle de la publicación.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [id])

  const handleWorkerComplete = async () => {
    if (!application || completing) return
    setCompleting(true)
    try {
      await workerCompletePost(post!.id)
      setApplication({ ...application, status: ApplicationStatus.Completed })
    } catch {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} color="#0F172A" style={{ animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <AlertCircle size={40} color="#DC2626" />
        <p style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{error || 'Publicación no encontrada'}</p>
        <button onClick={() => navigate(-1)} style={{ background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Volver
        </button>
      </div>
    )
  }

  const category = post.categories[0]?.name ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              {category && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 10 }}>
                  <Tag size={11} /> {category}
                </span>
              )}
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {post.title}
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} /> {post.address}
              </p>
            </div>
            {application && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: STATUS_CFG[application.status]?.bg ?? '#F1F5F9',
                color: STATUS_CFG[application.status]?.color ?? '#64748B',
                border: `1px solid ${STATUS_CFG[application.status]?.border ?? '#E2E8F0'}`,
                borderRadius: 20, fontSize: 13, fontWeight: 700, padding: '6px 16px',
              }}>
                {application.status === ApplicationStatus.Accepted && <CheckCircle size={14} />}
                {STATUS_CFG[application.status]?.label ?? application.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '-28px auto 60px', padding: '0 32px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Descripción */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '24px 28px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Descripción</h2>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{post.description}</p>
            </div>

            {/* Postulación */}
            {application && <ApplicationCard app={application} />}

            {/* Código de inicio (solo contratos normales y emergencias que lo requieren) */}
            {application?.status === ApplicationStatus.Accepted &&
              application.requiresStartToken &&
              (post.type === 'post' || post.type === 'emergency') && (
                <StartTokenWorkerCard
                  applicationId={application.id}
                  initialToken={application.startToken}
                  initialExpiresAt={application.startTokenExpiresAt}
                  validatedAt={application.tokenValidatedAt}
                />
              )}
            {!application && (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 22px' }}>
                <p style={{ fontSize: 14, color: '#64748B', margin: 0, fontWeight: 500 }}>No tenés una postulación activa en esta publicación.</p>
              </div>
            )}

            {/* Finalizar trabajo (solo si el token fue validado) */}
            {application?.status === ApplicationStatus.Accepted && application.tokenValidatedAt && (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 22px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>¿Trabajo terminado?</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.6 }}>
                  Si ya terminaste el trabajo, marcalo como finalizado.
                </p>
                <button
                  onClick={handleWorkerComplete}
                  disabled={completing}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: completing ? '#93C5FD' : '#2563EB', border: 'none', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: completing ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
                  }}
                >
                  <Flag size={16} />
                  {completing ? 'Finalizando...' : 'Finalizar trabajo'}
                </button>
              </div>
            )}

            {/* Imágenes */}
            {post.images.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Fotos</h2>
                <ImageGallery images={post.images} />
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Client card */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '24px 22px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Cliente</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#0F172A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {getInitials(post.user.name, post.user.surname)}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>
                    {post.user.name} {post.user.surname}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} /> Cliente
                  </p>
                </div>
              </div>
              {application?.status === ApplicationStatus.Accepted && application.clientPhone && (
                <button
                  onClick={() => window.open(
                    `https://api.whatsapp.com/send?phone=${formatWhatsAppNumber(application.clientPhone!)}&text=${encodeURIComponent(`Hola, me contrataste para: ${post.title}`)}`,
                    '_blank'
                  )}
                  style={{
                    marginTop: 16, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#25D366', border: 'none', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  <MessageCircle size={16} />
                  Chatear por WhatsApp
                </button>
              )}
              {application?.status === ApplicationStatus.Accepted && post.allowsSubcontracting && (
                <button
                  onClick={() => navigate('/create-subcontract', {
                    state: { parentPostId: post.id },
                  })}
                  style={{
                    marginTop: 10, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#0F172A', border: 'none', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Subcontratar
                </button>
              )}
              {application?.status === ApplicationStatus.Completed && !application.hasReview && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  style={{
                    marginTop: 10, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#2563EB', border: 'none', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  <Star size={16} />
                  Calificar cliente
                </button>
              )}
              {(application?.status === ApplicationStatus.Accepted || application?.status === ApplicationStatus.Completed) && (
                <button
                  onClick={() => setShowReportModal(true)}
                  style={{
                    marginTop: 10, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#DC2626',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  <Flag size={16} />
                  Reportar cliente
                </button>
              )}
              {linkedSubcontractId && (
                <button
                  onClick={() => navigate(`/worker/subcontracts/group/${linkedSubcontractId}`)}
                  style={{
                    marginTop: 10, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#0F172A', border: 'none', borderRadius: 10,
                    padding: '11px 0', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Ver subcontrato
                </button>
              )}
            </div>

            {/* Job info */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '24px 22px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Detalles del trabajo</h2>
              <InfoRow icon={Calendar} label="Fecha de inicio" value={fmtDate(post.startDate)} />
              <InfoRow icon={Calendar} label="Fecha límite" value={fmtDate(post.endDate)} />
              <InfoRow icon={MapPin} label="Dirección" value={post.address} />
              {category && <InfoRow icon={Tag} label="Rubro" value={category} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} color="#64748B" />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Publicado</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{fmtDate(post.createdAt)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showReviewModal && application && (
        <ReviewModal
          applicationId={application.id}
          clientName={`${post.user.name} ${post.user.surname}`}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => setApplication({ ...application, hasReview: true })}
        />
      )}

      {showReportModal && application && (
        <ReportModal
          open={showReportModal}
          targetType="application"
          targetId={application.id}
          targetName={`${post.user.name} ${post.user.surname}`}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
