
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useSubcontractDetail, useSubcontractGroupDetail } from '../hooks/useSubcontractDetail'
import { Users, X, Loader } from 'lucide-react'
import StarRating from '../components/ui/StarRating'
import ConfirmModal from '../components/ui/ConfirmModal'
import { getPostApplicants, applyToSubcontract } from '../services/applications'
import type { PostApplicant } from '../services/applications'
import { ApplicationStatus } from '../types/application'
import ApplicantCard from '../components/post/ApplicantCard'
import PostCard from '../components/post/PostCard'
import { PostStatus } from '../types/post'
import type { Post } from '../types/post'
import { useAuth } from '../hooks/useAuth'

export default function SubcontractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isGroup = location.pathname.includes('/group/')
  const groupHook = useSubcontractGroupDetail(isGroup ? id : undefined)
  const detailHook = useSubcontractDetail(!isGroup ? id : undefined)
  const { subcontract, loading, error } = isGroup ? groupHook : detailHook
  const refetchSubcontract = isGroup ? groupHook.refetch : detailHook.refetch
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalCategoryId, setModalCategoryId] = useState<string>('')
  const [modalChargesVisit, setModalChargesVisit] = useState(false)
  const [modalVisitCost, setModalVisitCost] = useState('')
  const [modalError, setModalError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { user } = useAuth()
  const [applicants, setApplicants] = useState<PostApplicant[]>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false)
  const [pendingReviewNav, setPendingReviewNav] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!isGroup || !subcontract) return
    const ids = subcontract.postIds?.length ? subcontract.postIds : [subcontract.id]
    setLoadingApplicants(true)
    Promise.all(
      ids.map((postId) =>
        getPostApplicants(postId)
          .then((r) => r.data)
          .catch(() => [] as PostApplicant[]),
      ),
    )
      .then((results) => {
        const merged = results.flat()
        const seen = new Set<string>()
        const deduped = merged.filter((a) => {
          if (seen.has(a.applicationId)) return false
          seen.add(a.applicationId)
          return true
        })
        setApplicants(deduped)
      })
      .catch(() => {})
      .finally(() => setLoadingApplicants(false))
  }, [isGroup, subcontract])

  const refreshApplicants = useCallback(() => {
    if (!isGroup || !subcontract) return
    const ids = subcontract.postIds?.length ? subcontract.postIds : [subcontract.id]
    setLoadingApplicants(true)
    refetchSubcontract()
    Promise.all(
      ids.map((postId) =>
        getPostApplicants(postId)
          .then((r) => r.data)
          .catch(() => [] as PostApplicant[]),
      ),
    )
      .then((results) => {
        const merged = results.flat()
        const seen = new Set<string>()
        const deduped = merged.filter((a) => {
          if (seen.has(a.applicationId)) return false
          seen.add(a.applicationId)
          return true
        })
        setApplicants(deduped)
      })
      .catch(() => {})
      .finally(() => setLoadingApplicants(false))
  }, [isGroup, subcontract, refetchSubcontract])

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <Loader size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <div className="bg-primary-dark px-6 pt-12 pb-16 md:px-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white">Detalle de subcontrato</h1>
            <Link to={isGroup ? '/worker/subcontracts' : '/worker/available-subcontracts'} className="!text-white text-sm hover:!text-slate-300 transition-colors inline-block mt-1">
              ← Volver
            </Link>
          </div>
        </div>
        <div className="post-detail px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <p className="error" style={{ color: '#DC2626', padding: '12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>{error}</p>
          </div>
        </div>
      </>
    )
  }

  if (!subcontract) return null

  const backLink = isGroup ? '/worker/subcontracts' : '/worker/available-subcontracts'
  const totalVacantes = subcontract.categories.reduce(
    (acc, c) => acc + (c.quantity - c.filledCount), 0,
  )

  const postForCard: Post = {
    ...subcontract,
    isEmergency: false,
    emergencyExpiresAt: null,
    allowsSubcontracting: false,
    categories: subcontract.categories,
  }
  const hasAcceptedWorker = applicants.some((a) => a.status === ApplicationStatus.Accepted)

  const handlePause = async () => {
    try {
      const { pausePost } = await import('../services/api')
      await pausePost(subcontract.id)
      window.location.reload()
    } catch { alert('No se pudo cambiar el estado') }
  }

  const handleCancel = async () => {
    try {
      const { cancelPost } = await import('../services/api')
      await cancelPost(subcontract.id)
      navigate(backLink)
    } catch { alert('No se pudo cancelar') }
  }

  const handleMarkInProgress = async () => {
    try {
      const { markPostInProgress } = await import('../services/api')
      await markPostInProgress(subcontract.id)
      window.location.reload()
    } catch { alert('No se pudo marcar en progreso') }
  }

  const handleComplete = async () => {
    try {
      const { completePost } = await import('../services/api')
      await completePost(subcontract.id)
      window.location.reload()
    } catch { alert('No se pudo completar') }
  }

  const handleReactivateConfirm = async () => {
    try {
      const { reopenPost } = await import('../services/api')
      await reopenPost(subcontract.id)
      setShowReactivateConfirm(false)
      if (pendingReviewNav) {
        navigate('/review', { state: pendingReviewNav })
        setPendingReviewNav(null)
      }
    } catch { alert('No se pudo reactivar la publicación') }
  }

  return (
    <>
      <div className="bg-primary-dark px-6 pt-12 pb-16 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">{subcontract.title}</h1>
          <Link to={backLink} className="!text-white text-sm hover:!text-slate-300 transition-colors inline-block mt-1">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="post-detail px-6 md:px-12">
        <div className="max-w-7xl mx-auto">

          {/* Original client (only if linked) */}
          {subcontract.parentPostId && (
            <div className="info-card">
              <h3 className="section-title">Cliente original</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600 shrink-0">
                    {subcontract.parentUser?.name?.charAt(0).toUpperCase() ?? 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">
                      {subcontract.parentUser?.name ?? 'Cliente'} {subcontract.parentUser?.surname ?? ''}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={subcontract.clientRating} />
                      <span className="text-xs text-slate-400">
                        {subcontract.clientRating > 0 ? subcontract.clientRating.toFixed(1) : 'Sin reseñas'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-outline text-sm whitespace-nowrap">Ver perfil</button>
              </div>
            </div>
          )}

          {/* Post card with vacancies inside */}
          <PostCard
            post={postForCard}
            hasAcceptedWorker={hasAcceptedWorker}
            hasUnreviewedWorkers={applicants.some(a => (a.status === 'Accepted' || a.status === 'Completed') && !a.hasReview)}
            onComplete={handleComplete}
            onMarkInProgress={handleMarkInProgress}
            onPause={handlePause}
            onCancel={handleCancel}
          >
            {/* Vacantes inside the card */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  <h3 className="section-title mb-0">Vacantes</h3>
                </div>
                {totalVacantes > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                    {totalVacantes} disponible{totalVacantes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {subcontract.categories.length === 0 ? (
                <p className="text-sm text-slate-400">Sin posiciones especificadas</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {subcontract.categories.map((cat, i) => {
                    const needed = cat.quantity - cat.filledCount
                    return (
                      <div key={i} className="rounded-xl p-4 bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="font-semibold text-slate-800 mb-0">{cat.name}</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${needed > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            {needed > 0 ? `${needed} vacante${needed !== 1 ? 's' : ''}` : 'Completo'}
                          </span>
                        </div>
                        {cat.roleDescription && (
                          <p className="mb-1 text-sm text-slate-400">Rol: {cat.roleDescription}</p>
                        )}
                        <p className="mb-0 text-xs text-slate-400">
                          {cat.filledCount} de {cat.quantity} cubierto{cat.filledCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </PostCard>

          {/* Filters & applicants (group view only) */}
          {isGroup && (
            <>
              <h3 className="section-title">
                {subcontract.status === PostStatus.Completed || subcontract.status === PostStatus.Cancelled
                  ? 'Contratados'
                  : 'Postulantes'} ({applicants.length})
              </h3>

              {loadingApplicants && (
                <div className="flex justify-center py-6">
                  <Loader size={24} className="animate-spin" style={{ color: '#3B82F6' }} />
                </div>
              )}

              {!loadingApplicants && applicants.length === 0 && (
                <p className="text-slate-400 text-sm mt-2">Todavía no hay trabajadores postulados</p>
              )}

              {applicants.map((a) => {
                const reviewState = {
                  postId: subcontract.id,
                  applicationId: a.applicationId,
                  titulo: subcontract.title,
                  fecha: subcontract.endDate,
                  ubicacion: subcontract.address,
                  trabajador: {
                    id: a.workerId,
                    nombre: a.name,
                    categoria: a.category ?? '',
                    verificado: false,
                  },
                }

                const acceptedCount = applicants.filter((x) => x.status === ApplicationStatus.Accepted).length

                return (
                  <ApplicantCard
                    key={a.applicationId}
                    applicant={{
                      id: a.workerId,
                      name: a.name,
                      photo: a.photo,
                      category: a.category ?? '',
                      address: a.address,
                      rating: a.rating,
                      reviewCount: a.reviewCount,
                      jobCount: a.jobCount,
                      message: a.message,
                      availableDays: a.availableDays,
                      availableTimeFrom: a.availableTimeFrom,
                      availableTimeTo: a.availableTimeTo,
                      chargesVisit: a.chargesVisit,
                      visitCost: a.visitCost,
                      phone: a.phone,
                      hasReview: a.hasReview,
                    }}
                    applicationId={a.applicationId}
                    applicationStatus={a.status}
                    postStatus={subcontract.status}
                    postTitle={subcontract.title}
                    onHire={refreshApplicants}
                    onDismiss={() => {
                      if (subcontract.status === PostStatus.InProgress && acceptedCount >= 2) {
                        setPendingReviewNav(reviewState)
                        setShowReactivateConfirm(true)
                      } else {
                        navigate('/review', { state: reviewState })
                      }
                    }}
                    onReview={() => navigate('/review', { state: reviewState })}
                  />
                )
              })}
            </>
          )}

          {/* Apply button (non-group) */}
          {!isGroup && subcontract.status === PostStatus.Active && subcontract.userId !== user?.id && (
            <div className="pt-2 pb-8">
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                Postularme
              </button>
            </div>
          )}
        </div>


        {/* Apply button
        <div style={{ paddingTop: '8px', paddingBottom: '32px' }}>
          {subcontract?.userId === user?.id ? (
            <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center', padding: 12 }}>
              Es tu publicación
            </p>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              style={s.btnPrimary}
              onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.accent }}
            >
              Postularme
            </button>
          )}
        </div>
 */}
      </div>

      {/* Apply modal (non-group) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => !enviando && setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-800 mb-0">Postularte</h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-none cursor-pointer p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="mb-5 text-sm text-slate-400">
                Postularte a: <span className="font-semibold text-slate-800">{subcontract.title}</span>
              </p>

              {/* Fixed dates */}
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
                <label className="text-xs font-medium text-green-700 block mb-1">
                  Fecha del servicio (ya pactada)
                </label>
                <p className="text-sm font-semibold text-green-700 mb-0">
                  {new Date(subcontract.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' — '}
                  {new Date(subcontract.endDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Category selector */}
              <label className="text-sm font-medium text-slate-800 block mb-2">Rubro</label>
              <select
                value={modalCategoryId}
                onChange={(e) => setModalCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 bg-slate-50 text-slate-800 mb-4"
              >
                <option value="">Seleccioná un rubro</option>
                {subcontract.categories.map((cat) => {
                  const needed = cat.quantity - cat.filledCount
                  return (
                    <option key={cat.id} value={cat.id} disabled={needed <= 0}>
                      {cat.name} {needed > 0 ? `(${needed} vacante${needed !== 1 ? 's' : ''})` : '(completo)'}
                    </option>
                  )
                })}
              </select>

              {/* Charges visit */}
              <div className="flex items-center gap-2.5 mb-4">
                <input
                  id="modalChargesVisit"
                  type="checkbox"
                  checked={modalChargesVisit}
                  onChange={(e) => setModalChargesVisit(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-emerald-500"
                />
                <label htmlFor="modalChargesVisit" className="text-sm font-medium text-slate-700 cursor-pointer">
                  ¿Cobrás la visita?
                </label>
              </div>

              {modalChargesVisit && (
                <label className="text-sm font-medium text-slate-800 block mb-4">
                  Monto de la visita ($)
                  <input
                    type="number"
                    min={1}
                    value={modalVisitCost}
                    onChange={(e) => setModalVisitCost(e.target.value)}
                    placeholder="Ej: 2500"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 bg-slate-50 text-slate-800 mt-1"
                  />
                </label>
              )}

              <label className="text-sm font-medium text-slate-800 block mb-2">Mensaje para el contratista (opcional)</label>
              <textarea
                rows={4}
                value={modalMessage}
                onChange={(e) => setModalMessage(e.target.value)}
                placeholder="Presentate brevemente..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 bg-slate-50 text-slate-800 resize-none box-border transition-all"
              />

              {modalError !== '' && (
                <p className="text-red-500 text-xs mt-2 mb-0">{modalError}</p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setModalError(''); setModalCategoryId(''); setModalMessage(''); setModalChargesVisit(false); setModalVisitCost('') }}
                  disabled={enviando}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer bg-slate-100 text-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!modalCategoryId) {
                      setModalError('Seleccioná un rubro.')
                      return
                    }
                    if (modalChargesVisit && (!modalVisitCost || Number(modalVisitCost) <= 0)) {
                      setModalError('Ingresá el monto de la visita.')
                      return
                    }
                    setModalError('')
                    setEnviando(true)
                    try {
                      await applyToSubcontract({
                        postId: subcontract.id,
                        categoryId: modalCategoryId,
                        message: modalMessage || undefined,
                        chargesVisit: modalChargesVisit,
                        visitCost: modalChargesVisit ? Number(modalVisitCost) : undefined,
                      })
                      setShowModal(false)
                      setModalCategoryId('')
                      setModalMessage('')
                      setModalChargesVisit(false)
                      setModalVisitCost('')
                    } catch (err) {
                      const axiosErr = err as { response?: { data?: { error?: string } } }
                      setModalError(axiosErr.response?.data?.error ?? 'Error al postularte')
                    } finally {
                      setEnviando(false)
                    }
                  }}
                  disabled={enviando}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer bg-blue-500 text-white transition-all"
                >
                  {enviando ? 'Enviando...' : 'Enviar postulación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showReactivateConfirm}
        title="Reactivar publicación"
        message="Había más de un trabajador contratado. ¿Querés reactivar la publicación para que los demás sigan trabajando?"
        onConfirm={handleReactivateConfirm}
        onCancel={() => {
          setShowReactivateConfirm(false)
          setPendingReviewNav(null)
        }}
      />
    </>
  )
}