import type { Post, TrabajoView } from '../types/post'

export const WORKER_CATEGORY_KEY = 'workerCategory'
export const DEFAULT_WORKER_CATEGORY = ''

export const formatPostDate = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const postToTrabajo = (post: Post): TrabajoView & { lat?: number | null; lng?: number | null } => ({
  id: post.id,
  titulo: post.title,
  descripcion: post.description,
  categoria: post.categories[0]?.category.name ?? 'Sin rubro',
  fechaPublicacion: formatPostDate(post.createdAt),
  fechaServicio: formatPostDate(post.startDate),
  photo: post.image,
  lat: post.latitude,
  lng: post.longitude,
})
