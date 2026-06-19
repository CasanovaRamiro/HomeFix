import type { AvailableSubcontractDTO } from '../../types/post'
import StarRating from '../ui/StarRating'

interface Props {
  subcontract: AvailableSubcontractDTO
  onClick: () => void
  style?: React.CSSProperties
}

export default function SubcontractCard({ subcontract, onClick, style }: Props) {
  const totalVacantes = subcontract.categories.reduce(
    (acc, c) => acc + (c.quantity - c.filledCount), 0,
  )

  const serviceDate = subcontract.startDate
    ? new Date(subcontract.startDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  const shortDate = subcontract.startDate
    ? new Date(subcontract.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    : ''

  return (
    <article
      className="subcontract-card"
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      style={style}
    >
      <div className="trabajo-card-body">
        <div className="trabajo-card-head">
          <span className="badge badge-subcontract">Subcontrato</span>
        </div>
        <h3>{subcontract.title}</h3>
        <p className="trabajo-desc">{subcontract.description}</p>

        <div className="subcontract-positions">
          {subcontract.categories.map((c, i) => {
            const needed = c.quantity - c.filledCount
            return (
              <span key={i} className="subcontract-position-tag">
                <span className="subcontract-position-number">{needed}</span>
                {c.name}
                {c.roleDescription ? ` — ${c.roleDescription}` : ''}
              </span>
            )
          })}
        </div>

        {totalVacantes > 0 && (
          <div className="subcontract-vacantes">
            {totalVacantes} vacante{totalVacantes !== 1 ? 's' : ''} disponible{totalVacantes !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="trabajo-card-footer">
        <div className="trabajo-client">
          <div className="trabajo-client-avatar">
            {subcontract.user?.name?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <span className="trabajo-client-name">
            {subcontract.user?.name ?? ''} {subcontract.user?.surname ?? ''}
          </span>
          <StarRating rating={subcontract.clientRating} />
        </div>
        {serviceDate && <span className="trabajo-date trabajo-date-full">{serviceDate}</span>}
        {shortDate && <span className="trabajo-date trabajo-date-short">{shortDate}</span>}
      </div>
    </article>
  )
}
