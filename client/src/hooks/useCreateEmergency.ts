import { useState, useEffect } from 'react'
import { createEmergencyPost, getClientProfile } from '../services/api'

export function useCreateEmergency(userId: string) {
  const [form, setForm] = useState({
    title: '',
    description: 'Necesito ayuda urgente',
    categoryId: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAddressLoading(true)
    getClientProfile(userId)
      .then(profile => {
        if (cancelled) return
        if (profile.address) {
          const addrStr = `${profile.address.street} ${profile.address.number}, ${profile.address.city}, ${profile.address.state}`
          setForm(prev => ({ ...prev, address: addrStr }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAddressLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

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
    loading, error, success, addressLoading,
    handleSubmit,
  }
}
