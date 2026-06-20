import { useState } from 'react'
  import { useTheme } from './useTheme'
  import api, { uploadImages } from '../services/api'

  export interface PostFormData {
    title: string
    categoryId: string
    description: string
    startDate: string
    endDate: string
    address: string
    latitude: number | null
    longitude: number | null
    isEmergency?: boolean
    allowsSubcontracting?: boolean
  }

  export function useCreatePost() {
    const { accent, border } = useTheme()
    const [form, setForm] = useState<PostFormData>({
      title: '', categoryId: '', description: '',
      startDate: '', endDate: '', address: '', latitude: null, longitude: null, isEmergency: false, allowsSubcontracting: true,
    })
    const [formError, setFormError] = useState('')
    const [formSubmitting, setFormSubmitting] = useState(false)
    const [formSuccess, setFormSuccess] = useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = accent
      e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = border
      e.target.style.boxShadow = 'none'
    }

    const handleSubmit = (files: File[]) => {
      return async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!form.title.trim() || !form.categoryId || !form.description.trim() || !form.address.trim()) {
          setFormError('Todos los campos son obligatorios')
          return
        }
        if (!form.latitude || !form.longitude) {
          setFormError('Seleccioná una dirección de la lista de sugerencias para confirmar la ubicación')
          return
        }
        if (!form.isEmergency && (!form.startDate || !form.endDate)) {
          setFormError('Todos los campos son obligatorios')
          return
        }
        if (!form.isEmergency && new Date(form.endDate) <= new Date(form.startDate)) {
          setFormError('La fecha de fin debe ser posterior a la fecha de inicio')
          return
        }

        setFormSubmitting(true)
        try {
          let images: { url: string }[] = []
          if (files.length > 0) {
            const urls = await uploadImages(files)
            images = urls.map((url) => ({ url }))
          }
          await api.post('/posts/create', {
            title: form.title,
            description: form.description,
            startDate: form.isEmergency ? undefined : form.startDate,
            endDate: form.isEmergency ? undefined : form.endDate,
            address: form.address,
            latitude: form.latitude,
            longitude: form.longitude,
            categoryId: form.categoryId,
            isEmergency: form.isEmergency,
            allowsSubcontracting: form.allowsSubcontracting,
            images,
          })
          setFormSuccess(true)
        } catch (err) {
          const axiosErr = err as { response?: { data?: { error?: string } } }
          setFormError(axiosErr.response?.data?.error ?? 'Error al publicar la solicitud')
        } finally {
          setFormSubmitting(false)
        }
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