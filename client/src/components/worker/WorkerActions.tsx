export default function WorkerActions() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

      {/* Placeholder photo */}
      <div style={{ width: '100%', aspectRatio: '4/3', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* Buttons */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          style={{
            width: '100%', padding: '12px',
            background: '#0F172A', border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 600,
            borderRadius: 10, cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Chat Ahora
        </button>

        <button
          style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 600,
            borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            letterSpacing: '0.01em',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Agendar Cita
        </button>
      </div>

    </div>
  )
}
