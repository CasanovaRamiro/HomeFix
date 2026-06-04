import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api, { pausePost, cancelPost } from '../services/api'
import { getPostApplicants } from '../services/applications'
import type { PostApplicant } from '../services/applications'
import PostCard from '../components/post/PostCard'
import ApplicantCard from '../components/post/ApplicantCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import type { Post } from '../types/post'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [applicants, setApplicants] = useState<PostApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)

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
      const accepted = applicants.find(a => a.status === 'Accepted')
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
            hasAcceptedWorker={applicants.some(a => a.status === 'Accepted')}
            onComplete={handleComplete}
            onReopen={handleReopen}
            onViewReview={() => navigate('/review')}
            onPause={handlePause}
            onCancel={() => setShowCancelModal(true)}
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
    </>
  )
}