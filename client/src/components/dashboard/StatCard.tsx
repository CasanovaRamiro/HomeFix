import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  /** Color del icono (identidad por métrica). Cliente = azul por defecto. */
  iconColor?: string
}

export default function StatCard({ label, value, icon: Icon, iconColor = '#2563EB' }: Props) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${iconColor}1a` }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </span>
      <div className="min-w-0">
        <p className="text-3xl font-extrabold leading-none text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}
