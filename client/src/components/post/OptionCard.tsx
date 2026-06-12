import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  linkText: string
  onClick: () => void
}

export default function OptionCard({ icon: Icon, title, description, linkText, onClick }: Props) {
  const theme = useTheme()

  return (
    <div
      style={{
        background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px',
        padding: '40px 32px', transition: 'all 0.3s', cursor: 'pointer',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'
        e.currentTarget.style.borderColor = theme.accent
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px', background: `${theme.accent}0d`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
      }}>
        <Icon style={{ width: '28px', height: '28px', color: theme.accent }} />
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.primaryDark, marginBottom: '12px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '15px', color: theme.muted, lineHeight: '1.6', marginBottom: '28px' }}>
        {description}
      </p>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600,
        color: theme.accent, border: 'none', background: 'none', padding: '0', cursor: 'pointer',
      }}>
        {linkText}
        <ArrowRight style={{ width: '18px', height: '18px' }} />
      </button>
    </div>
  )
}
