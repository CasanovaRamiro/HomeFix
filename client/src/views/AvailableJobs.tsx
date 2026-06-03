import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  postToTrabajo,
} from '../lib/post'
import { fetchAvailablePosts, searchPostsByLocation } from '../services/posts'
import { applyToPost } from '../services/applications'
import api, { getWorker } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { Post, TrabajoView } from '../types/post'
import type { LocationFilter } from '../components/worker/types'
import TrabajoCard from '../components/worker/TrabajoCard'
import TrabajoDetail from '../components/worker/TrabajoDetail'
import ApplyModal from '../components/worker/ApplyModal'
import FilterBar from '../components/worker/FilterBar'
import LocationFilterModal from '../components/post/LocationFilterModal'
import { Briefcase, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 8

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
  const { user } = useAuth()
  const [workerCategories, setWorkerCategories] = useState<string[]>([])
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
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    if (user?.id) {
      getWorker(user.id)
        .then((worker) => {
          const cats = worker.categories.map((c) => c.category.name)
          setWorkerCategories(cats)
          const saved = localStorage.getItem(WORKER_CATEGORY_KEY)
          if ((!saved || saved === DEFAULT_WORKER_CATEGORY) && cats.length > 0) {
            setCategory(cats[0])
          }
        })
        .catch(() => setWorkerCategories([]))
    }
  }, [user?.id])

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

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [searchQuery, sortBy, category, locationFilter])

  const totalPages = Math.max(1, Math.ceil(filtradosYOrdenados.length / PAGE_SIZE))
  const paginated  = filtradosYOrdenados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const yaPostulado = (id: string): boolean => postulacionesIds.includes(id)

  const handlePostular = async (): Promise<void> => {
    if (!selected) return
    setEnviando(true)
    try {
      await applyToPost(selected.id)
      setPostulacionesIds((prev) => [...prev, selected.id])
      navigate('/worker/my-applications')
    } catch (err) {
      console.warn('Error al postularse:', err)
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
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/worker')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', padding: 0,
                color: '#94A3B8', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Briefcase size={28} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Trabajos disponibles
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px 38px' }}>
            {loading ? (
              'Cargando…'
            ) : (
              <>
                <strong style={{ color: '#fff' }}>{filtradosYOrdenados.length}</strong>{' '}
                {category.trim() !== '' ? (
                  <>trabajos de <strong style={{ color: '#fff' }}>{category}</strong></>
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
            workerCategories={workerCategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            locationFilter={locationFilter}
            onOpenLocationModal={() => setShowLocationModal(true)}
          />
        </div>
      </div>

      {error !== '' && (
        <p style={{ color: '#EF4444', fontSize: 13, maxWidth: 1200, margin: '12px auto 0', padding: '0 24px' }}>{error}</p>
      )}

      <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 24px 2rem', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <p style={{ color: '#64748B', fontSize: 14 }}>Cargando trabajos...</p>}
          {!loading && filtradosYOrdenados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff' }}>
              <h3 style={{ marginBottom: 8, fontSize: '1.1rem', color: '#0F172A' }}>No hay trabajos disponibles</h3>
              <p style={{ color: '#64748B', fontSize: 14 }}>No encontramos trabajos activos para este rubro o búsqueda.</p>
            </div>
          )}
          {!loading && paginated.map((trabajo) => (
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginTop: 8, paddingBottom: 8,
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8,
                  border: '1.5px solid #E2E8F0', background: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (page !== 1) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
              >
                <ChevronLeft size={16} color="#475569" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: p === page ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                    background: p === page ? '#0F172A' : '#fff',
                    color: p === page ? '#fff' : '#475569',
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (p !== page) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { if (p !== page) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8,
                  border: '1.5px solid #E2E8F0', background: '#fff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.4 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (page !== totalPages) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
              >
                <ChevronRight size={16} color="#475569" />
              </button>
            </div>
          )}
        </div>

        <aside>
          {selected !== null ? (
            <TrabajoDetail
              selected={selected}
              yaPostulado={yaPostulado(selected.id)}
              onClose={() => setSelected(null)}
              onPostular={() => setShowModal(true)}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '2.5rem 1rem' }}>
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
