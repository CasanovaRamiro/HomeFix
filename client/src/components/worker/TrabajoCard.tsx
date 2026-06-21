import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { TrabajoView } from '../../types/post'
import StarRating from '../ui/StarRating'
import { MapPin, TriangleAlert } from 'lucide-react'
import { getCategoryMeta } from '../../views/categoryMeta'

interface Props {
  trabajo: TrabajoView & { lat?: number | null; lng?: number | null }
  isSelected: boolean
  isApplied: boolean
  isOwnPost: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function calcTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Vencido'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m ${s}s restantes`
  return `${m}m ${s}s restantes`
}

const PROVINCIAS = new Set([
  'CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos',
  'Salta', 'Corrientes', 'Santiago del Estero', 'Chaco', 'Río Negro', 'Formosa',
  'Neuquén', 'Chubut', 'San Juan', 'Misiones', 'La Rioja', 'Catamarca', 'La Pampa',
  'San Luis', 'Santa Cruz', 'Tierra del Fuego', 'Jujuy',
])

function shortAddress(addr: string): string {
  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 2) return parts.join(' - ')
  const filtered = parts.filter((p) => !/^\d+$/.test(p) && p !== 'Argentina')
  let provIdx = -1
  for (let i = filtered.length - 1; i >= 0; i--) {
    if (PROVINCIAS.has(filtered[i])) { provIdx = i; break }
  }
  if (provIdx >= 1) {
    let city = filtered[provIdx - 1]
    if (city.startsWith('Partido de ') && provIdx >= 2) city = filtered[provIdx - 2]
    return `${city} - ${filtered[provIdx]}`
  }
  return filtered.slice(-2).join(' - ')
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function TrabajoCard({ trabajo, isSelected, isApplied, isOwnPost, onClick, onKeyDown }: Props) {
  const meta = getCategoryMeta(trabajo.categoria)
  const [timeLeft, setTimeLeft] = useState(() =>
    trabajo.emergencyExpiresAt ? calcTimeLeft(trabajo.emergencyExpiresAt) : ''
  )
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const expiresAt = trabajo.emergencyExpiresAt
    if (!expiresAt) return
    const tick = () => {
      const t = calcTimeLeft(expiresAt)
      setTimeLeft(t)
      if (t === 'Vencido') setExpired(true)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [trabajo.emergencyExpiresAt])

  if (expired) return null

  return (
    <article
      className={`trabajo-card ${isSelected ? 'is-selected' : ''} ${isApplied ? 'is-applied' : ''}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      {trabajo.isEmergency ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#EF4444', padding: '8px 14px',
          color: '#fff', fontSize: 13, fontWeight: 700,
        }}>
          <TriangleAlert size={16} />
          <span>Urgente</span>
          <span style={{ marginLeft: 'auto', color: '#FECACA', fontSize: 11, fontWeight: 500 }}>
            {timeLeft}
          </span>
        </div>
      ) : (
        <div className={`trabajo-card-strip ${meta.strip}`} />
      )}
      <div className="trabajo-card-body">
       <div className="trabajo-card-head">
          <span className={`badge ${meta.bg} ${meta.text}`}>
            <meta.Icon size={14} style={{ marginRight: 4 }} />
            {trabajo.categoria}
          </span>
          {isOwnPost && (
            <span className="badge badge-own">Tu publicación</span>
          )}
          {isApplied && (
            <span className="badge badge-applied">Postulado</span>
          )}
       </div>
        <h3>{trabajo.titulo}</h3>
        <p className="trabajo-desc">{trabajo.descripcion}</p>
        <p className="trabajo-address">
          <MapPin size={12} />
          {shortAddress(trabajo.address)}
        </p>
      </div>
      <div className="trabajo-card-footer">
        <div className="trabajo-client">
          <Link
            to={`/profile/client/${trabajo.userId}`}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}
          >
            <div className="trabajo-client-avatar">
              {trabajo.clientName?.charAt(0).toUpperCase() ?? 'C'}
            </div>
            <span className="trabajo-client-name">{trabajo.clientName} {trabajo.clientSurname}</span>
          </Link>
          <StarRating rating={trabajo.clientRating} />
        </div>
        <div className="trabajo-card-actions">
          <span className="trabajo-date trabajo-date-full">{trabajo.fechaServicio}</span>
          <span className="trabajo-date trabajo-date-short">{formatShortDate(trabajo.startDate)}</span>
          <button type="button" className="btn-ver-detalle" onClick={(e) => { e.stopPropagation(); onClick() }}>
            Ver detalle
          </button>
        </div>
      </div>
    </article>
  )
}
