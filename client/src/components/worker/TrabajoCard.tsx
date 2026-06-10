import type { TrabajoView } from '../../types/post'
import StarRating from '../ui/StarRating'

interface Props {
  trabajo: TrabajoView & { lat?: number | null; lng?: number | null }
  isSelected: boolean
  isApplied: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export default function TrabajoCard({ trabajo, isSelected, isApplied, onClick, onKeyDown }: Props) {
  return (
    <article
      className={`trabajo-card ${isSelected ? 'is-selected' : ''} ${isApplied ? 'is-applied' : ''}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      {trabajo.photo && (
        <img src={trabajo.photo} alt="" className="trabajo-card-img" />
      )}
      <div className="trabajo-card-body">
       <div className="trabajo-card-head">
         <span className="badge badge-open">{trabajo.categoria}</span>
         {trabajo.isEmergency && (
           <span className="badge badge-emergency">Emergencia</span>
         )}
         {isApplied && (
           <span className="badge badge-applied">Postulado</span>
         )}
       </div>
        <h3>{trabajo.titulo}</h3>
        <p className="trabajo-desc">{trabajo.descripcion}</p>
      </div>
      <div className="trabajo-card-footer">
        <div className="trabajo-client">
          <div className="trabajo-client-avatar">
            {trabajo.clientName?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <span className="trabajo-client-name">{trabajo.clientName} {trabajo.clientSurname}</span>
          <StarRating rating={trabajo.clientRating} />
        </div>
        <span className="trabajo-date">{trabajo.fechaServicio}</span>
      </div>
    </article>
  )
}
