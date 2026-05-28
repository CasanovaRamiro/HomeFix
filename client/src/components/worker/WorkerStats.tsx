interface Props {
  reviewCount: number
  avgRating: number
}

export default function WorkerStats({ reviewCount, avgRating }: Props) {
  const rows = [
    { label: 'Trabajos Completados', value: reviewCount > 0 ? String(reviewCount) : '—', icon: '💼' },
    { label: 'Calificación',         value: avgRating > 0 ? avgRating.toFixed(1) : '—',  icon: '⭐' },
    { label: 'Tasa de Respuesta',    value: '—', icon: '✅' },
    { label: 'Tiempo de Respuesta',  value: '—', icon: '⏱' },
  ]

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6">
      <h3 className="text-[17px] font-bold text-gray-900 mb-5">Estadísticas</h3>
      <div className="flex flex-col gap-1">
        {rows.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-3 py-2.5 border-b border-[#F9FAFB]">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
              {icon}
            </div>
            <span className="flex-1 text-sm text-text-muted">{label}</span>
            <span className="text-[15px] font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
