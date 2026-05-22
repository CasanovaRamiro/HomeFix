import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  postToTrabajo,
} from '../lib/post'
import { fetchAvailablePosts } from '../services/posts'
import type { TrabajoView } from '../types/post'

const POSTULACIONES_KEY = 'homefix_postulaciones_trabajador'
// Hardcodeamos las categorías conocidas de tu seed para los chips estilo Backloggd
const CATEGORIAS_DISPONIBLES = ['', 'Electricista', 'Plomero']

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
  
  // Nuevo estado para controlar el ordenamiento solicitado por la HU
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')

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
      const { data } = await fetchAvailablePosts(category)
      const mapped = data.map(postToTrabajo)
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

  // Procesamos filtros y ordenamiento en cadena de forma eficiente
  const filtradosYOrdenados = useMemo(() => {
    let resultado = [...trabajos]
    
    // 1. Filtrado por palabra clave
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      resultado = resultado.filter(
        (t) =>
          t.titulo.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q)
      )
    }

    // 2. Ordenamiento dinámico solicitado por las especificaciones
    resultado.sort((a, b) => {
      // Reemplazar barras por guiones para asegurar parseo ISO consistente en navegadores
      const dateA = new Date(a.fechaPublicacion.split('/').reverse().join('-')).getTime()
      const dateB = new Date(b.fechaPublicacion.split('/').reverse().join('-')).getTime()
      
      return sortBy === 'reciente' ? dateB - dateA : dateA - dateB
    })

    return resultado
  }, [trabajos, searchQuery, sortBy])

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
                <strong>{filtradosYOrdenados.length}</strong>{' '}
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
          
          {/* NUEVA BARRA UNIFICADA DE ACCIONES SUPERIOR */}
          <div className="trabajos-hero-actions-row">
            
            {/* 1. Chips de Rubros */}
            <div className="backloggd-chips-container">
              <span className="chips-label">Filtrar rubro:</span>
              <div className="backloggd-chips">
                {CATEGORIAS_DISPONIBLES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === '' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Buscador por Palabra Clave (Mediano y Centrado) */}
            <div className="search-wrapper-inline">
              <span className="search-label">Buscar:</span>
              <input
                type="search"
                placeholder="Palabra clave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 3. Botón Salir alineado al final */}
            <div className="logout-wrapper-inline">
              <button type="button" className="btn-outline" onClick={logout}>
                Salir
              </button>
            </div>

          </div>
        </div>
      </header>

  

      {error && (
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