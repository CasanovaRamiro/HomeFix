import { useState } from 'react'
import api from '../services/api'
import type { ReviewInput } from '../types/review'

export function useLeaveReview() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (data: ReviewInput) => {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/reviews', data)
      setSubmitted(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, submitted, error, submit, setSubmitted }
}
