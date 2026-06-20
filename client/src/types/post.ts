export enum PostStatus {
  Active = 'Active',
  InProgress = 'In progress',
  Paused = 'Paused',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface PostCategoryDTO {
  id: string
  name: string
}

export interface PostDTO {
  id: string
  userId: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  isEmergency: boolean
  emergencyExpiresAt: string | null
  allowsSubcontracting: boolean
  categories: PostCategoryDTO[]
  user: {
    id: string
    name: string
    surname: string
  }
  clientRating: number
}

export type Post = PostDTO
export type PostCategory = PostCategoryDTO

export interface CreateSubcontractInput {
  parentPostId?: string
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  positions: {
    categoryId: string
    quantity: number
    roleDescription: string
  }[]
}

// --- Subcontract types ---

export interface SubcontractPosition {
  categoryId: string
  quantity: number
  roleDescription: string
}

export interface SubcontractDTO {
  id: string
  userId: string
  parentPostId: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  categories: PostCategoryDTO[]
  user: {
    id: string
    name: string
    surname: string
  }
  clientRating: number
}

export interface SubcontractCategoryDTO {
  id: string
  name: string
  quantity: number
  filledCount: number
  roleDescription: string
}

export interface AvailableSubcontractDTO {
  id: string
  userId: string
  parentPostId: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  categories: SubcontractCategoryDTO[]
  user: { id: string; name: string; surname: string }
  clientRating: number
}

export interface SubcontractDetailCategory {
  id: string
  name: string
  quantity: number
  filledCount: number
  roleDescription: string
}

export interface SubcontractDetailDTO {
  id: string
  userId: string
  type: string
  parentPostId?: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  categories: SubcontractDetailCategory[]
  user: { id: string; name: string; surname: string }
  clientRating: number
  workerRating?: number
  parentUser?: { name: string; surname: string }
  postIds?: string[]
}

export interface TrabajoView {
  id: string
  userId: string
  titulo: string
  descripcion: string
  categoria: string
  fechaPublicacion: string
  fechaServicio: string
  createdAt: string
  startDate: string
  photo: string
  images: { url: string }[]
  clientName: string
  clientSurname: string
  clientRating: number
  address: string
  isEmergency: boolean
  emergencyExpiresAt: string | null
  allowsSubcontracting: boolean
}
