import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ArrowLeft, Tag, Phone, Briefcase, Check, Loader } from 'lucide-react'
import api from '../services/api'

interface PostDetailData {
  id: number
  titulo: string
  descripcion: string
  cliente: string
  telefono: string
  ubicacion: string
  fecha_servicio: string
  fecha_fin: string
  categorias: string[]
  imagenes: string[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<PostDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<PostDetailData>(`/posts/${id}`)
      .then((res) => { setPost(res.data); setLoading(false) })
      .catch(() => { setError('Publicación no encontrada'); setLoading(false) })
  }, [id])

  const handleApply = async () => {
    if (!post) return
    setApplying(true)
    setError(null)
    try {
      await api.post('/api/postulaciones', { postId: post.id })
      setApplied(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al postularte'
      setError(msg)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#0F172A]" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <Briefcase className="h-12 w-12 text-slate-400" />
        <p className="text-slate-600 font-medium">{error || 'Publicación no encontrada'}</p>
        <button
          onClick={() => navigate('/trabajador/feed')}
          className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white"
        >
          Volver al feed
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-montserrat bg-[#F8FAFC]">
      <div className="w-full bg-[#0F172A]">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/trabajador/feed')}
            className="bg-transparent text-slate-300 hover:text-white flex items-center gap-2 border-0 p-0 text-sm font-medium transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al feed
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {post.titulo}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Publicado por {post.cliente}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.categorias.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200"
              >
                <Tag className="h-3 w-3" />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

          <div className="lg:col-span-2 space-y-6">
            {post.imagenes.length > 0 && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <img
                  src={post.imagenes[0]}
                  alt={post.titulo}
                  className="w-full h-72 object-cover"
                />
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Descripción del trabajo
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {post.descripcion}
              </p>
            </div>

            {post.imagenes.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {post.imagenes.slice(1).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${post.titulo} ${i + 2}`}
                    className="rounded-xl object-cover h-28 w-full"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Detalles
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Ubicación</p>
                    <p className="text-slate-500">{post.ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Fecha del servicio</p>
                    <p className="text-slate-500">{formatDate(post.fecha_servicio)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Fecha estimada de finalización</p>
                    <p className="text-slate-500">{formatDate(post.fecha_fin)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Contacto</p>
                    <p className="text-slate-500">{post.cliente}</p>
                    {post.telefono && <p className="text-slate-500">{post.telefono}</p>}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={applying || applied}
              className={`w-full rounded-xl py-3 px-4 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                applied
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-[#0F172A] text-white hover:bg-[#1e293b] active:scale-[0.98] disabled:opacity-60'
              }`}
            >
              {applying ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Postulando...
                </>
              ) : applied ? (
                <>
                  <Check className="h-4 w-4" />
                  Te postulaste con éxito
                </>
              ) : (
                'Postularme'
              )}
            </button>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
