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
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-semibold">{post.title}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 my-3">
        {post.categories.map((c) => (
          <Badge key={c.category.id}>{c.category.name}</Badge>
        ))}
      </div>

      <p className="text-sm leading-relaxed my-4 whitespace-pre-wrap">{post.description}</p>

      <div className="text-sm text-text-muted mb-2"><strong className="text-text">Dirección:</strong> {post.address}</div>
      <div className="text-sm text-text-muted mb-2">
        <strong className="text-text">Fechas:</strong>{' '}
        {new Date(post.startDate).toLocaleDateString()} — {new Date(post.endDate).toLocaleDateString()}
      </div>
      <div className="text-sm text-text-muted mb-2">
        <strong className="text-text">Publicado:</strong> {new Date(post.createdAt).toLocaleDateString()}
      </div>

      {post.status !== 'Cancelled' && (
        <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border">
          <button className="px-4 py-1.5 text-[13px] bg-primary">Editar</button>
          <button className="px-4 py-1.5 text-[13px] bg-[#f59e0b] hover:bg-[#d97706]">
            {post.status === 'Paused' ? 'Activar' : 'Pausar'}
          </button>
          <button className="px-4 py-1.5 text-[13px] bg-danger hover:bg-[#dc2626]">Cancelar</button>
        </div>
      )}
    </div>
  )
}
