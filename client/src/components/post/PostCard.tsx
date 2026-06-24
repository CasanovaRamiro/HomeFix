import { useState } from 'react'
import {
  AlertTriangle, CalendarRange, MapPin, Clock3, Pencil, Pause, Play, Trash2, Flag, CalendarCheck,
  CircleDot, Loader, Check, X,
} from 'lucide-react'
import { getCategoryMeta } from '../../views/categoryMeta'
import ImageModal from '../ui/ImageModal'
import type { Post } from '../../types/post'

interface PostCardProps {
  post: Post
  hasAcceptedWorker?: boolean
  scheduledDate?: string | null
  hasUnreviewedWorkers?: boolean
  onComplete?: () => void
  onMarkInProgress?: () => void
  onViewReview?: () => void
  onPause?: (id: string) => void
  onCancel?: (id: string) => void
  onEdit?: (id: string) => void
  children?: React.ReactNode
}

const STATUS_MAP: Record<string, { label: string; cls: string; Icon: typeof CircleDot }> = {
  Active:        { label: 'Activa',        cls: 'pd-badge--active',    Icon: CircleDot },
  'In progress': { label: 'En curso', cls: 'pd-badge--progress',  Icon: Loader },
  Paused:        { label: 'Pausada',       cls: 'pd-badge--paused',    Icon: Pause },
  Cancelled:     { label: 'Cancelada',     cls: 'pd-badge--cancelled', Icon: X },
  Completed:     { label: 'Completada',    cls: 'pd-badge--completed', Icon: Check },
}

function getEmergencyTimeLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${mins}m restantes`
  return `${mins}m restantes`
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function PostCard({
  post, hasAcceptedWorker, scheduledDate, onComplete, onViewReview, onPause, onCancel, onEdit,
}: PostCardProps) {
  const status = STATUS_MAP[post.status] ?? { label: post.status, cls: 'pd-badge--completed', Icon: CircleDot }
  const StatusIcon = status.Icon
  const timeLeft = post.isEmergency ? getEmergencyTimeLeft(post.emergencyExpiresAt) : null

  const tradeName = post.categories[0]?.name ?? ''
  const meta = getCategoryMeta(tradeName)
  const TradeIcon = meta.Icon

  const closed = post.status === 'Cancelled' || post.status === 'Completed'
  const [selectedImg, setSelectedImg] = useState<number | null>(null)
  const images = post.images ?? []

  return (
    <aside className="post-card">
      {post.isEmergency && (
        <div className="post-emergency">
          <AlertTriangle size={15} />
          <span>Publicación de emergencia</span>
          {timeLeft && <span className="ml-auto">{timeLeft}</span>}
        </div>
      )}

      {/* Trade-colored header band — tint + icon tile from categoryMeta. */}
      <div className={`pc-header-band ${meta.bg}`}>
        <span className={`pc-trade ${meta.text}`}>
          <span className={`pc-trade-ic ${meta.strip}`}><TradeIcon size={16} /></span>
          <span className="pc-trade-label">{tradeName || 'General'}</span>
        </span>
        <span className={`pd-badge ${status.cls}`}><StatusIcon size={12} />{status.label}</span>
      </div>

      <div className="post-card-body">
        <h2 className="pc-title">{post.title}</h2>
        <p className="pc-desc">{post.description}</p>

        {images.length > 0 && (
          <div className="pc-photos">
            {images.map((img, i) => (
              <button key={i} className="pc-photo-btn" onClick={() => setSelectedImg(i)}>
                <img src={img.url} alt={`Foto ${i + 1}`} />
              </button>
            ))}
          </div>
        )}

        {selectedImg !== null && (
          <ImageModal
            src={images[selectedImg].url}
            alt={`Foto ${selectedImg + 1}`}
            onClose={() => setSelectedImg(null)}
            onPrev={selectedImg > 0 ? () => setSelectedImg(selectedImg - 1) : undefined}
            onNext={selectedImg < images.length - 1 ? () => setSelectedImg(selectedImg + 1) : undefined}
          />
        )}

        <div className="pc-facts">
          <div className="pc-fact">
            <span className="pc-fact-ic"><CalendarRange size={17} /></span>
            <div className="pc-fact-txt">
              <div className="pc-fact-label">Fechas del trabajo</div>
              <div className="pc-fact-val">{fmtDate(post.startDate)} – {fmtDate(post.endDate)}</div>
            </div>
          </div>
          <div className="pc-fact">
            <span className="pc-fact-ic"><MapPin size={17} /></span>
            <div className="pc-fact-txt">
              <div className="pc-fact-label">Dirección</div>
              <div className="pc-fact-val" title={post.address}>{post.address}</div>
            </div>
          </div>
          <div className="pc-fact">
            <span className="pc-fact-ic"><Clock3 size={17} /></span>
            <div className="pc-fact-txt">
              <div className="pc-fact-label">Publicado</div>
              <div className="pc-fact-val">{fmtDate(post.createdAt)}</div>
            </div>
          </div>
          {scheduledDate && (
            <div className="pc-fact">
              <span className="pc-fact-ic"><CalendarCheck size={17} /></span>
              <div className="pc-fact-txt">
                <div className="pc-fact-label">Visita pactada</div>
                <div className="pc-fact-val" style={{ color: '#065F46', fontWeight: 600 }}>
                  {new Date(scheduledDate).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
        </div>

        {post.status === 'Completed' && (
          <div className="pc-manage">
            <button className="pd-btn pd-btn--outline pd-btn--block" onClick={onViewReview}>Ver reseña</button>
          </div>
        )}

        {!closed && hasAcceptedWorker && (
          <div className="pc-manage">
            <button className="pd-btn pd-btn--accent pd-btn--block" onClick={onComplete}>
              <Flag size={16} />Marcar trabajo finalizado
            </button>
            <button className="pd-btn pd-btn--danger pd-btn--block" onClick={() => onCancel?.(post.id)}>
              <Trash2 size={16} />Cancelar contratación
            </button>
          </div>
        )}

        {!closed && !hasAcceptedWorker && (
          <div className="pc-manage">
            <button className="pd-btn pd-btn--outline" style={{ flex: 1 }} onClick={() => onEdit?.(post.id)}>
              <Pencil size={16} />Editar
            </button>
            <button className="pd-btn pd-btn--warning" style={{ flex: 1 }} onClick={() => onPause?.(post.id)}>
              {post.status === 'Paused' ? <><Play size={16} />Activar</> : <><Pause size={16} />Pausar</>}
            </button>
            <button className="pd-btn pd-btn--danger" style={{ flex: 1 }} onClick={() => onCancel?.(post.id)}>
              <Trash2 size={16} />Cancelar
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
