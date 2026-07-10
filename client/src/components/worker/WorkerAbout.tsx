import type { Worker } from '../../services/workers'

interface Props {
  worker: Worker
}

export default function WorkerAbout({ worker }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 28 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Sobre mí</h3>
      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
        {worker.bio ?? 'Este trabajador aún no agregó una descripción.'}
      </p>
    </div>
  )
}
