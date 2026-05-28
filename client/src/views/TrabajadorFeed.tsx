import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Briefcase, ArrowLeft, Tag } from 'lucide-react'
import api from '../services/api'

interface PostFeed {
  id: number
  titulo: string
  descripcion: string
  cliente: string
  ubicacion: string
  fecha_servicio: string
  fecha_fin: string
  categorias: string[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text
}

export default function TrabajadorFeed() {
  const [posts, setPosts] = useState<PostFeed[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<PostFeed[]>('/posts')
      .then((res) => { setPosts(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen font-montserrat">
      <div className="w-full bg-[#0F172A]">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/worker/my-applications')}
            className="bg-transparent text-slate-300 hover:text-white flex items-center gap-2 border-0 p-0 text-sm font-medium transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Mis Postulaciones
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Trabajos Disponibles
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Encontrá el trabajo que mejor se adapte a tus habilidades
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#F8FAFC]">
        <div className="-mt-6 z-10 w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#0F172A]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border bg-slate-50 p-12 text-center">
                <Briefcase className="mb-4 h-12 w-12 text-slate-400" />
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  No hay trabajos disponibles
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Por ahora no hay publicaciones activas. Volvé más tarde.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 pb-12 lg:grid-cols-2">
                {posts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/worker/posts/${p.id}`)}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <h3 className="text-base font-bold text-slate-900 flex-1">
                        {p.titulo}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed">
                      {truncate(p.descripcion, 120)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {p.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          <Tag className="h-3 w-3" />
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.ubicacion}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(p.fecha_servicio)}
                      </span>
                      <span className="text-slate-300">—</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        {p.cliente}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
