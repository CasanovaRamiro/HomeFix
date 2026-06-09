import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import { createConversation } from '../services/chat'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [applicants, setApplicants] = useState<PostApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      .catch((err) => {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 404) {
          setError('La publicación no está disponible')
        } else {
          setError('La publicación no está disponible')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleComplete = async () => {
    try {
      await api.patch(`/posts/${id}/complete`)
      const accepted = applicants.find(a => a.status === ApplicationStatus.Accepted)
      navigate('/review', {
        state: {
          postId: post?.id,
          titulo: post?.title,
          fecha: post?.endDate,
          ubicacion: post?.address,
          trabajador: {
            id: accepted?.workerId ?? '',
            nombre: accepted?.name ?? '',
            categoria: accepted?.category ?? '',
            verificado: false,
          },
        },
      })
    } catch {
      // error handling
    }
  }

  const handleReopen = async () => {
    try {
      await api.patch(`/posts/${id}/reopen`)
      const [postRes, applicantsData] = await Promise.all([
        api.get<Post>(`/posts/${id}`),
        getPostApplicants(id!).catch(() => []),
      ])
      setPost(postRes.data)
      setApplicants(Array.isArray(applicantsData) ? applicantsData : applicantsData.data ?? [])
    } catch {
      // error handling
    }
  }

  const refresh = () => {
    if (!id) return
    Promise.all([
      api.get<Post>(`/posts/${id}`),
      getPostApplicants(id).catch(() => []),
    ]).then(([postRes, applicantsData]) => {
      setPost(postRes.data)
      setApplicants(Array.isArray(applicantsData) ? applicantsData : applicantsData.data ?? [])
    })
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
      setEditError('Todos los campos son obligatorios')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setEditError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }
    setEditSubmitting(true)
    setEditError('')
    try {
      await updatePost(post!.id, editForm)
      setShowEditModal(false)
      refresh()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setEditError(axiosErr.response?.data?.error ?? 'Error al guardar los cambios')
    } finally {
      setEditSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return (
    <>
      <div className="bg-primary-dark px-6 pt-12 pb-16 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Detalle de publicación</h1>
          <Link to="/dashboard" className="!text-white text-sm hover:!text-slate-300 transition-colors inline-block mt-1">
            ← Volver
          </Link>
        </div>
      </div>
      <div className="post-detail px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
        <p className="error">{error}</p>
        </div>
      </div>
    </>
  )
  if (!post) return null

  const handlePause = async () => {
    try {
      const res = await pausePost(post.id)
      setPost({ ...post, status: res.data.status })
    } catch {
      alert('No se pudo cambiar el estado de la publicación')
    }
  }

  const handleChat = async (workerId: string) => {
    try {
      const conv = await createConversation(post!.id, workerId)
      window.dispatchEvent(new CustomEvent('chat:open', { detail: { conversationId: conv.id } }))
    } catch {
      alert('No se pudo iniciar la conversación')
    }
  }

  const handleCancel = async () => {
    try {
      const res = await cancelPost(post.id)
      setPost({ ...post, status: res.data.status })
      setShowCancelModal(false)
    } catch {
      alert('No se pudo cancelar la publicación')
    }
  }

  return (
    <>
      <div className="bg-primary-dark px-6 pt-12 pb-16 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Detalle de publicación</h1>
          <Link to="/dashboard" className="!text-white text-sm hover:!text-slate-300 transition-colors inline-block mt-1">
            ← Volver
          </Link>
        </div>
      </div>
      <div className="post-detail px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <PostCard
            post={post}
            hasAcceptedWorker={applicants.some(a => a.status === ApplicationStatus.Accepted)}
            onComplete={handleComplete}
            onReopen={handleReopen}
            onViewReview={() => navigate('/review')}
            onPause={handlePause}
            onCancel={() => setShowCancelModal(true)}
            onEdit={openEditModal}
          />

          <h3 className="section-title">Postulantes ({applicants.length})</h3>

          {applicants.length === 0 && (
            <p className="text-slate-400 text-sm mt-2">Todavía no hay trabajadores postulados</p>
          )}

          {applicants.map((a) => (
            <ApplicantCard
              key={a.workerId}
              applicant={{
                id: a.workerId,
                name: a.name,
                category: a.category ?? '',
                address: a.address,
                rating: a.rating,
                reviewCount: a.reviewCount,
                jobCount: a.jobCount,
              }}
              applicationId={a.applicationId}
              applicationStatus={a.status}
              postStatus={post.status}
              postTitle={post.title}
              onHire={refresh}
              onChat={handleChat}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={showCancelModal}
        title="¿Estás seguro de que quieres cancelar la publicación?"
        confirmLabel="Sí, quiero cancelarla"
        cancelLabel="No, deseo mantenerla"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
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
                <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Categoría</label>
                <select value={editForm.categoryId} onChange={e => setEditForm(p => ({ ...p, categoryId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box', cursor: 'pointer' }}>
                  <option value="">Seleccioná una categoría</option>
                  {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, resize: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Fecha inicio</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Fecha fin</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input type="text" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
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