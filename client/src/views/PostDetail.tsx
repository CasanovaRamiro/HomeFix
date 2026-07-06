import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2, SlidersHorizontal, BadgeCheck, CircleCheck, Star, FilterX, X } from 'lucide-react'
import api, { pausePost, cancelPost, updatePost } from '../services/api'
import type { UpdatePostData } from '../services/api'
import { getPostApplicants } from '../services/applications'
import type { PostApplicant } from '../services/applications'
import { ApplicationStatus } from '../types/application'
import PostCard from '../components/post/PostCard'
import ApplicantCard from '../components/post/ApplicantCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useCategories } from '../hooks/useCategories'
import { useTheme } from '../hooks/useTheme'
import type { Post } from '../types/post'

type SortKey = 'rating' | 'jobs' | 'recent'

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [applicants, setApplicants] = useState<PostApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<SortKey>('rating')
  const [fVerified, setFVerified] = useState(false)
  const [fNoVisit, setFNoVisit] = useState(false)
  const [fMinRating, setFMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<UpdatePostData>({ title: '', categoryId: '', description: '', startDate: '', endDate: '', address: '' })
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const { categories } = useCategories()
  const theme = useTheme()

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Post>(`/posts/${id}`),
      getPostApplicants(id).catch(() => []),
    ])
      .then(([postRes, applicantsData]) => {
        setPost(postRes.data)
        setApplicants(Array.isArray(applicantsData) ? applicantsData : applicantsData.data ?? [])
      })
      .catch(() => setError('La publicación no está disponible'))
      .finally(() => setLoading(false))
  }, [id])

  const refresh = () => {
    if (!id) return Promise.resolve()
    return Promise.all([
      api.get<Post>(`/posts/${id}`),
      getPostApplicants(id).catch(() => []),
    ]).then(([postRes, applicantsData]) => {
      setPost(postRes.data)
      setApplicants(Array.isArray(applicantsData) ? applicantsData : applicantsData.data ?? [])
    })
  }

  const accepted = applicants.find((a) => a.status === ApplicationStatus.Accepted)
  const anyHired = !!accepted

  const anyFilter = fVerified || fNoVisit || fMinRating > 0
  const clearFilters = () => { setFVerified(false); setFNoVisit(false); setFMinRating(0) }

  const sortedApplicants = useMemo(() => {
    const rank = (s: string) => (s === ApplicationStatus.Accepted ? -1 : s === ApplicationStatus.Dismissed ? 1 : 0)
    const keep = (a: PostApplicant) => {
      if (a.status === ApplicationStatus.Accepted || a.status === ApplicationStatus.Dismissed) return true
      if (fVerified && !(a as PostApplicant & { verified?: boolean }).verified) return false
      if (fNoVisit && a.chargesVisit) return false
      if (fMinRating && a.rating < fMinRating) return false
      return true
    }
    return applicants.filter(keep).sort((a, b) => {
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'jobs') return b.jobCount - a.jobCount
      return 0
    })
  }, [applicants, sort, fVerified, fNoVisit, fMinRating])

  const handleComplete = async () => {
    try {
      await api.patch(`/posts/${id}/complete`)
      navigate('/review', {
        state: {
          postId: post?.id, titulo: post?.title, fecha: post?.endDate, ubicacion: post?.address,
          trabajador: { id: accepted?.workerId ?? '', nombre: accepted?.name ?? '', categoria: accepted?.category ?? '', imagen: accepted?.photo ?? undefined, verificado: false },
        },
      })
    } catch { /* error handling */ }
  }

  const handlePause = async () => {
    if (!post) return
    try {
      const res = await pausePost(post.id)
      setPost({ ...post, status: res.data.status })
    } catch { alert('No se pudo cambiar el estado de la publicación') }
  }

  const handleCancel = async () => {
    if (!post) return
    try {
      const res = await cancelPost(post.id)
      setShowCancelModal(false)
      if (accepted) {
        navigate('/review', {
          state: {
            postId: post.id, titulo: post.title, fecha: post.endDate, ubicacion: post.address,
            trabajador: { id: accepted.workerId ?? '', nombre: accepted.name ?? '', categoria: accepted.category ?? '', imagen: accepted.photo ?? undefined, verificado: false },
          },
        })
        return
      }
      setPost({ ...post, status: res.data.status })
    } catch { alert('No se pudo cancelar la publicación') }
  }

  const openEditModal = () => {
    if (!post) return
    const categoryId = post.categories[0]?.id ?? ''
    setEditForm({ title: post.title, categoryId, description: post.description, startDate: post.startDate.slice(0, 10), endDate: post.endDate.slice(0, 10), address: post.address })
    setEditError('')
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const { title, categoryId, description, startDate, endDate, address } = editForm
    if (!title.trim() || !categoryId || !description.trim() || !startDate || !endDate || !address.trim()) {
      setEditError('Todos los campos son obligatorios'); return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setEditError('La fecha de fin debe ser posterior a la fecha de inicio'); return
    }
    setEditSubmitting(true); setEditError('')
    try {
      await updatePost(post!.id, editForm)
      setShowEditModal(false)
      refresh()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setEditError(axiosErr.response?.data?.error ?? 'Error al guardar los cambios')
    } finally { setEditSubmitting(false) }
  }

  if (loading) return <LoadingSpinner />

  if (error) return (
    <>
      <div className="pd-hero">
        <div className="pd-wrap">
          <button className="pd-hero-back" onClick={() => navigate('/dashboard')}><ArrowLeft size={15} />Volver al panel</button>
          <h1 className="pd-hero-title">Detalle de publicación</h1>
        </div>
      </div>
      <div className="pd-page"><p className="error">{error}</p></div>
    </>
  )
  if (!post) return null

  return (
    <>
      <div className="pd-hero">
        <div className="pd-wrap">
          <button className="pd-hero-back" onClick={() => navigate('/dashboard')}><ArrowLeft size={15} />Volver al panel</button>
          <div className="pd-hero-card">
            <div className="pd-hero-kicker">Tu publicación</div>
            <h1 className="pd-hero-title">{post.title}</h1>
            <div className="pd-hero-meta">
              <span><Calendar size={15} />{fmtDate(post.startDate)} – {fmtDate(post.endDate)}</span>
              <span><MapPin size={15} />{post.address}</span>
              <span><Users size={15} />{applicants.length} postulantes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-page">
        <div className="pd-layout">
          <PostCard
            post={post}
            hasAcceptedWorker={anyHired}
            scheduledDate={accepted?.scheduledDate}
            onComplete={handleComplete}
            onPause={handlePause}
            onCancel={() => setShowCancelModal(true)}
            onEdit={openEditModal}
          />

          <main>
            <div className="appl-bar">
              <div className="appl-head">
                <h2 className="appl-title">Postulantes</h2>
                <div className="appl-sort">
                  <button className={sort === 'rating' ? 'on' : ''} onClick={() => setSort('rating')}>Mejor puntuados</button>
                  <button className={sort === 'jobs' ? 'on' : ''} onClick={() => setSort('jobs')}>Más trabajos</button>
                  <button className={sort === 'recent' ? 'on' : ''} onClick={() => setSort('recent')}>Recientes</button>
                </div>
              </div>
              <div className={`appl-filters${showFilters ? ' is-open' : ''}`}>
                <button className="appl-filters-toggle" onClick={() => setShowFilters((v) => !v)}>
                  <SlidersHorizontal size={14} />Filtrar
                </button>
                <div className="appl-filters-body">
                  <button className={`appl-fchip${fVerified ? ' on' : ''}`} onClick={() => setFVerified((v) => !v)}>
                    <BadgeCheck size={13} />Verificados
                  </button>
                  <button className={`appl-fchip${fNoVisit ? ' on' : ''}`} onClick={() => setFNoVisit((v) => !v)}>
                    <CircleCheck size={13} />No cobran visita
                  </button>
                  <button className={`appl-fchip${fMinRating === 4 ? ' on' : ''}`} onClick={() => setFMinRating((r) => (r === 4 ? 0 : 4))}>
                    <Star size={13} />4.0+
                  </button>
                  <button className={`appl-fchip${fMinRating === 4.5 ? ' on' : ''}`} onClick={() => setFMinRating((r) => (r === 4.5 ? 0 : 4.5))}>
                    <Star size={13} />4.5+
                  </button>
                  {anyFilter && (
                    <button className="appl-clear" onClick={clearFilters}><X size={13} />Limpiar</button>
                  )}
                </div>
              </div>
            </div>

            {anyHired && (
              <div className="hire-banner">
                <CheckCircle2 size={18} />
                Contrataste a un trabajador. Coordiná por chat y, al terminar, marcá el trabajo como finalizado para dejar tu reseña.
              </div>
            )}

            {applicants.length === 0 ? (
              <div className="appl-empty">
                <div className="appl-empty-ic"><Users size={26} /></div>
                <h3>Todavía no hay postulantes</h3>
                <p>Cuando un trabajador se postule a tu publicación, vas a verlo acá con su perfil y reseñas.</p>
              </div>
            ) : sortedApplicants.length === 0 ? (
              <div className="appl-empty">
                <div className="appl-empty-ic"><FilterX size={26} /></div>
                <h3>Ningún postulante coincide</h3>
                <p>Probá quitar algún filtro para ver más trabajadores.</p>
                <button className="pd-btn pd-btn--outline" style={{ marginTop: 16 }} onClick={clearFilters}><X size={16} />Limpiar filtros</button>
              </div>
            ) : (
              <div className="appl-list">
                {sortedApplicants.map((a) => (
                  <ApplicantCard
                    key={a.workerId}
                    applicant={{
                      id: a.workerId, name: a.name, photo: a.photo, category: a.category ?? '', address: a.address,
                      rating: a.rating, reviewCount: a.reviewCount, jobCount: a.jobCount, message: a.message,
                      availableDays: a.availableDays, availableTimeFrom: a.availableTimeFrom, availableTimeTo: a.availableTimeTo,
                      chargesVisit: a.chargesVisit, visitCost: a.visitCost, phone: a.phone,
                      scheduledDate: a.scheduledDate, hasReview: a.hasReview,
                      requiresStartToken: a.requiresStartToken, tokenValidatedAt: a.tokenValidatedAt,
                    }}
                    applicationId={a.applicationId}
                    applicationStatus={a.status}
                    postStatus={post.status}
                    postTitle={post.title}
                    hireLocked={anyHired}
                    isEmergency={post.isEmergency}
                    onHire={refresh}
                    onTokenValidated={refresh}
                    onDismiss={() => navigate('/review', {
                      state: {
                        postId: post.id, applicationId: a.applicationId, titulo: post.title, fecha: post.endDate, ubicacion: post.address,
                        trabajador: { id: a.workerId, nombre: a.name, categoria: a.category ?? '', verificado: false },
                      },
                    })}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={showCancelModal}
        title={accepted
          ? '¿Querés cancelar la contratación? Vas a poder dejar una reseña del trabajador.'
          : '¿Estás seguro de que quieres cancelar la publicación?'}
        confirmLabel={accepted ? 'Sí, cancelar la contratación' : 'Sí, quiero cancelarla'}
        cancelLabel="No, deseo mantenerla"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        danger
      />

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary-dark px-6 py-6">
              <h2 className="text-2xl font-bold text-white">Editar publicación</h2>
            </div>
            <div className="p-6">
              {editError && (
                <div style={{ padding: '12px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', marginBottom: '16px' }}>
                  {editError}
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Título</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Categoría</label>
                <select value={editForm.categoryId} onChange={(e) => setEditForm((p) => ({ ...p, categoryId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box', cursor: 'pointer' }}>
                  <option value="">Seleccioná una categoría</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="pd-edit-dates" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Fecha inicio</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Fecha fin</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleEditSave} disabled={editSubmitting}
                  style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.accent, color: '#fff', opacity: editSubmitting ? 0.6 : 1 }}>
                  {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', background: theme.border, color: theme.primaryDark }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
