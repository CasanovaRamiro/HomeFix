import { useIsMobile } from '../../hooks/useIsMobile'
import type { Worker } from '../../services/api'

interface Props {
  worker: Worker
}

export default function WorkerHeader({ worker }: Props) {
  const isMobile = useIsMobile()
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(worker.createdAt).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

      {/* Cover banner */}
      <div style={{ height: isMobile ? 72 : 100, background: 'linear-gradient(135deg, #0F172A 0%, #1e3a5f 60%, #10B981 100%)' }} />

      <div style={{ padding: isMobile ? '0 16px 20px' : '0 28px 28px' }}>

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: '#E5E7EB', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: '#374151',
              userSelect: 'none',
            }}>
              {initials}
            </div>
            <div style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 22, height: 22, borderRadius: '50%',
              background: '#10B981', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="11" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{worker.name}</h2>
          {/* <span style={{
            background: '#D1FAE5', color: '#059669',
            fontSize: 12, fontWeight: 600,
            padding: '3px 10px', borderRadius: 999,
          }}>
            Verificado
          </span> */}
        </div>

        {/* Role */}
        <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 12px', textTransform: 'capitalize' }}>
          {worker.role}
        </p>

        {/* Categories */}
        {worker.categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {worker.categories.map(({ category }) => (
              <span key={category.id} style={{
                background: '#EFF6FF', color: '#1D4ED8',
                fontSize: 12, fontWeight: 600,
                padding: '4px 12px', borderRadius: 999,
                border: '1px solid #BFDBFE',
              }}>
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid #F3F4F6', marginBottom: 20 }} />

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ContactRow icon="✉" value={worker.email} />
          {worker.phone && <ContactRow icon="📞" value={worker.phone} />}
          <ContactRow icon="📅" value={`Miembro desde ${memberSince}`} />
        </div>

      </div>
    </div>
  )
}

function ContactRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
      <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{value}</span>
    </div>
  )
}
