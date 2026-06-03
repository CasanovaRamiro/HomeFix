interface ConfirmModalProps {
  title: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div className="card modal-card" role="dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1.5rem', lineHeight: 1.5 }}>{title}</p>
        <div className="modal-actions" style={{ flexDirection: 'column' }}>
         
          <button
            onClick={onCancel}
            style={{
              width: '100%', background: '#f1f5f9', color: '#475569', border: 'none',
              padding: '10px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
           <button
            onClick={onConfirm}
            style={{
              width: '100%', background: 'var(--danger)', color: '#fff', border: 'none',
              padding: '10px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}