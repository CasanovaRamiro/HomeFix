interface StarRatingProps {
  rating: number
  count?: number
}

export default function StarRating({ rating, count }: StarRatingProps) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <span className="star-rating">
      {Array.from({ length: full }, (_, i) => (
        <span key={`full-${i}`} className="star">★</span>
      ))}
      {hasHalf && <span className="star">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`empty-${i}`} className="star empty">★</span>
      ))}
      {count !== undefined && <span className="num">({count})</span>}
    </span>
  )
}
