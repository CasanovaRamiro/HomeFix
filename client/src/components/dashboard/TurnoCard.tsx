import { Calendar, Eye, Users, AlertTriangle, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { UserPost } from '../../services/api'
import { PostStatus } from '../../types/post'

const STATUS_MAP: Record<PostStatus, { label: string; className: string }> = {
  [PostStatus.Active]:     { label: 'Activa',       className: 'bg-green-100 text-green-700' },
  [PostStatus.InProgress]: { label: 'En desarrollo', className: 'bg-blue-100 text-blue-700' },
  [PostStatus.Paused]:     { label: 'Pausada',       className: 'bg-amber-100 text-amber-700' },
  [PostStatus.Completed]:  { label: 'Completado',    className: 'bg-slate-100 text-slate-500' },
  [PostStatus.Cancelled]:  { label: 'Cancelado',     className: 'bg-red-100 text-red-600' },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' })

function getEmergencyTimeLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${mins}m restantes`
  return `${mins}m restantes`
}

export default function TurnoCard({ post }: { post: UserPost }) {
  const navigate = useNavigate()
  const st = STATUS_MAP[post.status] ?? STATUS_MAP.Active
  const timeLeft = post.isEmergency ? getEmergencyTimeLeft(post.emergencyExpiresAt) : null

  const needsReview = post.status === PostStatus.Completed && !post.hasReview

  const handleAction = () => {
    if (needsReview) {
      navigate('/review', {
        state: {
          postId: post.id,
          titulo: post.title,
          fecha: post.endDate,
          ubicacion: post.address,
          trabajador: {
            id: post.worker?.id ?? '',
            nombre: post.worker?.name ?? '',
            categoria: '',
            verificado: false,
          },
        },
      })
    } else {
      navigate(`/posts/${post.id}`)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">

      {/* Emergency banner */}
      {post.isEmergency && (
        <div className="flex items-center gap-2 bg-red-500 px-4 py-2 text-white text-sm font-bold">
          <AlertTriangle size={16} />
          <span>Urgente</span>
          {timeLeft && (
            <span className="ml-auto text-red-100 text-xs font-medium">{timeLeft}</span>
          )}
        </div>
      )}

      <div className="p-6">

        {/* Header */}
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-base truncate">
              {post.title}
            </p>
            <p className="text-slate-500 text-[13px] mt-0.5">
              {post.categories[0]?.name ?? ''}
            </p>
          </div>
          <span className={`${st.className} rounded-full px-3 py-1 text-xs font-semibold shrink-0`}>
            {st.label}
          </span>
        </div>

      <hr className="border-slate-100 my-4" />

      {/* Postulantes */}
      {post.status === PostStatus.Active && (
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-slate-400" />
          {post.applicantCount > 0 ? (
            <span className="text-sm font-semibold text-slate-700">
              {post.applicantCount} {post.applicantCount === 1 ? 'Trabajador postulado' : 'Trabajadores postulados'}
            </span>
          ) : (
            <span className="text-sm text-slate-400">
              Todavía no hay trabajadores postulados
            </span>
          )}
        </div>
      )}

      {/* Fecha + Botón */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <Calendar size={14} /> Fecha de publicación
          </p>
          <p className="font-bold text-slate-900 text-sm">{fmtDate(post.startDate)}</p>
        </div>
        <button
          onClick={handleAction}
          className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 transition-colors ${
            needsReview
              ? 'bg-amber-500 text-white hover:bg-amber-600!'
              : 'bg-blue-600 text-white hover:bg-blue-700!'
          }`}
        >
          {needsReview ? <><Star size={16} /> Calificar</> : <><Eye size={16} /> Ver detalle</>}
        </button>
      </div>

      </div>
    </div>
  )
}
