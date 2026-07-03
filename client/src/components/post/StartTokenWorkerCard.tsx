import { useEffect, useState } from 'react'
import { KeyRound, CheckCircle, RefreshCw } from 'lucide-react'
import { generateStartToken } from '../../services/applications'

interface Props {
  applicationId: string
  initialToken: string | null
  initialExpiresAt: string | null
  validatedAt: string | null
}

const COOLDOWN_MS = 5000

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function StartTokenWorkerCard({ applicationId, initialToken, initialExpiresAt, validatedAt }: Props) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt)
  const [now, setNow] = useState(Date.now())
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (validatedAt) {
    return (
      <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <CheckCircle size={22} color="#059669" />
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#065F46', margin: 0 }}>Trabajo iniciado</p>
          <p style={{ fontSize: 13, color: '#047857', margin: '2px 0 0' }}>
            El cliente confirmó el inicio el {new Date(validatedAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  const remaining = expiresAt ? new Date(expiresAt).getTime() - now : 0
  const isActive = !!token && remaining > 0
  const isExpired = !!token && remaining <= 0
  const cooldownLeft = Math.max(0, cooldownUntil - now)
  const onCooldown = cooldownLeft > 0

  const handleGenerate = async () => {
    if (loading || onCooldown) return
    setLoading(true)
    setError('')
    try {
      const res = await generateStartToken(applicationId)
      setToken(res.token)
      setExpiresAt(res.expiresAt)
      setCooldownUntil(Date.now() + COOLDOWN_MS)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'No se pudo generar el código.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <KeyRound size={18} color="#0F172A" />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Código de inicio</h3>
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.6 }}>
        Generá un código y decíselo al cliente en persona. Cuando lo valide, el trabajo queda confirmado como iniciado.
      </p>

      {isActive && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '0.3em', color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {token}
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 0' }}>
            Válido por {formatRemaining(remaining)}
          </p>
        </div>
      )}

      {isExpired && (
        <p style={{ fontSize: 13, color: '#DC2626', margin: '0 0 16px', textAlign: 'center', fontWeight: 600 }}>
          El código expiró. Generá uno nuevo.
        </p>
      )}

      {error && (
        <p style={{ fontSize: 13, color: '#DC2626', margin: '0 0 12px' }}>{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || onCooldown}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#0F172A', border: 'none', borderRadius: 10, padding: '11px 0',
          fontSize: 14, fontWeight: 700, color: '#fff',
          cursor: loading || onCooldown ? 'not-allowed' : 'pointer', opacity: loading || onCooldown ? 0.6 : 1,
        }}
      >
        {isActive || isExpired ? <RefreshCw size={16} /> : <KeyRound size={16} />}
        {onCooldown
          ? `Esperá ${Math.ceil(cooldownLeft / 1000)}s`
          : loading
            ? 'Generando...'
            : isActive || isExpired
              ? 'Generar nuevo código'
              : 'Generar código'}
      </button>
    </div>
  )
}
