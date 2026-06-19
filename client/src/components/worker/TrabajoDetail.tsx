import { useState } from 'react'
import type { TrabajoView } from '../../types/post'
import StarRating from '../ui/StarRating'

interface Props {
  selected: TrabajoView & { lat?: number | null; lng?: number | null }
  yaPostulado: boolean
  esPropio: boolean
  onClose: () => void
  onPostular: () => void
}

export default function TrabajoDetail({ selected, yaPostulado, esPropio, onClose, onPostular }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="trabajos-detail-card">
      <div className="trabajos-detail-head">
        <h2>Detalle del trabajo</h2>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar detalle">
          x
        </button>
      </div>
      {selected.images && selected.images.length > 0 && (
        <div className="trabajo-detail-images">
          {selected.images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setSelectedImage(img.url); setZoomed(false) }}
              style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}
            >
              <img src={img.url} alt={`Foto ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
      {selectedImage && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setSelectedImage(null)}
          style={{ zIndex: 9999, cursor: 'zoom-out' }}
        >
          <img
            src={selectedImage}
            alt="Foto ampliada"
            onClick={(e) => { e.stopPropagation(); setZoomed(z => !z) }}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              objectFit: 'contain',
              transform: zoomed ? 'scale(2)' : 'scale(1)',
              transition: 'transform 0.2s ease',
              cursor: 'zoom-in',
            }}
          />
        </div>
      )}
      <div className="trabajos-detail-body">
        <div className="trabajo-detail-client">
          <div className="trabajo-detail-client-avatar">
            {selected.clientName?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <div>
            <div className="trabajo-detail-client-name">{selected.clientName} {selected.clientSurname}</div>
            <span className="trabajo-detail-client-label">Cliente</span>
            <StarRating rating={selected.clientRating} />
          </div>
        </div>
        <h3>{selected.titulo}</h3>
        <p className="trabajo-meta">Publicado: {selected.fechaPublicacion}</p>
        <p className="trabajo-detail-desc">{selected.descripcion}</p>
        <dl className="trabajo-facts">
          <div>
            <dt>Rubro</dt>
            <dd>{selected.categoria}</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>{selected.address}</dd>
          </div>
          <div>
            <dt>Fecha servicio</dt>
            <dd>{selected.fechaServicio}</dd>
          </div>
          <div>
            <dt>Subcontratación</dt>
            <dd style={{ color: selected.allowsSubcontracting ? '#059669' : '#DC2626', fontWeight: 600 }}>
              {selected.allowsSubcontracting ? 'Permitida' : 'No permitida'}
            </dd>
          </div>
        </dl>
        {esPropio ? (
          <p className="trabajos-applied-msg" style={{ color: '#64748B' }}>Es tu publicación</p>
        ) : yaPostulado ? (
          <p className="trabajos-applied-msg">Ya te postulaste a este trabajo.</p>
        ) : (
          <button type="button" className="btn-accent" onClick={onPostular}>
            Postularme
          </button>
        )}
      </div>
    </div>
  )
}
