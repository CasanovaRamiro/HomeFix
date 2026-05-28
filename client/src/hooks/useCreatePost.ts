import { useState } from 'react'
import api from '../services/api'

export interface PostFormData {
  title: string
  categoryId: string
  description: string
  startDate: string
  endDate: string
  address: string
}

export function useCreatePost() {
  const [form, setForm] = useState<PostFormData>({
    title: '', categoryId: '', description: '',
    startDate: '', endDate: '', address: '',
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--color-secondary)'
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--color-border)'
    e.target.style.boxShadow = 'none'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim() || !form.categoryId || !form.description.trim() || !form.startDate || !form.endDate || !form.address.trim()) {
      setFormError('Todos los campos son obligatorios')
      return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    setFormSubmitting(true)
    try {
      await api.post('/posts/create', {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        address: form.address,
        categoryId: Number(form.categoryId),
      })
      setFormSuccess(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setFormError(axiosErr.response?.data?.error ?? 'Error al publicar la solicitud')
    } finally {
      setFormSubmitting(false)
    }
  }

  return {
    form, setForm,
    formError, setFormError,
    formSubmitting, setFormSubmitting,
    formSuccess, setFormSuccess,
    handleFocus, handleBlur,
    handleSubmit,
  }
}
