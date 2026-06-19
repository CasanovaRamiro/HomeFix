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
  userId: post.userId,
  titulo: post.title,
  descripcion: post.description,
  categoria: post.categories[0]?.name ?? 'Sin rubro',
  fechaPublicacion: formatPostDate(post.createdAt),
  fechaServicio: formatPostDate(post.startDate),
  createdAt: post.createdAt,
  startDate: post.startDate,
  photo: post.images[0]?.url ?? '',
  images: post.images ?? [],
  clientName: post.user?.name ?? 'Cliente',
  clientSurname: post.user?.surname ?? '',
  clientRating: post.clientRating ?? 0,
  address: post.address,
  isEmergency: post.isEmergency,
  emergencyExpiresAt: post.emergencyExpiresAt,
  allowsSubcontracting: post.allowsSubcontracting,
  lat: post.latitude,
  lng: post.longitude,
})
