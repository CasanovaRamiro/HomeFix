import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  postToTrabajo,
} from '../lib/post'
import { fetchAvailablePosts, searchPostsByLocation } from '../services/posts'
import type { Post, TrabajoView } from '../types/post'
import LocationFilterModal from '../components/post/LocationFilterModal'

const POSTULACIONES_KEY = 'homefix_postulaciones_trabajador'
const CATEGORIAS_DISPONIBLES = [
  '',
  'Electricista',
  'Plomero',
  'Gasista',
  'Pintor',
  'Carpintero',
  'Albañil',
  'Cerrajero',
  'Techista',
  'Climatización', 
  'Jardinero',
  'Fumigador',
  'Vidriero',
  'Instalador',  
  'Mudanzas',
  'Limpieza'
];const LOCATION_FILTER_KEY = 'homefix_location_filter'

interface LocationFilter {
  lat: number
  lng: number
  radius: number
}

const loadStoredFilter = (): LocationFilter | null => {
  try {
    const raw = localStorage.getItem(LOCATION_FILTER_KEY)
    if (raw) return JSON.parse(raw) as LocationFilter
  } catch { /* ignore */ }
  return null
}

export default function AvailableJobs(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<string>(
    () => localStorage.getItem(WORKER_CATEGORY_KEY) ?? DEFAULT_WORKER_CATEGORY
  )
  const [trabajos, setTrabajos] = useState<(TrabajoView & { lat?: number | null; lng?: number | null })[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selected, setSelected] = useState<TrabajoView | null>(null)
  const [postulacionesIds, setPostulacionesIds] = useState<string[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [mensaje, setMensaje] = useState<string>('')
  const [enviando, setEnviando] = useState<boolean>(false)
  const [enviado, setEnviado] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(loadStoredFilter)

  const loadPostulaciones = useCallback((): void => {
    try {
      const stored = JSON.parse(localStorage.getItem(POSTULACIONES_KEY) ?? '[]') as {
        trabajoId: string | number
      }[]
      setPostulacionesIds(
        stored.map((p) => String(p.trabajoId))
      )
    } catch {
      setPostulacionesIds([])
    }
  }, [])

  const loadTrabajos = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const { data } = locationFilter
        ? await searchPostsByLocation(locationFilter.lat, locationFilter.lng, locationFilter.radius, category)
        : await fetchAvailablePosts(category)
      const mapped = (data as unknown[]).map((post) => postToTrabajo(post as Post))
      setTrabajos(mapped)

      const idParam = searchParams.get('id')
      if (idParam !== null && idParam !== '') {
        const found = mapped.find((t) => t.id === idParam)
        if (found) setSelected(found)
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('token')
        void navigate('/login')
        return
      }
      setError(axiosErr.response?.data?.error ?? 'No se pudieron cargar los trabajos')
      setTrabajos([])
    } finally {
      setLoading(false)
    }
  }, [category, navigate, searchParams, locationFilter])

  useEffect(() => {
    loadPostulaciones()
  }, [loadPostulaciones])

  useEffect(() => {
    localStorage.setItem(WORKER_CATEGORY_KEY, category)
    void loadTrabajos()
  }, [category, loadTrabajos])

  const filtradosYOrdenados = useMemo((): (TrabajoView & { lat?: number | null; lng?: number | null })[] => {
    let resultado = [...trabajos]

    const q = searchQuery.trim().toLowerCase()
    if (q !== '') {
      resultado = resultado.filter(
        (t) =>
          t.titulo.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q)
      )
    }

    resultado.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      return sortBy === 'reciente' ? dateB - dateA : dateA - dateB
    })

    return resultado
  }, [trabajos, searchQuery, sortBy])

  const logout = (): void => {
    localStorage.removeItem('token')
    void navigate('/login')
  }

  const yaPostulado = (id: string): boolean => postulacionesIds.includes(id)

  const handlePostular = (): void => {
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
    const prev = JSON.parse(localStorage.getItem(POSTULACIONES_KEY) ?? '[]') as unknown[]
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

  const handleLocationApply = (lat: number, lng: number, radius: number) => {
    const filter = { lat, lng, radius }
    setLocationFilter(filter)
    localStorage.setItem(LOCATION_FILTER_KEY, JSON.stringify(filter))
    setShowLocationModal(false)
  }

  const handleLocationClear = () => {
    setLocationFilter(null)
    localStorage.removeItem(LOCATION_FILTER_KEY)
  }

  return (
    <div className="trabajos-page">
      <header className="trabajos-hero">
        <div className="trabajos-hero-inner">
          <div className="trabajos-hero-top">
            <Link to="/users" className="trabajos-back">
              {'<- Volver'}
            </Link>
            <button type="button" className="btn-logout" onClick={logout}>
              Salir
            </button>
          </div>
          <h1>Trabajos disponibles</h1>
          <p className="trabajos-hero-subtitle">
            {loading ? (
              'Cargando…'
            ) : (
              <>
                <strong>{filtradosYOrdenados.length}</strong>{' '}
                {category.trim() !== '' ? (
                  <>
                    trabajos de <strong>{category}</strong>
                  </>
                ) : (
                  'trabajos activos'
                )}
                {locationFilter && (
                  <span> — {locationFilter.radius} km a la redonda</span>
                )}
              </>
            )}
          </p>

          <div className="trabajos-filters-row">
            <div className="filter-group filter-category">
              <label htmlFor="cat-select">Rubro</label>
              <select
                id="cat-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIAS_DISPONIBLES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === '' ? 'Todos los rubros' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-search">
              <label htmlFor="search-input">Buscar</label>
              <input
                id="search-input"
                type="search"
                placeholder="Palabra clave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group filter-sort">
              <label htmlFor="sort-select">Orden</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'reciente' | 'antiguo')}
              >
                <option value="reciente">Mas recientes</option>
                <option value="antiguo">Mas antiguos</option>
              </select>
            </div>

            <div className="filter-group filter-location">
              <label>&nbsp;</label>
              <button
                type="button"
                className={`btn-filter-location ${locationFilter ? 'active' : ''}`}
                onClick={() => setShowLocationModal(true)}
              >
                {locationFilter ? `Ubicación (${locationFilter.radius} km)` : 'Filtrar por ubicación'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {error !== '' && (
        <p className="error trabajos-error">{error}</p>
      )}

      <div className="trabajos-layout">
        <div className="trabajos-list">
          {loading && <p className="trabajos-muted">Cargando trabajos...</p>}
          {!loading && filtradosYOrdenados.length === 0 && (
            <div className="trabajos-empty card">
              <h3>No hay trabajos disponibles</h3>
              <p>No encontramos trabajos activos para este rubro o búsqueda.</p>
            </div>
          )}
          {!loading &&
            filtradosYOrdenados.map((trabajo) => (
              <article
                key={trabajo.id}
                className={`trabajo-card ${selected?.id === trabajo.id ? 'is-selected' : ''} ${yaPostulado(trabajo.id) ? 'is-applied' : ''}`}
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
                {trabajo.photo && (
                  <img
                    src={trabajo.photo}
                    alt=""
                    className="trabajo-card-img"
                  />
                )}
                <div className="trabajo-card-body">
                  <div className="trabajo-card-head">
                    <span className="badge badge-open">{trabajo.categoria}</span>
                    {yaPostulado(trabajo.id) && (
                      <span className="badge badge-applied">Postulado</span>
                    )}
                  </div>
                  <h3>{trabajo.titulo}</h3>
                  <p className="trabajo-desc">{trabajo.descripcion}</p>
                </div>
                <div className="trabajo-card-footer">
                  <div className="trabajo-client">
                    <div className="trabajo-client-avatar">
                      {trabajo.clientName?.charAt(0).toUpperCase() ?? 'C'}
                    </div>
                    <span className="trabajo-client-name">{trabajo.clientName} {trabajo.clientSurname}</span>
                  </div>
                  <span className="trabajo-date">{trabajo.fechaServicio}</span>
                </div>
              </article>
            ))}
        </div>

        <aside className="trabajos-detail">
          {selected !== null ? (
            <div className="trabajos-detail-card">
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
              <div className="trabajos-detail-body">
                <div className="trabajo-detail-client">
                  <div className="trabajo-detail-client-avatar">
                    {selected.clientName?.charAt(0).toUpperCase() ?? 'C'}
                  </div>
                  <div>
                    <div className="trabajo-detail-client-name">{selected.clientName} {selected.clientSurname}</div>
                    <span className="trabajo-detail-client-label">Cliente</span>
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
            </div>
          ) : (
            <div className="trabajos-detail-placeholder">
              <p>Selecciona un trabajo para ver el detalle</p>
            </div>
          )}
        </aside>
      </div>

      {showModal && selected !== null && (
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

      {showLocationModal && (
        <LocationFilterModal
          initialLat={locationFilter?.lat ?? -34.6037}
          initialLng={locationFilter?.lng ?? -58.3816}
          initialRadius={locationFilter?.radius ?? 30}
          onApply={handleLocationApply}
          onClear={handleLocationClear}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </div>
  )
}
