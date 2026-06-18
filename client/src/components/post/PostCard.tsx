import { AlertTriangle } from 'lucide-react'
import Badge from '../ui/Badge'
import type { Post } from '../../types/post'

interface PostCardProps {
  post: Post
  hasAcceptedWorker?: boolean
  hasUnreviewedWorkers?: boolean
  onComplete?: () => void
  onMarkInProgress?: () => void
  onPause?: (id: string) => void
  onCancel?: (id: string) => void
  onEdit?: (id: string) => void
  children?: React.ReactNode
}

const STATUS_MAP: Record<string, { label: string; variant: 'accent' | 'warning' | 'danger' | 'info' | 'primary' }> = {
  Active: { label: 'Activa', variant: 'accent' },
  'In progress': { label: 'En desarrollo', variant: 'info' },
  Paused: { label: 'Pausada', variant: 'warning' },
  Cancelled: { label: 'Cancelada', variant: 'danger' },
  Completed: { label: 'Completada', variant: 'primary' },
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

export default function PostCard({ post, hasAcceptedWorker, hasUnreviewedWorkers, onComplete, onMarkInProgress, onPause, onCancel, onEdit, children }: PostCardProps) {
  const status = STATUS_MAP[post.status] ?? { label: post.status, variant: 'outline' as const }
  const timeLeft = post.isEmergency ? getEmergencyTimeLeft(post.emergencyExpiresAt) : null

  return (
    <div className="info-card overflow-hidden">
      {/* Emergency banner */}
      {post.isEmergency && (
        <div className="flex items-center gap-2 bg-red-500 px-4 py-2.5 text-white text-sm font-bold -mx-[var(--card-p,1.5rem)] -mt-[var(--card-p,1.5rem)] mb-4">
          <AlertTriangle size={16} />
          <span>Publicacion de Emergencia</span>
          {timeLeft && (
            <span className="ml-auto text-red-100 text-xs font-medium">{timeLeft}</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
        <h2 className="!mb-0">{post.title}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
        {post.status === 'Completed' && hasUnreviewedWorkers && (
          <Badge variant="warning">Falta Calificar</Badge>
        )}
      </div>

      <div className="categories">
        {post.categories.map((c) => (
          <Badge key={c.id}>{c.name}</Badge>
        ))}
      </div>

      <p className="desc">{post.description}</p>

      {post.images && post.images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '0 0 0.75rem', paddingBottom: '4px' }}>
          {post.images.map((img, i) => (
            <a key={i} href={img.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
              <img
                src={img.url}
                alt={`Foto ${i + 1}`}
                style={{ width: '96px', height: '72px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
              />
            </a>
          ))}
        </div>
      )}

      <div className="info-row">
        <strong>Fechas:</strong>{' '}
        {new Date(post.startDate).toLocaleDateString()} — {new Date(post.endDate).toLocaleDateString()}
      </div>
      <div className="info-row">
        <strong>Publicado:</strong> {new Date(post.createdAt).toLocaleDateString()}
      </div>

      <div className="info-row" style={{ marginBottom: 0 }}>
        <strong>Direccion:</strong>{' '}
        <span
          title={post.address}
          style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}
        >
          {post.address}
        </span>
      </div>

      {children}

      <div className="post-actions" style={{ marginTop: '0.75rem' }}>
        {post.status !== 'Cancelled' && post.status !== 'Completed' && hasAcceptedWorker && (
          <>
            {post.status === 'Active' && onMarkInProgress ? (
              <button className="btn-primary" onClick={onMarkInProgress}>Marcar en progreso</button>
            ) : (
              <button className="btn-finished" onClick={onComplete}>Trabajo finalizado</button>
            )}
            <button className="btn-cancel" onClick={() => onCancel?.(post.id)}>Cancelar publicación</button>
          </>
        )}
        {post.status !== 'Cancelled' && post.status !== 'Completed' && !hasAcceptedWorker && (
          <>
            <button className="btn-outline" onClick={() => onEdit?.(post.id)}>Editar</button>
            <button className={`btn-pause${post.status === 'Paused' ? ' activating' : ''}`} onClick={() => onPause?.(post.id)}>
              {post.status === 'Paused' ? 'Activar' : 'Pausar'}
            </button>
            <button className="btn-cancel" onClick={() => onCancel?.(post.id)}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  )
}
