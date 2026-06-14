import { useEffect, useState } from 'react'
import { fetchSubcontractById } from '../services/posts'
import type { SubcontractDetailDTO } from '../types/post'

export function useSubcontractDetail(id: string | undefined) {
  const [subcontract, setSubcontract] = useState<SubcontractDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('ID no proporcionado')
      return
    }

    setLoading(true)
    setError('')

    fetchSubcontractById(id)
      .then((res) => setSubcontract(res.data))
      .catch((err) => {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 404) {
          setError('Subcontrato no encontrado')
        } else {
          setError(axiosErr.response?.data?.error ?? 'Error al cargar el subcontrato')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  return { subcontract, loading, error }
}