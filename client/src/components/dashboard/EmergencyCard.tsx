import { AlertTriangle } from 'lucide-react'

interface Props {
  onOpen: () => void
}

export default function EmergencyCard({ onOpen }: Props) {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-5 shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-red-500" />
        <h3 className="text-sm font-bold text-red-700">Emergencia</h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Solicitá ayuda urgente. Un profesional podrá responderte al instante.
      </p>
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        <AlertTriangle size={14} />
        Pedir ayuda urgente
      </button>
    </div>
  )
}
