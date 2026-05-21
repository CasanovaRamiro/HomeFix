import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  publicationToTrabajo,
} from '../lib/publication'
import { fetchAvailablePublications } from '../services/publications'
import type { TrabajoView } from '../types/publication'

const POSTULACIONES_KEY = 'homefix_postulaciones_trabajador'

export default function Trabajos() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState(
    () => localStorage.getItem(WORKER_CATEGORY_KEY) ?? DEFAULT_WORKER_CATEGORY
  )
  const [trabajos, setTrabajos] = useState<TrabajoView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<TrabajoView | null>(null)
  const [postulacionesIds, setPostulacionesIds] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const loadPostulaciones = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(POSTULACIONES_KEY) ?? '[]') as {
        trabajoId: string | number
      }[]
      setPostulacionesIds(
        stored.map((p) => Number(p.trabajoId)).filter((id) => !Number.isNaN(id))
      )
    } catch {
      setPostulacionesIds([])
    }
  }, [])

  const loadTrabajos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await fetchAvailablePublications(category)
      const mapped = data.map(publicationToTrabajo)
      setTrabajos(mapped)
      const idParam = searchParams.get('id')
      if (idParam) {
        const found = mapped.find((t) => t.id === Number(idParam))
        if (found) setSelected(found)
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      setError(axiosErr.response?.data?.error ?? 'No se pudieron cargar los trabajos')
      setTrabajos([])
    } finally {
      setLoading(false)
    }
  }, [category, navigate, searchParams])

  useEffect(() => {
    loadPostulaciones()
  }, [loadPostulaciones])

  useEffect(() => {
    localStorage.setItem(WORKER_CATEGORY_KEY, category)
    loadTrabajos()
  }, [category, loadTrabajos])

  const filtrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return trabajos
    return trabajos.filter(
      (t) =>
        t.titulo.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q)
    )
  }, [trabajos, searchQuery])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const yaPostulado = (id: number) => postulacionesIds.includes(id)

  const handlePostular = () => {
    if (!selected) return
    setEnviando(true)
    const entry = {
      id: `post-${Date.now()}`,
      trabajoId: selected.id,
      trabajo: selected.titulo,
      cliente: `Cliente #${selected.id}`,
      mensaje: mensaje,
      estado: 'pendiente',
      fechaPostulacion: new Date().toISOString().split('T')[0],
    }
    const prev = JSON.parse(localStorage.getItem(POSTULACIONES_KEY) ?? '[]')
    localStorage.setItem(POSTULACIONES_KEY, JSON.stringify([entry, ...prev]))
    setPostulacionesIds((ids) => [...ids, selected.id])
    setEnviado(true)
    setTimeout(() => {
      setShowModal(false)
      setEnviado(false)
      setMensaje('')
      setEnviando(false)
    }, 1500)
  }

  return (
    <div className="trabajos-page">
      <header className="trabajos-hero">
        <div className="trabajos-hero-inner">
          <Link to="/users" className="trabajos-back">
            {'<- Volver'}
          </Link>
          <h1>Trabajos disponibles</h1>
          <p>
            {loading ? (
              'Cargando…'
            ) : (
              <>
                <strong>{filtrados.length}</strong>{' '}
                {category.trim() ? (
                  <>
                    trabajos de <strong>{category}</strong>
                  </>
                ) : (
                  'trabajos activos'
                )}
              </>
            )}
          </p>
          <div className="trabajos-hero-actions">
            <label className="trabajos-category-label">
              Filtrar rubro
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Todos los rubros"
              />
            </label>
            <button type="button" className="btn-outline" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="trabajos-filters">
        <input
          type="search"
          placeholder="Buscar por palabra clave..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {error && (
        <p className="error trabajos-error">{error}</p>
      )}

      <div className="trabajos-layout">
        <div className="trabajos-list">
          {loading && <p className="trabajos-muted">Cargando trabajos...</p>}
          {!loading && filtrados.length === 0 && (
            <div className="trabajos-empty card">
              <h3>No hay trabajos disponibles</h3>
              <p>No encontramos publicaciones activas para este rubro o busqueda.</p>
            </div>
          )}
          {!loading &&
            filtrados.map((trabajo) => (
              <article
                key={trabajo.id}
                className={`trabajo-card card ${selected?.id === trabajo.id ? 'is-selected' : ''} ${yaPostulado(trabajo.id) ? 'is-applied' : ''}`}
                onClick={() => setSelected(trabajo)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(trabajo)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="trabajo-card-head">
                  <span className="badge badge-open">{trabajo.categoria}</span>
                  {yaPostulado(trabajo.id) && (
                    <span className="badge badge-applied">Postulado</span>
                  )}
                  <span className="trabajo-date">{trabajo.fechaPublicacion}</span>
                </div>
                <h3>{trabajo.titulo}</h3>
                <p className="trabajo-desc">{trabajo.descripcion}</p>
                <p className="trabajo-meta">
                  Servicio: {trabajo.fechaServicio}
                </p>
              </article>
            ))}
        </div>

        <aside className="trabajos-detail">
          {selected ? (
            <div className="card trabajos-detail-card">
              <div className="trabajos-detail-head">
                <h2>Detalle del trabajo</h2>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setSelected(null)}
                  aria-label="Cerrar detalle"
                >
                  x
                </button>
              </div>
              {selected.photo && (
                <img
                  src={selected.photo}
                  alt=""
                  className="trabajo-photo"
                />
              )}
              <h3>{selected.titulo}</h3>
              <p className="trabajo-meta">Publicado: {selected.fechaPublicacion}</p>
              <p className="trabajo-detail-desc">{selected.descripcion}</p>
              <dl className="trabajo-facts">
                <div>
                  <dt>Rubro</dt>
                  <dd>{selected.categoria}</dd>
                </div>
                <div>
                  <dt>Fecha servicio</dt>
                  <dd>{selected.fechaServicio}</dd>
                </div>
              </dl>
              {yaPostulado(selected.id) ? (
                <p className="trabajos-applied-msg">Ya te postulaste a este trabajo.</p>
              ) : (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={() => setShowModal(true)}
                >
                  Postularme
                </button>
              )}
            </div>
          ) : (
            <div className="card trabajos-detail-placeholder">
              <p>Selecciona un trabajo para ver el detalle</p>
            </div>
          )}
        </aside>
      </div>

      {showModal && selected && (
        <div className="modal-overlay" role="presentation" onClick={() => !enviando && setShowModal(false)}>
          <div
            className="card modal-card"
            role="dialog"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {!enviado ? (
              <>
                <h2 id="modal-title">Postularte a este trabajo</h2>
                <p className="trabajos-muted">{selected.titulo}</p>
                <label className="modal-label">
                  Mensaje para el cliente (opcional)
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={4}
                    placeholder="Presentate brevemente o conta tu experiencia..."
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setShowModal(false)}
                    disabled={enviando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-accent"
                    onClick={handlePostular}
                    disabled={enviando}
                  >
                    {enviando ? 'Enviando...' : 'Enviar postulacion'}
                  </button>
                </div>
              </>
            ) : (
              <div className="modal-success">
                <h2>Postulacion enviada</h2>
                <p>Guardada localmente hasta que exista el backend de postulaciones.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
