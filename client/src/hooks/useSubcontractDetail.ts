import { useEffect, useState } from 'react'
import { fetchSubcontractById } from '../services/posts'
import type { SubcontractDetailDTO } from '../types/post'

export function useSubcontractDetail(
  id: string | undefined,
): {
  subcontract: SubcontractDetailDTO | null
  loading: boolean
  error: string
} {
  const [subcontract, setSubcontract] = useState<SubcontractDetailDTO | null>(null)
  const [syncId, setSyncId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id == null) return

    let ignore = false

    fetchSubcontractById(id)
      .then((res) => {
        if (!ignore) {
          setSubcontract(res.data)
          setSyncId(id)
        }
      })
      .catch((err) => {
        if (ignore) return
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 404) {
          setError('Subcontrato no encontrado')
        } else {
          setError(axiosErr.response?.data?.error ?? 'Error al cargar el subcontrato')
        }
        setSyncId(id)
      })

    return (): void => { ignore = true }
  }, [id])

  if (id == null) {
    return { subcontract: null, loading: false, error: 'ID no proporcionado' }
  }

  const loading = id !== syncId || (!subcontract && !error)

  return { subcontract, loading, error }
}