import type { Publication, TrabajoView } from '../types/publication'

export const WORKER_CATEGORY_KEY = 'workerCategory'
export const DEFAULT_WORKER_CATEGORY = ''

export const titleFromDescription = (description: string): string =>
  description.split('\n')[0].trim()

export const formatPublicationDate = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const publicationToTrabajo = (p: Publication): TrabajoView => ({
  id: p.id,
  titulo: titleFromDescription(p.description),
  descripcion: p.description,
  categoria: p.typePublication,
  fechaPublicacion: formatPublicationDate(p.date),
  fechaServicio: formatPublicationDate(p.fromStartJob),
  photo: p.photo,
})
