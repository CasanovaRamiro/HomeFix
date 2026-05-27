import { useState, useMemo, useEffect, useCallback } from 'react'
import { MapPin, Calendar, Briefcase, ArrowLeft, Bell, XCircle, Phone, Tag, Loader } from 'lucide-react'
import api from '../services/api'

interface Postulacion {
  id: number
  postId: number
  titulo: string
  cliente: string
  ubicacion: string
  fecha_postulacion: string
  fecha_servicio: string
  estado: 'Aceptada' | 'Rechazada' | 'Pendiente'
}

const statusBadge: Record<string, string> = {
  Aceptada: 'bg-emerald-100 text-emerald-700',
  Rechazada: 'bg-rose-100 text-rose-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

const tabs = ['Todas', 'Pendientes', 'Aceptadas', 'Rechazadas'] as const
type Tab = (typeof tabs)[number]

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface PostDetalle {
  descripcion: string
  categorias: string[]
  imagenes: string[]
  telefono: string
  fecha_fin: string
}

function PostulacionCard({ postulacion: p }: { postulacion: Postulacion }) {
  const [detalle, setDetalle] = useState<PostDetalle | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setCargando(true)
    api.get<PostDetalle>(`/posts/${p.postId}`)
      .then((res) => { setDetalle(res.data); setCargando(false) })
      .catch(() => {
        setDetalle({ descripcion: '', categorias: [], imagenes: [], telefono: '', fecha_fin: '' })
        setCargando(false)
      })
  }, [p.postId])

  const primerImagen = detalle?.imagenes?.[0]

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header: Título + Badge */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">{p.titulo}</h3>
        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[p.estado]}`}>
          {p.estado}
        </span>
      </div>

      {/* Main content: Left (info) + Right (image) */}
      <div className="flex gap-6 mb-4 flex-grow">
        {/* Left: Cliente, fechas, ubicación, descripción, categorías */}
        <div className="flex-1 min-w-0">
          {/* Cliente */}
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700">
              {getInitials(p.cliente)}
            </div>
            <span>{p.cliente}</span>
          </div>

          {/* Fechas */}
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Postulado {formatDate(p.fecha_postulacion)} — A realizar el {formatDate(p.fecha_servicio)}</span>
          </div>

          {/* Ubicación */}
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{p.ubicacion}</span>
          </div>

          {/* Descripción */}
          {cargando ? (
            <div className="mb-3 flex items-center justify-center py-2">
              <Loader className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : (
            detalle && (
              <>
                {detalle.descripcion && (
                  <p className="mb-3 text-sm text-slate-600 italic leading-relaxed">
                    "{detalle.descripcion}"
                  </p>
                )}

                {/* Categorías */}
                {detalle.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detalle.categorias.map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        <Tag className="h-3 w-3" />{cat}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )
          )}
        </div>

        {/* Right: Image */}
        {primerImagen && (
          <div className="shrink-0">
            <img
              src={primerImagen}
              alt=""
              className="h-40 w-56 rounded-xl object-cover"
            />
          </div>
        )}
      </div>

      {/* Footer: Contact button (always at bottom) */}
      {detalle?.telefono && p.estado === 'Aceptada' && (
        <a
          href={`tel:${detalle.telefono}`}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Contactar cliente
        </a>
      )}
    </div>
  )
}

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([])
  const [filter, setFilter] = useState<Tab>('Todas')
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)

  const fetchPostulaciones = useCallback(async () => {
    try {
      const res = await api.get<Postulacion[]>('/api/postulaciones/mis-postulaciones')
      const data = res.data

      setPostulaciones((prev) => {
        const prevMap = new Map(prev.map((p) => [p.id, p.estado]))
        const changes: string[] = []
        for (const p of data) {
          const oldEstado = prevMap.get(p.id)
          if (oldEstado && oldEstado !== p.estado) {
            changes.push(
              `"${p.titulo}" → ${p.estado}`
            )
          }
        }
        if (changes.length > 0) {
          setNotification(
            `¡El estado de ${changes.length === 1 ? 'tu postulación' : 'tus postulaciones'} cambió! ${changes.join(', ')}`
          )
        }
        return data
      })

      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPostulaciones()
    const interval = setInterval(fetchPostulaciones, 20_000)
    return () => clearInterval(interval)
  }, [fetchPostulaciones])

  const metrics = useMemo(() => {
    const total = postulaciones.length
    const pendientes = postulaciones.filter((p) => p.estado === 'Pendiente').length
    const aceptadas = postulaciones.filter((p) => p.estado === 'Aceptada').length
    const rechazadas = postulaciones.filter((p) => p.estado === 'Rechazada').length
    return { total, pendientes, aceptadas, rechazadas }
  }, [postulaciones])

  const filtered = useMemo(() => {
    if (filter === 'Todas') return postulaciones
    return postulaciones.filter((p) => p.estado === filter.slice(0, -1))
  }, [postulaciones, filter])

  return (
    <div className="min-h-screen font-montserrat">

      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-start gap-3 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-900">{notification}</p>
          <button onClick={() => setNotification(null)} className="shrink-0 p-0 border-0 bg-transparent text-emerald-400 hover:text-emerald-700">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="w-full bg-[#0F172A]">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
          <button className="bg-transparent text-slate-300 hover:text-white flex items-center gap-2 border-0 p-0 text-sm font-medium transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Mis Postulaciones
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Revisa el estado de tus postulaciones a trabajos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total', value: metrics.total, color: 'text-white' },
              { label: 'Pendientes', value: metrics.pendientes, color: 'text-warning' },
              { label: 'Aceptadas', value: metrics.aceptadas, color: 'text-accent' },
              { label: 'Rechazadas', value: metrics.rechazadas, color: 'text-danger' },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#1E293B]/60 p-6 transition-all duration-300 hover:scale-[1.02]"
              >
                <span className={`text-4xl font-bold ${m.color}`}>{m.value}</span>
                <span className="mt-1 text-sm text-white/50">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-[#F8FAFC]">
        <div className="-mt-6 z-10 w-full"> 
          <div className="w-full bg-white py-4 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      filter === tab
                        ? 'bg-[#0F172A] text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#0F172A]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border bg-slate-50 p-12 text-center">
                <Briefcase className="mb-4 h-12 w-12 text-slate-400" />
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  No hay postulaciones
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filter === 'Todas'
                    ? 'Todavía no te postulaste a ningún trabajo.'
                    : `No tenés postulaciones en "${filter}".`}
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mt-8 grid grid-cols-1 gap-6 pb-12 lg:grid-cols-2">
                {filtered.map((p) => (
                  <PostulacionCard key={`${p.id}-${p.postId}`} postulacion={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
