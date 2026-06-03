import { useState } from 'react'
import { Star } from 'lucide-react'

const LABELS: Record<number, string> = {
  0: 'Toca las estrellas para calificar',
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: '¡Excelente!',
}

interface Props {
  value: number
  onChange: (rating: number) => void
}

export default function ReviewStarRating({ value, onChange }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 sm:gap-2.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const on = star <= active
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star} estrellas`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              className="rounded-full bg-transparent p-1 transition-transform duration-150 hover:scale-110 hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Star
                className={`h-9 w-9 transition-colors duration-150 sm:h-11 sm:w-11 ${
                  on ? 'fill-warning text-warning' : 'fill-transparent text-slate-300'
                }`}
                strokeWidth={1.6}
              />
            </button>
          )
        })}
      </div>

      <p
        className={`mt-3 text-sm transition-colors ${
          active ? 'font-semibold text-primary-dark' : 'font-medium text-muted'
        }`}
      >
        {LABELS[active]}
      </p>
    </div>
  )
}
