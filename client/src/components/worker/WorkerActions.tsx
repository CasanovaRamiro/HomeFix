import { useState } from 'react'
import { updateUserEmergencyNotifications } from '../../services/users'

interface Props {
  workerId: string
  initialEnabled: boolean
}

export default function WorkerActions({ workerId, initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)

  const handleToggle = async () => {
    const newValue = !enabled
    try {
      await updateUserEmergencyNotifications(workerId, newValue)
      setEnabled(newValue)
    } catch (error) {
      console.error('Error updating emergency notifications:', error)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>Notificaciones de Emergencia</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Recibir avisos de trabajos urgentes</span>
          </div>
          <button
            onClick={handleToggle}
            style={{
              width: 50, height: 26, borderRadius: 13, position: 'relative',
              background: enabled ? '#10B981' : '#D1D5DB',
              border: 'none', cursor: 'pointer', transition: 'background 0.2s'
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
