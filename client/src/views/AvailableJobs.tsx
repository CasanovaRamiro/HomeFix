import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  postToTrabajo,
} from '../lib/post'
import { fetchAvailablePosts, searchPostsByLocation } from '../services/posts'
import { applyToPost } from '../services/applications'
import api from '../services/api'
import type { Post, TrabajoView } from '../types/post'
import type { LocationFilter } from '../components/worker/types'
import TrabajoCard from '../components/worker/TrabajoCard'
import TrabajoDetail from '../components/worker/TrabajoDetail'
import ApplyModal from '../components/worker/ApplyModal'
import FilterBar from '../components/worker/FilterBar'
import LocationFilterModal from '../components/post/LocationFilterModal'

const LOCATION_FILTER_KEY = 'homefix_location_filter'

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
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(loadStoredFilter)

  const loadPostulaciones = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<{ postId: string }[]>('/applications/my-applications')
      setPostulacionesIds(res.data.map((a) => a.postId))
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
    void loadPostulaciones()
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
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()

      return sortBy === 'reciente' ? dateB - dateA : dateA - dateB
    })

    return resultado
  }, [trabajos, searchQuery, sortBy])

  const logout = (): void => {
    localStorage.removeItem('token')
    void navigate('/login')
  }

  const yaPostulado = (id: string): boolean => postulacionesIds.includes(id)

  const handlePostular = async (): Promise<void> => {
    if (!selected) return
    setEnviando(true)
    try {
      await applyToPost(selected.id)
      navigate('/worker/my-applications')
    } catch {
      setEnviando(false)
    }
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
            <button type="button" className="trabajos-back" onClick={() => navigate('/worker')}>
              {'<- Volver'}
            </button>
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

          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            locationFilter={locationFilter}
            onOpenLocationModal={() => setShowLocationModal(true)}
          />
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
              <TrabajoCard
                key={trabajo.id}
                trabajo={trabajo}
                isSelected={selected?.id === trabajo.id}
                isApplied={yaPostulado(trabajo.id)}
                onClick={() => setSelected(trabajo)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(trabajo)
                  }
                }}
              />
            ))}
        </div>

        <aside className="trabajos-detail">
          {selected !== null ? (
            <TrabajoDetail
              selected={selected}
              yaPostulado={yaPostulado(selected.id)}
              onClose={() => setSelected(null)}
              onPostular={() => setShowModal(true)}
            />
          ) : (
            <div className="trabajos-detail-placeholder">
              <p>Selecciona un trabajo para ver el detalle</p>
            </div>
          )}
        </aside>
      </div>

      {showModal && selected !== null && (
        <ApplyModal
          selected={selected}
          mensaje={mensaje}
          onMensajeChange={setMensaje}
          onEnviar={handlePostular}
          onClose={() => setShowModal(false)}
          enviando={enviando}
        />
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
