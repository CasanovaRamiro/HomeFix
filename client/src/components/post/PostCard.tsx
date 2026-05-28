import Badge from '../ui/Badge'

interface Category {
  category: { id: string; name: string }
}

interface PostDetail {
  id: string
  userId: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  categories: Category[]
}

interface PostCardProps {
  post: PostDetail
}

const STATUS_MAP: Record<string, { label: string; variant: 'accent' | 'warning' | 'danger' }> = {
  Active: { label: 'Activa', variant: 'accent' },
  Paused: { label: 'Pausada', variant: 'warning' },
  Cancelled: { label: 'Cancelada', variant: 'danger' },
}

export default function PostCard({ post }: PostCardProps) {
  const status = STATUS_MAP[post.status] ?? { label: post.status, variant: 'outline' as const }

  return (
    <div className="info-card">
      <div className="flex items-center gap-2 mb-3">
        <h2>{post.title}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="categories">
        {post.categories.map((c) => (
          <Badge key={c.category.id}>{c.category.name}</Badge>
        ))}
      </div>

      <p className="desc">{post.description}</p>

      <div className="info-row"><strong>Dirección:</strong> {post.address}</div>
      <div className="info-row">
        <strong>Fechas:</strong>{' '}
        {new Date(post.startDate).toLocaleDateString()} — {new Date(post.endDate).toLocaleDateString()}
      </div>
      <div className="info-row">
        <strong>Publicado:</strong> {new Date(post.createdAt).toLocaleDateString()}
      </div>

      {post.status !== 'Cancelled' && (
        <div className="post-actions">
          <button className="btn-edit">Editar</button>
          <button className="btn-pause">{post.status === 'Paused' ? 'Activar' : 'Pausar'}</button>
          <button className="btn-cancel">Cancelar</button>
        </div>
      )}
    </div>
  )
}
