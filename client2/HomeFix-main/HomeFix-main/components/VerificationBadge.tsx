'use client'

interface VerificationBadgeProps {
  verified: boolean
  compact?: boolean
}

export function VerificationBadge({ verified, compact = false }: VerificationBadgeProps) {
  if (!verified) return null

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <span className="text-lg">✓</span>
        <span>Verificado</span>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
      <span className="text-lg text-primary">✓</span>
      <span className="text-sm font-semibold text-primary">Trabajador Verificado</span>
    </div>
  )
}
