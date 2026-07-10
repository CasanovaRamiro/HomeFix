import { useState, useEffect } from 'react'
import { fetchCategories, type Category } from '../services/categories'

export type { Category }

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
      .then(({ data }) => { if (Array.isArray(data)) setCategories(data) })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}
