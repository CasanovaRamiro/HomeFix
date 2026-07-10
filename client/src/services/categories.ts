import api from './api'

export interface Category {
  id: string
  name: string
}

export const fetchCategories = () =>
  api.get<Category[]>('/categories')
