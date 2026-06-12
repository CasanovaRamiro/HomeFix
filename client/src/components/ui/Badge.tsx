import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'primary' | 'accent' | 'outline' | 'danger' | 'warning' | 'info'
  children: ReactNode
}

export default function Badge({ variant = 'outline', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
