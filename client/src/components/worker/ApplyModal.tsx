import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriangleAlert, User, MapPin } from 'lucide-react'

export interface ApplicationFormData {
  message: string
  availableDays: string[]
  availableTimeFrom: string
  availableTimeTo: string
  chargesVisit: boolean
  visitCost: number | undefined
}

interface Props {
  selected: {
    id: string
    titulo: string
    startDate?: string
    endDate?: string
    creatorName?: string
    creatorSurname?: string
    creatorId?: string
    isEmergency?: boolean
    emergencyExpiresAt?: string | null
    descripcion?: string
    clientName?: string
    clientSurname?: string
    address?: string
    clientRating?: number
  }
  subcontractMode?: boolean
  onEnviar: (data: ApplicationFormData) => void
  onClose: () => void
  enviando: boolean
}

function getDatesInRange(startDate: string, endDate: string): Date[] {
  const dates: Date[] = []
  const [sy, sm, sd] = startDate.split('T')[0].split('-').map(Number)
  const [ey, em, ed] = endDate.split('T')[0].split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
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

function calcTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Vencido'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m ${s}s restantes`
  return `${m}m ${s}s restantes`
}

export default function ApplyModal({ selected, subcontractMode, onEnviar, onClose, enviando }: Props) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableTimeFrom, setAvailableTimeFrom] = useState('')
  const [availableTimeTo, setAvailableTimeTo] = useState('')
  const [chargesVisit, setChargesVisit] = useState(false)
  const [visitCost, setVisitCost] = useState('')
  const [formError, setFormError] = useState('')

  const isEmergency = selected.isEmergency === true
  const [timeLeft, setTimeLeft] = useState(() =>
    isEmergency && selected.emergencyExpiresAt ? calcTimeLeft(selected.emergencyExpiresAt) : ''
  )
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!isEmergency || !selected.emergencyExpiresAt) return
    const expiresAt = selected.emergencyExpiresAt
    const tick = () => {
      const t = calcTimeLeft(expiresAt)
      setTimeLeft(t)
      if (t === 'Vencido') setExpired(true)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isEmergency, selected.emergencyExpiresAt])

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
    if (selected.isEmergency) {
      if (chargesVisit && (!visitCost || Number(visitCost) <= 0)) {
        setFormError('Ingresá el monto de la visita.')
        return
      }
      if (expired) {
        setFormError('Esta urgencia ya venció.')
        return
      }
      setFormError('')
      onEnviar({
        message: '',
        availableDays: [new Date().toISOString().split('T')[0]],
        availableTimeFrom: '00:00',
        availableTimeTo: '23:59',
        chargesVisit,
        visitCost: chargesVisit ? Number(visitCost) : undefined,
      })
      return
    }
    if (!subcontractMode) {
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
        <h2 id="modal-title">{subcontractMode ? 'Postularte a subcontrato' : selected.isEmergency ? 'Postularte a esta urgencia' : 'Postularte a este trabajo'}</h2>
        <p className="trabajos-muted">{selected.titulo}</p>

        {subcontractMode ? (
          <>
            {/* Creator info */}
            {selected.creatorName && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', marginBottom: 14,
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
              }}>
                <span style={{ fontSize: 14, color: '#0F172A' }}>
                  <strong>{selected.creatorName} {selected.creatorSurname}</strong>
                  <span style={{ color: '#64748B', marginLeft: 6, fontSize: 12 }}>contratista</span>
                </span>
                {selected.creatorId && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => navigate(`/profile/worker/${selected.creatorId}`)}
                    style={{ padding: '4px 12px', fontSize: 12 }}
                  >
                    Ver perfil
                  </button>
                )}
              </div>
            )}

            {/* Fixed dates */}
            {selected.startDate && selected.endDate && (
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
            )}

            {/* Message */}
            <label className="modal-label">
              Mensaje para el contratista (opcional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Contá tu experiencia y por qué te sumás a este equipo..."
              />
            </label>
          </>
        ) : selected.isEmergency ? (
          <>
            {selected.emergencyExpiresAt && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#EF4444', padding: '8px 14px', borderRadius: 8,
                color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 16,
              }}>
                <TriangleAlert size={16} />
                <span>Urgente</span>
                <span style={{ marginLeft: 'auto', color: '#FECACA', fontSize: 11, fontWeight: 500 }}>
                  {timeLeft}
                </span>
              </div>
            )}

            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
              {selected.titulo}
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.5 }}>
              {selected.descripcion}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}>
                <User size={12} color="#94A3B8" />
                {selected.clientName} {selected.clientSurname}
              </span>
              {selected.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                  <MapPin size={12} />
                  {selected.address}
                </span>
              )}
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
          </>
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
          </>
        )}

        {formError !== '' && (
          <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 10px' }}>{formError}</p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="btn-accent" onClick={handleSubmit} disabled={enviando} style={selected.isEmergency ? { background: '#EF4444' } : undefined}>
            {enviando ? 'Enviando...' : subcontractMode ? 'Enviar postulación a subcontrato' : selected.isEmergency ? 'Postularse' : 'Enviar postulacion'}
          </button>
        </div>
      </div>
    </div>
  )
}