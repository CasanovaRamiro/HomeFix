import { useState } from 'react'

interface InfoTooltipProps {
  text: string
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: '#94A3B8', color: '#fff', cursor: 'pointer',
          fontSize: 10, fontWeight: 700, lineHeight: 1, flexShrink: 0,
        }}
      >
        ?
      </span>
      {show && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 'calc(100% + 8px)',
          transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff',
          fontSize: 12, fontWeight: 500, lineHeight: 1.4,
          padding: '10px 14px', borderRadius: 8,
          width: 260, textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #0F172A',
          }} />
        </div>
      )}
    </span>
  )
}
