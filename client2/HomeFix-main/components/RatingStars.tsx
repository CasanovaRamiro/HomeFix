'use client'

interface RatingStarsProps {
  rating: number
  reviews?: number
  size?: 'sm' | 'md' | 'lg'
}

export function RatingStars({ rating, reviews, size = 'md' }: RatingStarsProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`${sizeClasses[size]} text-yellow-400`}>
            {i < Math.round(rating) ? '★' : '☆'}
          </span>
        ))}
      </div>
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-sm text-muted-foreground">({reviews})</span>
      )}
    </div>
  )
}
