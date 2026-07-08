import type { AvailableBiddingDTO } from '../../services/posts'
import StarRating from '../ui/StarRating'
import { MapPin, Image as ImageIcon } from 'lucide-react'
import { formatAddress } from '../../utils/address'

interface Props {
  bidding: AvailableBiddingDTO
  onClick: () => void
  onOfertar: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export default function BiddingCard({ bidding, onClick, onOfertar, style }: Props) {
  const matLabel =
    bidding.materialResponsibility === 'client' ? 'Cliente' :
    bidding.materialResponsibility === 'worker' ? 'Worker' :
    'A convenir'

  const firstImage = bidding.images?.[0]?.url

  return (
    <article
      className="bidding-card"
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
      <div className="bidding-card-body">
        <div className="bidding-card-head">
          {bidding.categories.map((c) => (
            <span key={c.id} className="badge badge-bidding">{c.name}</span>
          ))}
        </div>
        <h3>{bidding.title}</h3>
        <p className="bidding-desc">{bidding.description}</p>

        <div className="bidding-card-meta">
          {bidding.budgetMax != null && (
            <span className="bidding-meta-item bidding-budget">
              Hasta ${bidding.budgetMax.toLocaleString()}
            </span>
          )}
          <span className="bidding-meta-item bidding-material">
            Material a cargo de: {matLabel}
          </span>
          <span className="bidding-meta-item bidding-address">
            <MapPin size={13} /> {formatAddress(bidding.address)}
          </span>
        </div>

        {firstImage && (
          <div className="bidding-card-images">
            <img src={firstImage} alt="" className="bidding-thumb" />
            {bidding.images.length > 1 && (
              <span className="bidding-more-images">+{bidding.images.length - 1}</span>
            )}
          </div>
        )}
        {!firstImage && (
          <div className="bidding-card-images bidding-no-image">
            <ImageIcon size={24} color="#CBD5E1" />
          </div>
        )}
      </div>

      <div className="bidding-card-footer">
        <div className="bidding-client">
          <div className="bidding-client-avatar">
            {bidding.client.name?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <span className="bidding-client-name">
            {bidding.client.name} {bidding.client.surname}
          </span>
          <StarRating rating={bidding.client.rating} />
        </div>
        <button
          className={`bidding-ofertar-btn${bidding.hasApplied ? ' already-applied' : ''}`}
          onClick={(e) => { e.stopPropagation(); onOfertar(e) }}
        >
          {bidding.hasApplied ? 'Ya ofertaste' : 'Ofertar'}
        </button>
      </div>
    </article>
  )
}
