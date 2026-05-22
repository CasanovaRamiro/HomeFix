export interface PostCategory {
  category: {
    id: number
    name: string
  }
}

export interface Post {
  id: number
  userId: number
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  image: string
  categories: PostCategory[]
}

export interface TrabajoView {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  fechaPublicacion: string
  fechaServicio: string
  photo: string
}
