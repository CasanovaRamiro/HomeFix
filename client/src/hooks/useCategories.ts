import { useState, useEffect } from 'react'
import api from '../services/api'

export interface Category {
  id: string
  name: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Category[]>('/categories')
      .then(({ data }) => setCategories(data))
      .catch((err) => console.error('Error al cargar categorias:', err))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}
