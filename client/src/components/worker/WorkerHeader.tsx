import type { Worker } from '../../services/api'

interface Props {
  worker: Worker
}

export default function WorkerHeader({ worker }: Props) {
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
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">

      {/* Cover banner */}
      <div className="h-[72px] md:h-[100px] bg-gradient-to-r from-primary-dark via-[#1e3a5f] to-secondary" />

      <div className="px-4 pb-5 md:px-7 md:pb-7">

        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <div className="w-[88px] h-[88px] rounded-full bg-gray-200 ring-4 ring-white flex items-center justify-center text-[26px] font-bold text-gray-700 select-none">
              {initials}
            </div>
            <div className="absolute bottom-1 right-1 w-[22px] h-[22px] rounded-full bg-secondary ring-2 ring-white flex items-center justify-center">
              <svg width="11" height="11" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Name + badge */}
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h2 className="text-2xl font-bold text-gray-900">{worker.name}</h2>
        </div>

        {/* Role */}
        <p className="text-text-muted text-[15px] mb-3 capitalize">
          {worker.role}
        </p>

        {/* Categories */}
        {worker.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {worker.categories.map(({ category }) => (
              <span key={category.id} className="text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 mb-5" />

        {/* Contact info */}
        <div className="flex flex-col gap-3">
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
    <div className="flex items-center gap-2.5 text-sm text-gray-700">
      <span className="text-[15px] w-5 text-center">{icon}</span>
      <span>{value}</span>
    </div>
  )
}
