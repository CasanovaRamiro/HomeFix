import { useState } from 'react'
import type { TrabajoView } from '../../types/post'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export interface ApplicationFormData {
  message: string
  availableDays: string[]
  availableTimeFrom: string
  availableTimeTo: string
  chargesVisit: boolean
  visitCost: number | undefined
}

interface Props {
  selected: TrabajoView
  onEnviar: (data: ApplicationFormData) => void
  onClose: () => void
  enviando: boolean
}

export default function ApplyModal({ selected, onEnviar, onClose, enviando }: Props) {
  const [message, setMessage] = useState('')
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableTimeFrom, setAvailableTimeFrom] = useState('')
  const [availableTimeTo, setAvailableTimeTo] = useState('')
  const [chargesVisit, setChargesVisit] = useState(false)
  const [visitCost, setVisitCost] = useState('')
  const [formError, setFormError] = useState('')

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = () => {
    if (availableDays.length === 0) {
      setFormError('Seleccioná al menos un día disponible.')
      return
    }
    if (!availableTimeFrom || !availableTimeTo) {
      setFormError('Ingresá el horario de disponibilidad.')
      return
    }
    if (chargesVisit && (!visitCost || Number(visitCost) <= 0)) {
      setFormError('Ingresá el monto de la visita.')
      return
    }
    setFormError('')
    onEnviar({
      message,
      availableDays,
      availableTimeFrom,
      availableTimeTo,
      chargesVisit,
      visitCost: chargesVisit ? Number(visitCost) : undefined,
    })
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={() => !enviando && onClose()}>
      <div
        className="card modal-card"
        role="dialog"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', minWidth: 440 }}
      >
        <h2 id="modal-title">Postularte a este trabajo</h2>
        <p className="trabajos-muted">{selected.titulo}</p>

        <label className="modal-label">Días disponibles</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: availableDays.includes(day) ? '#10B981' : '#CBD5E1',
                background: availableDays.includes(day) ? '#D1FAE5' : '#fff',
                color: availableDays.includes(day) ? '#065F46' : '#475569',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {day}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <label className="modal-label" style={{ flex: 1 }}>
            Desde
            <input
              type="time"
              value={availableTimeFrom}
              onChange={(e) => setAvailableTimeFrom(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, marginTop: 4 }}
            />
          </label>
          <label className="modal-label" style={{ flex: 1 }}>
            Hasta
            <input
              type="time"
              value={availableTimeTo}
              onChange={(e) => setAvailableTimeTo(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <input
            id="chargesVisit"
            type="checkbox"
            checked={chargesVisit}
            onChange={(e) => setChargesVisit(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#10B981' }}
          />
          <label htmlFor="chargesVisit" style={{ fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
            ¿Cobrás la visita?
          </label>
        </div>

        {chargesVisit && (
          <label className="modal-label">
            Monto de la visita ($)
            <input
              type="number"
              min={1}
              value={visitCost}
              onChange={(e) => setVisitCost(e.target.value)}
              placeholder="Ej: 2500"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, marginTop: 4 }}
            />
          </label>
        )}

        <label className="modal-label">
          Mensaje para el cliente (opcional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Presentate brevemente o conta tu experiencia..."
          />
        </label>

        {formError !== '' && (
          <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 10px' }}>{formError}</p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="btn-accent" onClick={handleSubmit} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar postulacion'}
          </button>
        </div>
      </div>
    </div>
  )
}
