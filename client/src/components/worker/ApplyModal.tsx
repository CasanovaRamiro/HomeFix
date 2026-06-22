import { useState, useMemo } from 'react'

export interface ApplicationFormData {
  message: string
  availableDays: string[]
  availableTimeFrom: string
  availableTimeTo: string
  chargesVisit: boolean
  visitCost: number | undefined
}

interface Props {
  selected: { id: string; titulo: string; startDate?: string; endDate?: string }
  readOnlyDates?: boolean
  onEnviar: (data: ApplicationFormData) => void
  onClose: () => void
  enviando: boolean
}

function getDatesInRange(startDate: string, endDate: string): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDateLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()]
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day} ${d}/${m}`
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  return `${s.toLocaleDateString('es-AR', opts)} — ${e.toLocaleDateString('es-AR', opts)}`
}

export default function ApplyModal({ selected, readOnlyDates, onEnviar, onClose, enviando }: Props) {
  const [message, setMessage] = useState('')
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableTimeFrom, setAvailableTimeFrom] = useState('')
  const [availableTimeTo, setAvailableTimeTo] = useState('')
  const [chargesVisit, setChargesVisit] = useState(false)
  const [visitCost, setVisitCost] = useState('')
  const [formError, setFormError] = useState('')

  const datesInRange = useMemo(
    () => getDatesInRange(selected.startDate ?? '', selected.endDate ?? ''),
    [selected.startDate, selected.endDate]
  )

  const toggleDay = (ymd: string) => {
    setAvailableDays((prev) =>
      prev.includes(ymd) ? prev.filter((d) => d !== ymd) : [...prev, ymd]
    )
  }

  const handleSubmit = () => {
    if (!readOnlyDates) {
      if (availableDays.length === 0) {
        setFormError('Seleccioná al menos un día disponible.')
        return
      }
      if (!availableTimeFrom || !availableTimeTo) {
        setFormError('Ingresá el horario de disponibilidad.')
        return
      }
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

        {readOnlyDates && selected.startDate && selected.endDate ? (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            marginBottom: 16,
          }}>
            <label className="modal-label" style={{ margin: 0, color: '#166534' }}>
              Fecha del servicio (ya pactada)
            </label>
            <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#166534' }}>
              {formatDateRange(selected.startDate, selected.endDate)}
            </p>
          </div>
        ) : (
          <>
            <label className="modal-label">¿Qué días podés ir?</label>
            {datesInRange.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>No hay rango de fechas disponible.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {datesInRange.map((date) => {
                  const ymd = toYMD(date)
                  const isSelected = availableDays.includes(ymd)
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => toggleDay(ymd)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: '1.5px solid',
                        borderColor: isSelected ? '#10B981' : '#CBD5E1',
                        background: isSelected ? '#D1FAE5' : '#fff',
                        color: isSelected ? '#065F46' : '#475569',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {formatDateLabel(date)}
                    </button>
                  )
                })}
              </div>
            )}

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
          </>
        )}

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