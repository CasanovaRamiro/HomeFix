import { useCallback, useEffect, useReducer, useState } from 'react'
import { fetchSubcontractById, fetchSubcontractGroupDetail } from '../services/posts'
import type { SubcontractDetailDTO } from '../types/post'

type State = {
  subcontract: SubcontractDetailDTO | null
  syncId: string | null
  error: string
}

type Action =
  | { type: 'SUCCESS'; subcontract: SubcontractDetailDTO; id: string }
  | { type: 'ERROR'; error: string; id: string }
  | { type: 'RESET' }

const initialState: State = {
  subcontract: null,
  syncId: null,
  error: '',
}

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'SUCCESS':
      return { subcontract: action.subcontract, syncId: action.id, error: '' }
    case 'ERROR':
      return { subcontract: null, syncId: action.id, error: action.error }
    case 'RESET':
      return initialState
  }
}

function useSubcontractDetailBase(
  id: string | undefined,
  fetcher: (id: string) => Promise<{ data: SubcontractDetailDTO }>,
): {
  subcontract: SubcontractDetailDTO | null
  loading: boolean
  error: string
  refetch: () => void
} {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!id) {
      dispatch({ type: 'RESET' })
      return
    }

    let ignore = false

    fetcher(id)
      .then((res) => {
        if (!ignore) {
          dispatch({ type: 'SUCCESS', subcontract: res.data, id })
        }
      })
      .catch((err) => {
        if (ignore) return
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 404) {
          dispatch({ type: 'ERROR', error: 'Subcontrato no encontrado', id })
        } else {
          dispatch({ type: 'ERROR', error: axiosErr.response?.data?.error ?? 'Error al cargar el subcontrato', id })
        }
      })

    return (): void => { ignore = true }
  }, [id, fetcher, refreshKey])

  const loading = id !== state.syncId || (!state.subcontract && !state.error)
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { subcontract: state.subcontract, loading, error: state.error, refetch }
}

export function useSubcontractDetail(
  id: string | undefined,
): {
  subcontract: SubcontractDetailDTO | null
  loading: boolean
  error: string
  refetch: () => void
} {
  return useSubcontractDetailBase(id, fetchSubcontractById)
}

export function useSubcontractGroupDetail(
  id: string | undefined,
): {
  subcontract: SubcontractDetailDTO | null
  loading: boolean
  error: string
  refetch: () => void
} {
  return useSubcontractDetailBase(id, fetchSubcontractGroupDetail)
}
