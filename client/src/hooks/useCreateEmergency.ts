import { useState } from 'react'
import { createEmergencyPost } from '../services/posts'

export function useCreateEmergency(_userId: string) {
  const [form, setForm] = useState({
    title: '',
    description: 'Necesito ayuda urgente',
    categoryId: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!form.title.trim() || !form.categoryId || !form.address.trim()) {
      setError('Completá todos los campos obligatorios')
      return false
    }
    setLoading(true)
    try {
      await createEmergencyPost({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
      })
      setSuccess(true)
      return true
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al enviar la emergencia')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    form, setForm,
    loading, error, success,
    handleSubmit,
  }
}
