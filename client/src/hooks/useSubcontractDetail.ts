import { useEffect, useReducer } from 'react'
import { fetchSubcontractById } from '../services/posts'
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

export function useSubcontractDetail(
  id: string | undefined,
): {
  subcontract: SubcontractDetailDTO | null
  loading: boolean
  error: string
} {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!id) {
      dispatch({ type: 'RESET' })
      return
    }

    let ignore = false

    fetchSubcontractById(id)
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
  }, [id])

  const loading = id !== state.syncId || (!state.subcontract && !state.error)

  return { subcontract: state.subcontract, loading, error: state.error }
}
