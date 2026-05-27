import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  onGoHome: () => void
  children?: ReactNode
}

export default function SuccessScreen({ onGoHome, children }: Props) {
  const theme = useTheme()

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle style={{ width: '40px', height: '40px', color: theme.accent }} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: theme.primaryDark, marginBottom: '8px' }}>
        {children || '¡Solicitud publicada con éxito!'}
      </h2>
      <p style={{ color: theme.muted, marginBottom: '24px' }}>
        Pronto recibirás respuestas de profesionales cercanos.
      </p>
      <button
        onClick={onGoHome}
        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF', transition: 'all 0.3s' }}
        onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
      >
        Volver al inicio
      </button>
    </div>
  )
}
