import { useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ConfirmModalProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  danger?: boolean
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-slate-600 mb-6">{message}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-colors flex items-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading && <LoadingSpinner />}
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
