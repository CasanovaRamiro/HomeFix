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
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Estadísticas</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              {icon}
            </div>
            <span style={{ flex: 1, fontSize: 14, color: '#6B7280' }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
