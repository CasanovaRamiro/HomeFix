interface StarRatingProps {
  rating: number
  count?: number
}

export default function StarRating({ rating, count }: StarRatingProps) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <span className="inline-flex items-center gap-[2px]">
      {Array.from({ length: full }, (_, i) => (
        <span key={`full-${i}`} className="text-[#f59e0b] text-[14px]">★</span>
      ))}
      {hasHalf && <span className="text-[#f59e0b] text-[14px]">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`empty-${i}`} className="text-[#d1d5db] text-[14px]">★</span>
      ))}
      {count !== undefined && <span className="text-[13px] text-text-muted ml-[4px]">({count})</span>}
    </span>
  )
}
