import type { Post, TrabajoView } from '../types/post'

export const WORKER_CATEGORY_KEY = 'workerCategory'
export const DEFAULT_WORKER_CATEGORY = ''

export const formatPostDate = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mockClientRating = (seed: string): number => {
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return Number((3.5 + ((sum % 100) / 100) * 1.5).toFixed(1))
}

export const postToTrabajo = (post: Post): TrabajoView & { lat?: number | null; lng?: number | null } => ({
  id: post.id,
  titulo: post.title,
  descripcion: post.description,
  categoria: post.categories[0]?.name ?? 'Sin rubro',
  fechaPublicacion: formatPostDate(post.createdAt),
  fechaServicio: formatPostDate(post.startDate),
  createdAt: post.createdAt,
  startDate: post.startDate,
  photo: post.images[0]?.url ?? '',
  clientName: post.user?.name ?? 'Cliente',
  clientSurname: post.user?.surname ?? '',
  clientRating: mockClientRating(post.userId ?? post.id),
  address: post.address,
  lat: post.latitude,
  lng: post.longitude,
})
