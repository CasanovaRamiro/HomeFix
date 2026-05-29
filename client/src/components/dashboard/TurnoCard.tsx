import { MessageSquare, Star, X, RefreshCw, Calendar, Clock } from 'lucide-react'
import type { UserPost } from '../../services/api'

const STATUS_MAP = {
  Active:    { label: 'Pendiente',  className: 'bg-amber-100 text-amber-700' },
  Paused:    { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-700' },
  Finalized: { label: 'Completado', className: 'bg-slate-100 text-slate-500' },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' })

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function TurnoCard({ post }: { post: UserPost }) {
  const st = STATUS_MAP[post.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.Active
  const isFinalized = post.status === 'Finalized'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">

      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-base truncate">
            {post.worker?.name ?? 'Sin trabajador asignado'}
          </p>
          <p className="text-slate-500 text-[13px] mt-0.5">
            {post.categories[0]?.name ?? post.title}
          </p>
        </div>
        <span className={`${st.className} rounded-full px-3 py-1 text-xs font-semibold shrink-0`}>
          {st.label}
        </span>
      </div>

      <hr className="border-slate-100 my-4" />

      {/* Fecha / Hora */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
            <Calendar size={10} /> Fecha
          </p>
          <p className="font-bold text-slate-900 text-sm mt-1">{fmtDate(post.startDate)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
            <Clock size={10} /> Hora
          </p>
          <p className="font-bold text-slate-900 text-sm mt-1">{fmtTime(post.startDate)}</p>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{post.description}</p>

      {/* Acciones */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap items-center">
          {isFinalized ? (
            <button
              disabled
              title="Funcionalidad en desarrollo"
              className="flex items-center gap-1.5 bg-slate-100 text-slate-400 text-[13px] font-semibold rounded-lg px-3.5 py-2 opacity-70 cursor-not-allowed"
            >
              <Star size={13} /> Dejar Reseña
              <span className="text-[11px] italic">(próximamente)</span>
            </button>
          ) : (
            <>
              <button className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[13px] font-semibold rounded-lg px-3.5 py-2 hover:bg-slate-200! transition-colors">
                <RefreshCw size={13} /> Reagendar
              </button>
              <button
                disabled
                title="Funcionalidad en desarrollo"
                className="flex items-center gap-1.5 bg-red-50 text-red-500 text-[13px] font-semibold rounded-lg px-3.5 py-2 opacity-70 cursor-not-allowed"
              >
                <X size={13} /> Cancelar
                <span className="text-[11px] italic">(próximamente)</span>
              </button>
            </>
          )}
        </div>
        <button className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[13px] font-semibold rounded-lg px-3.5 py-2 hover:bg-slate-200! transition-colors">
          <MessageSquare size={13} /> Chat
        </button>
      </div>

    </div>
  )
}
