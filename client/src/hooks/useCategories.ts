import { useState, useEffect } from 'react'
import api from '../services/api'

export interface Category {
  id: number
  name: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Category[]>('/categories')
      .then(({ data }) => { if (Array.isArray(data)) setCategories(data) })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}
