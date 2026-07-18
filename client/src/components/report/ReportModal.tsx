import { useState, useEffect } from 'react'
import { Flag, X, CheckCircle } from 'lucide-react'
import { createReport, REPORT_REASONS, type ReportReason, type ReportTargetType } from '../../services/reports'

interface ReportModalProps {
  open: boolean
  targetType: ReportTargetType
  targetId: string
  targetName: string
  onClose: () => void
}

export default function ReportModal({
  open,
  targetType,
  targetId,
  targetName,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(handleClose, 2200)
    return () => clearTimeout(t)
  }, [submitted])

  const handleClose = () => {
    setReason('')
    setDescription('')
    setError(null)
    setSubmitted(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    setError(null)
    try {
      await createReport({
        targetType,
        reason,
        description: description.trim() || undefined,
        ...(targetType === 'application' ? { applicationId: targetId } : { reviewId: targetId }),
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el reporte'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const labels: Record<ReportTargetType, { title: string; subtitle: string }> = {
    application: { title: `Reportar a ${targetName}`, subtitle: 'Seleccioná el motivo del reporte.' },
    worker_review: { title: 'Reportar reseña', subtitle: `Reseña de ${targetName} — indicá el motivo.` },
    client_review: { title: 'Reportar reseña', subtitle: `Reseña de ${targetName} — indicá el motivo.` },
  }

  const { title, subtitle } = labels[targetType]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ background: submitted ? '#059669' : '#DC2626' }}
        >
          <div className="flex items-center gap-3">
            {submitted
              ? <CheckCircle size={20} color="#fff" />
              : <Flag size={20} color="#fff" />}
            <h2 className="text-base font-bold text-white m-0">
              {submitted ? 'Reporte enviado' : title}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#fff" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <CheckCircle size={28} color="#059669" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Reporte enviado</h3>
            <p className="text-sm mb-6" style={{ color: '#64748B' }}>
              Gracias por reportar. Vamos a revisar tu caso.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold"
              style={{ border: 'none', background: '#059669', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <p className="text-sm mb-5" style={{ color: '#64748B', margin: '0 0 20px' }}>{subtitle}</p>

            {/* Reason select */}
            <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-xl text-sm"
              style={{
                padding: '12px 14px', border: '1.5px solid #E2E8F0',
                color: reason ? '#0F172A' : '#94A3B8',
                background: '#fff', outline: 'none', fontSize: 13,
              }}
            >
              <option value="" disabled>Seleccioná un motivo...</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Description */}
            <label className="block text-sm font-semibold mt-5 mb-2" style={{ color: '#374151' }}>
              Comentario adicional <span className="font-normal" style={{ color: '#94A3B8' }}>(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí el problema..."
              maxLength={500}
              rows={4}
              className="w-full rounded-xl text-sm"
              style={{
                padding: '12px 14px', border: '1.5px solid #E2E8F0',
                fontSize: 13, color: '#0F172A', fontFamily: 'inherit',
                resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5,
              }}
            />
            <div className="text-right mt-1" style={{ fontSize: 11, color: '#94A3B8' }}>
              {description.length}/500
            </div>

            {error && (
              <p className="text-sm mt-3 text-center" style={{ color: '#DC2626' }}>{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  border: 'none',
                  background: submitting || !reason ? '#FCA5A5' : '#DC2626',
                  cursor: submitting || !reason ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting && <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Enviar reporte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
