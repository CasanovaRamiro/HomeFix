import type { TrabajoView } from '../../types/post'
import StarRating from '../ui/StarRating'

interface Props {
  selected: TrabajoView & { lat?: number | null; lng?: number | null }
  yaPostulado: boolean
  onClose: () => void
  onPostular: () => void
}

export default function TrabajoDetail({ selected, yaPostulado, onClose, onPostular }: Props) {
  return (
    <div className="trabajos-detail-card">
      <div className="trabajos-detail-head">
        <h2>Detalle del trabajo</h2>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar detalle">
          x
        </button>
      </div>
      {selected.photo && (
        <img src={selected.photo} alt="" className="trabajo-photo" />
      )}
      <div className="trabajos-detail-body">
        <div className="trabajo-detail-client">
          <div className="trabajo-detail-client-avatar">
            {selected.clientName?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <div>
            <div className="trabajo-detail-client-name">{selected.clientName} {selected.clientSurname}</div>
            <span className="trabajo-detail-client-label">Cliente</span>
            <StarRating rating={selected.clientRating} />
          </div>
        </div>
        <h3>{selected.titulo}</h3>
        <p className="trabajo-meta">Publicado: {selected.fechaPublicacion}</p>
        <p className="trabajo-detail-desc">{selected.descripcion}</p>
        <dl className="trabajo-facts">
          <div>
            <dt>Rubro</dt>
            <dd>{selected.categoria}</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>{selected.address}</dd>
          </div>
          <div>
            <dt>Fecha servicio</dt>
            <dd>{selected.fechaServicio}</dd>
          </div>
        </dl>
        {yaPostulado ? (
          <p className="trabajos-applied-msg">Ya te postulaste a este trabajo.</p>
        ) : (
          <button type="button" className="btn-accent" onClick={onPostular}>
            Postularme
          </button>
        )}
      </div>
    </div>
  )
}
