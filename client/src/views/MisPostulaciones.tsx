import { useState, useMemo } from 'react'
import { MapPin, Calendar, Briefcase, ArrowLeft, Check, X } from 'lucide-react'

interface Postulacion {
  id: number
  titulo: string
  cliente: string
  ubicacion: string
  fecha_postulacion: string
  fecha_servicio: string
  estado: 'Aceptada' | 'Rechazada' | 'Pendiente'
}

const mockPostulaciones: Postulacion[] = [
  {
    id: 1,
    titulo: 'Reparacion de tuberias en cocina',
    cliente: 'Marta Ocampo',
    ubicacion: 'Recoleta, Buenos Aires',
    fecha_postulacion: '2026-05-08',
    fecha_servicio: '2026-05-15',
    estado: 'Aceptada',
  },
  {
    id: 2,
    titulo: 'Destape de caneria en bano',
    cliente: 'Juan Perez',
    ubicacion: 'Palermo, Buenos Aires',
    fecha_postulacion: '2026-05-06',
    fecha_servicio: '2026-05-10',
    estado: 'Aceptada',
  },
  {
    id: 3,
    titulo: 'Instalacion de calefon a gas',
    cliente: 'Laura Martinez',
    ubicacion: 'Villa Crespo, Buenos Aires',
    fecha_postulacion: '2026-05-04',
    fecha_servicio: '2026-05-20',
    estado: 'Rechazada',
  },
  {
    id: 4,
    titulo: 'Cambio de griferia completa en bano',
    cliente: 'Roberto Sanchez',
    ubicacion: 'Belgrano, Buenos Aires',
    fecha_postulacion: '2026-05-02',
    fecha_servicio: '2026-05-08',
    estado: 'Aceptada',
  },
]

const statusBadge: Record<string, string> = {
  Aceptada: 'bg-emerald-100 text-emerald-700',
  Rechazada: 'bg-rose-100 text-rose-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

const statusCircle: Record<string, string> = {
  Aceptada: 'bg-emerald-50 text-emerald-600',
  Rechazada: 'bg-rose-50 text-rose-600',
  Pendiente: 'bg-amber-50 text-amber-600',
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

export default function MisPostulaciones() {
  const [postulaciones] = useState(mockPostulaciones)
  const [filter, setFilter] = useState<Tab>('Todas')

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

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-slate-50 p-12 text-center">
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
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 pb-12 lg:grid-cols-2">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${statusCircle[p.estado]}`}
                  >
                    {p.estado === 'Aceptada' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-900">{p.titulo}</h3>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[p.estado]}`}
                      >
                        {p.estado}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {getInitials(p.cliente)}
                      </span>
                      <span>{p.cliente}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.ubicacion}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Postulado {formatDate(p.fecha_postulacion)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Servicio {formatDate(p.fecha_servicio)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
