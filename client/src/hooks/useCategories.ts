import { useState, useEffect, useCallback } from 'react'
import { fetchCategories, type Category } from '../services/categories'

export type { Category }

export function useCategories(): {
  categories: Category[]
  loading: boolean
  error: string | null
  retry: () => void
} {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ categories: Category[]; error: string | null; attempt: number }>({
    categories: [], error: null, attempt: -1,
  })

  useEffect(() => {
    let active = true
    fetchCategories()
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid category catalog')
        if (active) setResult({ categories: data, error: null, attempt })
      })
      .catch(() => {
        if (active) setResult({
          categories: [], attempt,
          error: 'No pudimos cargar las especialidades. Revisá tu conexión y volvé a intentarlo.',
        })
      })
    return (): void => { active = false }
  }, [attempt])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])
  const loading = result.attempt !== attempt
  return { categories: result.categories, loading, error: loading ? null : result.error, retry }
}
