import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'primary' | 'accent' | 'outline' | 'danger' | 'warning'
  children: ReactNode
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-white',
  accent: 'bg-secondary text-white',
  outline: 'bg-transparent border border-border text-text-muted',
  danger: 'bg-danger text-white',
  warning: 'bg-[#f59e0b] text-white',
}

export default function Badge({ variant = 'outline', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-[10px] py-[4px] rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
