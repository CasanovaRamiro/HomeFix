import Badge from '../ui/Badge'
import type { Post } from '../../types/post'

interface PostCardProps {
  post: Post
  hasAcceptedWorker?: boolean
  onComplete?: () => void
  onReopen?: () => void
  onViewReview?: () => void
}

const STATUS_MAP: Record<string, { label: string; variant: 'accent' | 'warning' | 'danger' | 'info' }> = {
  Active: { label: 'Activa', variant: 'accent' },
  'In progress': { label: 'En desarrollo', variant: 'info' },
  Paused: { label: 'Pausada', variant: 'warning' },
  Cancelled: { label: 'Cancelada', variant: 'danger' },
  Completed: { label: 'Completada', variant: 'primary' },
}

export default function PostCard({ post, hasAcceptedWorker, onComplete, onReopen, onViewReview }: PostCardProps) {
  const status = STATUS_MAP[post.status] ?? { label: post.status, variant: 'outline' as const }

  return (
    <div className="info-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
        <h2 className="!mb-0">{post.title}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="categories">
        {post.categories.map((c) => (
          <Badge key={c.id}>{c.name}</Badge>
        ))}
      </div>

      <p className="desc">{post.description}</p>

      <div className="info-row">
        <strong>Fechas:</strong>{' '}
        {new Date(post.startDate).toLocaleDateString()} — {new Date(post.endDate).toLocaleDateString()}
      </div>
      <div className="info-row">
        <strong>Publicado:</strong> {new Date(post.createdAt).toLocaleDateString()}
      </div>

      <div className="flex justify-between items-center" style={{ marginTop: '0.5rem' }}>
        <div className="info-row" style={{ marginBottom: 0 }}>
          <strong>Dirección:</strong> {post.address}
        </div>
        {post.status === 'Completed' && (
          <div className="post-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <button className="btn-primary" onClick={onViewReview}>Ver reseña</button>
          </div>
        )}
        {post.status !== 'Cancelled' && post.status !== 'Completed' && hasAcceptedWorker && (
          <div className="post-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <button className="btn-finished" onClick={onComplete}>Trabajo finalizado</button>
            <button className="btn-reopen" onClick={onReopen}>Reabrir búsqueda</button>
          </div>
        )}
        {post.status !== 'Cancelled' && post.status !== 'Completed' && !hasAcceptedWorker && (
          <div className="post-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <button className="btn-outline">Editar</button>
            <button className="btn-pause">{post.status === 'Paused' ? 'Activar' : 'Pausar'}</button>
            <button className="btn-cancel">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
