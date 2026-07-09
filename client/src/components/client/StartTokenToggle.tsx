import { useState } from 'react'
import { updateUserRequiresStartToken } from '../../services/users'

interface Props {
  clientId: string
  initialEnabled: boolean
}

export default function StartTokenToggle({ clientId, initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    if (saving) return
    const newValue = !enabled
    setSaving(true)
    try {
      await updateUserRequiresStartToken(clientId, newValue)
      setEnabled(newValue)
    } catch (error) {
      console.error('Error updating start-token setting:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>Token de inicio de trabajo</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Pedile al trabajador un código de 4 dígitos en persona para confirmar el inicio</span>
          </div>
          <button
            onClick={handleToggle}
            style={{
              width: 50, height: 26, borderRadius: 13, position: 'relative',
              background: enabled ? '#10B981' : '#D1D5DB',
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20, background: '#fff', borderRadius: '50%',
              position: 'absolute', top: 3, left: enabled ? 27 : 3,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      </div>
    </div>
  )
}
