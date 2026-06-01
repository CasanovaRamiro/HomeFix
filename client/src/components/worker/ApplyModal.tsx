import type { TrabajoView } from '../../types/post'

interface Props {
  selected: TrabajoView
  mensaje: string
  onMensajeChange: (val: string) => void
  onEnviar: () => void
  onClose: () => void
  enviando: boolean
}

export default function ApplyModal({ selected, mensaje, onMensajeChange, onEnviar, onClose, enviando }: Props) {
  return (
    <div className="modal-overlay" role="presentation" onClick={() => !enviando && onClose()}>
      <div
        className="card modal-card"
        role="dialog"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">Postularte a este trabajo</h2>
        <p className="trabajos-muted">{selected.titulo}</p>
        <label className="modal-label">
          Mensaje para el cliente (opcional)
          <textarea
            value={mensaje}
            onChange={(e) => onMensajeChange(e.target.value)}
            rows={4}
            placeholder="Presentate brevemente o conta tu experiencia..."
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="btn-accent" onClick={onEnviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar postulacion'}
          </button>
        </div>
      </div>
    </div>
  )
}
