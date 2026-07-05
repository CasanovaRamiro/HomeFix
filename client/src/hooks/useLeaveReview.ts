import { useState } from 'react'
import api, { uploadImages } from '../services/api'
import type { ReviewInput } from '../types/review'

export function useLeaveReview() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (data: ReviewInput & { photos?: File[] }) => {
    setSubmitting(true)
    setError('')
    try {
      let mediaUrls: string | undefined
      if (data.photos && data.photos.length > 0) {
        const urls = await uploadImages(data.photos)
        mediaUrls = JSON.stringify(urls)
      }
      const { photos, ...payload } = data
      await api.post('/reviews', { ...payload, mediaUrls })
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
