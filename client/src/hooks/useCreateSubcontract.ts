import { useState, useCallback } from 'react'
import { createSubcontract } from '../services/posts'
import type { SubcontractPosition } from '../types/post'

export interface SubcontractPrefill {
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
}

export interface SubcontractForm {
  parentPostId?: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  positions: SubcontractPosition[]
}

const emptyPosition = (): SubcontractPosition => ({ categoryId: '', quantity: 1, roleDescription: '' })

export function useCreateSubcontract(parentPostId?: string) {
  const [form, setForm] = useState<SubcontractForm>({
    parentPostId,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    address: '',
    positions: [emptyPosition()],
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const setPrefill = useCallback((data: SubcontractPrefill) => {
    setForm(prev => ({
      ...prev,
      title: `Subcontratación: ${data.title}`,
      description: data.description,
      startDate: data.startDate.substring(0, 10),
      endDate: data.endDate.substring(0, 10),
      address: data.address,
    }))
  }, [])

  const addPosition = () => {
    setForm(p => ({ ...p, positions: [...p.positions, emptyPosition()] }))
  }

  const removePosition = (index: number) => {
    setForm(p => ({
      ...p,
      positions: p.positions.length > 1 ? p.positions.filter((_, i) => i !== index) : p.positions,
    }))
  }

  const updatePosition = (index: number, field: keyof SubcontractPosition, value: string | number) => {
    setForm(p => ({
      ...p,
      positions: p.positions.map((pos, i) => (i === index ? { ...pos, [field]: value } : pos)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (form.positions.length === 0 || form.positions.every(p => !p.categoryId)) {
      setFormError('Agregá al menos una posición con categoría')
      return
    }
    for (let i = 0; i < form.positions.length; i++) {
      const pos = form.positions[i]
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

    setFormSubmitting(true)
    try {
      const payload: Parameters<typeof createSubcontract>[0] = {
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        address: form.address.trim(),
        positions: form.positions,
        parentPostId: form.parentPostId || undefined,
      }
      await createSubcontract(payload)
      setFormSuccess(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setFormError(axiosErr.response?.data?.error ?? 'Error al crear la subcontratación')
    } finally {
      setFormSubmitting(false)
    }
  }

  return {
    form, setForm,
    formError, setFormError,
    formSubmitting,
    formSuccess, setFormSuccess,
    setPrefill,
    addPosition, removePosition, updatePosition,
    handleSubmit,
  }
}
