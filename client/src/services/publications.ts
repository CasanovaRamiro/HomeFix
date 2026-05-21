import api from './api'
import type { Publication } from '../types/publication'

export const fetchAvailablePublications = (category?: string) =>
  api.get<Publication[]>('/publications/available', {
    params: category?.trim() ? { category: category.trim() } : undefined,
  })

export const fetchAvailableByCategory = fetchAvailablePublications

export const fetchPublicationById = (id: number) =>
  api.get<Publication>(`/publications/${id}`)
