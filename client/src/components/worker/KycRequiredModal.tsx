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
        style={{ textAlign: 'center', padding: '2rem 2rem 1.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <ShieldAlert size={32} color="#D97706" />
        </div>

        <h2>Verificación requerida</h2>

        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
          Para postularse a trabajos, necesitás completar la verificación de identidad con tu DNI. Es un proceso rápido y seguro.
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cerrar
          </button>
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
        </div>
      </div>
    </div>
  )
}
