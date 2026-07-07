import { useState, useCallback, useEffect } from 'react'
import { updateSubcontract, fetchSubcontractGroupDetail } from '../services/posts'
import type { SubcontractPosition, SubcontractDetailDTO } from '../types/post'

export interface EditSubcontractForm {
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  latitude: number | null
  longitude: number | null
}

const emptyPosition = (): SubcontractPosition => ({ categoryId: '', quantity: 1, roleDescription: '' })

export function useEditSubcontract(subcontractId: string) {
  const [subcontract, setSubcontract] = useState<SubcontractDetailDTO | null>(null)
  const [form, setForm] = useState<EditSubcontractForm>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    address: '',
    latitude: null,
    longitude: null,
  })
  const [positions, setPositions] = useState<SubcontractPosition[]>([emptyPosition()])
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  useEffect(() => {
    if (!subcontractId) return
    setLoading(true)
    fetchSubcontractGroupDetail(subcontractId)
      .then(res => {
        const data = res.data
        setSubcontract(data)
        setForm({
          title: data.title,
          description: data.description,
          startDate: data.startDate.substring(0, 10),
          endDate: data.endDate.substring(0, 10),
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        if (data.categories && data.categories.length > 0) {
          setPositions(data.categories.map(cat => ({
            categoryId: cat.categoryId,
            quantity: cat.quantity,
            roleDescription: cat.roleDescription || '',
          })))
        }
      })
      .catch(() => setSubcontract(null))
      .finally(() => setLoading(false))
  }, [subcontractId])

  const addPosition = () => {
    setPositions(p => [...p, emptyPosition()])
  }

  const removePosition = (index: number) => {
    setPositions(p => p.length > 1 ? p.filter((_, i) => i !== index) : p)
  }

  const updatePosition = (index: number, field: keyof SubcontractPosition, value: string | number) => {
    setPositions(p => p.map((pos, i) => (i === index ? { ...pos, [field]: value } : pos)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (positions.length === 0 || positions.every(p => !p.categoryId)) {
      setFormError('Agregá al menos una posición con categoría')
      return
    }
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      if (!pos.categoryId) {
        setFormError(`Posición ${i + 1}: seleccioná una categoría`)
        return
      }
      if (!pos.quantity || pos.quantity < 1) {
        setFormError(`Posición ${i + 1}: la cantidad debe ser al menos 1`)
        return
      }
      if (!pos.roleDescription.trim()) {
        setFormError(`Posición ${i + 1}: describí el rol`)
        return
      }
    }

    if (!form.title.trim()) {
      setFormError('Ingresá un título')
      return
    }
    if (!form.description.trim()) {
      setFormError('Ingresá una descripción')
      return
    }
    if (!form.startDate || !form.endDate) {
      setFormError('Completá las fechas del servicio')
      return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }
    if (!form.address.trim()) {
      setFormError('Ingresá la dirección del servicio')
      return
    }
    if (!form.latitude || !form.longitude) {
      setFormError('Seleccioná una dirección de la lista de sugerencias')
      return
    }

    setFormSubmitting(true)
    try {
      await updateSubcontract(subcontractId, {
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        address: form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        positions: positions.map(p => ({
          categoryId: p.categoryId,
          quantity: p.quantity,
          roleDescription: p.roleDescription,
        })),
      })
      setFormSuccess(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setFormError(axiosErr.response?.data?.error ?? 'Error al actualizar la subcontratación')
    } finally {
      setFormSubmitting(false)
    }
  }

  return {
    subcontract,
    form, setForm,
    positions,
    loading,
    formError, setFormError,
    formSubmitting,
    formSuccess, setFormSuccess,
    addPosition, removePosition, updatePosition,
    handleSubmit,
  }
}
