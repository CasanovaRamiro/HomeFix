import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  iconColor?: string
}

export default function StatCard({ label, value, icon: Icon, iconColor = '#10B981' }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase leading-tight">
          {label}
        </p>
        <span className="rounded-lg p-2" style={{ background: `${iconColor}18` }}>
          <Icon size={18} style={{ color: iconColor }} />
        </span>
      </div>
      <p className="text-5xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
