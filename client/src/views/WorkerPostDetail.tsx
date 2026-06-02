import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Tag, Briefcase, User } from 'lucide-react'
import { fetchPostById } from '../services/posts'
import type { Post } from '../types/post'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function WorkerPostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      queueMicrotask(() => {
        if (!cancelled) {
          setError('ID de publicación no válido')
          setLoading(false)
        }
      })
      return () => { cancelled = true }
    }

    fetchPostById(id)
      .then(({ data }) => {
        if (!cancelled) {
          setPost(data as unknown as Post)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar la publicación')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#0F172A]" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-500">{error || 'Publicación no encontrada'}</p>
        <button onClick={() => navigate('/worker')} className="text-sm text-slate-600 underline cursor-pointer bg-transparent border-0">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-montserrat">
      <div className="w-full bg-[#0F172A]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-transparent text-slate-300 hover:text-white flex items-center gap-2 border-0 p-0 text-sm font-medium transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-6 w-6 text-[#10B981]" />
            <h1 className="text-2xl font-bold text-white">{post.title}</h1>
          </div>
          <p className="text-sm text-white/60 ml-9">
            {post.user?.name ?? 'Cliente'} — {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(post.categories ?? []).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
              >
                <Tag className="h-3 w-3" />
                {cat.name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {post.address}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.startDate)} — {formatDate(post.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.user?.name ?? 'Cliente'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/worker/available-jobs?id=${post.id}`)}
            className="flex-1 rounded-lg bg-[#0F172A] text-white py-3 px-6 text-sm font-semibold border-0 cursor-pointer hover:bg-[#1e293b] transition-colors"
          >
            Postularme a este trabajo
          </button>
          <button
            onClick={() => navigate('/worker')}
            className="rounded-lg bg-white text-slate-700 py-3 px-6 text-sm font-medium border border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Ver todos los trabajos
          </button>
        </div>
      </div>
    </div>
  )
}
