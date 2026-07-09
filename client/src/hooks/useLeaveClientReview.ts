import { useState } from 'react'
import { createClientReview } from '../services/reviews'
import type { ClientReviewInput } from '../types/clientReview'

export function useLeaveClientReview() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (data: ClientReviewInput) => {
    setSubmitting(true)
    setError('')
    try {
      await createClientReview(data)
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
