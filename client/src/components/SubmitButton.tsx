import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  loading?: boolean
  disabled?: boolean
  loadingText?: string
  children: ReactNode
}

export default function SubmitButton({ loading, disabled, loadingText, children }: Props) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  return (
    <button
      type="submit"
      disabled={isDisabled}
      style={{
        width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px',
        border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF',
        transition: 'all 0.3s', opacity: isDisabled ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (!isDisabled) {
          e.currentTarget.style.background = theme.accentHover
          e.currentTarget.style.transform = 'scale(1.02)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = theme.accent
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          {loadingText || children}
        </span>
      ) : children}
    </button>
  )
}
