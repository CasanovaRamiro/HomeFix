import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function KycRequiredModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="card modal-card"
        role="dialog"
        style={{ textAlign: 'center', padding: '2rem', maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ShieldAlert size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
          Verificación requerida
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
          Para postularse a trabajos, necesitás completar la verificación de identidad con tu DNI.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-accent"
            onClick={() => {
              onClose()
              navigate('/kyc')
            }}
          >
            Realizar verificación
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
