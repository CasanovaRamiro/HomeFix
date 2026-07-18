import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_WORKER_CATEGORY,
  WORKER_CATEGORY_KEY,
  postToTrabajo,
} from '../lib/post'
import { fetchAvailablePosts, searchPostsByLocation } from '../services/posts'
import { applyToPost } from '../services/applications'
import api from '../services/api'
import { getWorker } from '../services/workers'
import { useAuth } from '../hooks/useAuth'
import type { Post, TrabajoView } from '../types/post'
import type { LocationFilter } from '../components/worker/types'
import TrabajoCard from '../components/worker/TrabajoCard'
import TrabajoDetail from '../components/worker/TrabajoDetail'
import ApplyModal, { type ApplicationFormData } from '../components/worker/ApplyModal'
import FilterBar from '../components/worker/FilterBar'
import LocationFilterModal from '../components/post/LocationFilterModal'
import { Briefcase, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, XCircle, CheckCircle } from 'lucide-react'
import LandingFooter from '../components/landing/LandingFooter'

const PAGE_SIZE = 10
const POLL_INTERVAL = 30000

const LOCATION_FILTER_KEY = 'homefix_location_filter'

const loadStoredFilter = (): LocationFilter | null => {
  try {
    const raw = localStorage.getItem(LOCATION_FILTER_KEY)
    if (raw) return JSON.parse(raw) as LocationFilter
  } catch { /* ignore */ }
  return null
}

function formatLastUpdate(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'hace unos segundos'
  const min = Math.floor(diff / 60)
  if (min === 1) return 'hace 1 minuto'
  return `hace ${min} minutos`
}

export default function AvailableJobs(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [workerCategories, setWorkerCategories] = useState<string[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)
  const [category, setCategory] = useState<string>(() => {
    const saved = localStorage.getItem(WORKER_CATEGORY_KEY)
    return saved ?? DEFAULT_WORKER_CATEGORY
  })
  const [trabajos, setTrabajos] = useState<(TrabajoView & { lat?: number | null; lng?: number | null })[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selected, setSelected] = useState<TrabajoView | null>(null)
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false)
  const [postulacionesIds, setPostulacionesIds] = useState<string[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [enviando, setEnviando] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [notificacion, setNotificacion] = useState<{ tipo: 'error' | 'exito'; mensaje: string } | null>(null)
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(loadStoredFilter)
  const [defaultCoords, setDefaultCoords] = useState<{ lat: number; lng: number }>({ lat: -34.6037, lng: -58.3816 })
  const [page, setPage] = useState(1)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadPostulaciones = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<{ postId: string }[]>('/applications/my-applications')
      setPostulacionesIds(res.data.map((a) => a.postId))
    } catch {
      setPostulacionesIds([])
    }
  }, [])

  const fetchTrabajos = useCallback(async (isRefresh = false): Promise<void> => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')
    try {
      // Refresh worker categories before fetching jobs
      if (user?.id) {
        try {
          const worker = await getWorker(user.id)
          setWorkerCategories(worker.categories.map((c) => c.name))
        } catch { /* ignore */ }
      }

      const sortOrder = sortBy === 'reciente' ? 'desc' : 'asc'
      let mapped: (TrabajoView & { lat?: number | null; lng?: number | null })[]
      if (locationFilter) {
        const { data } = await searchPostsByLocation(locationFilter.lat, locationFilter.lng, locationFilter.radius, category)
        mapped = (data as unknown[]).map((post) => postToTrabajo(post as Post))
      } else {
        const res = await fetchAvailablePosts(category, { page: 1, limit: 1000, sortOrder })
        mapped = res.data.data.map((post) => postToTrabajo(post))
      }
      setTrabajos(mapped)
      setLastUpdated(new Date())

      const idParam = searchParams.get('id')
      if (idParam !== null && idParam !== '') {
        const found = mapped.find((t) => t.id === idParam)
        if (found) setSelected(found)
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (!isRefresh) {
        setError(axiosErr.response?.data?.error ?? 'No se pudieron cargar los trabajos')
        setTrabajos([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [category, searchParams, locationFilter, sortBy, user?.id])

  useEffect(() => {
    void loadPostulaciones()
  }, [loadPostulaciones])

  useEffect(() => {
    if (!categoriesReady) return
    localStorage.setItem(WORKER_CATEGORY_KEY, category)
    void fetchTrabajos(false)
  }, [category, categoriesReady, fetchTrabajos])

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      void loadPostulaciones()
      void fetchTrabajos(true)
    }, POLL_INTERVAL)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadPostulaciones, fetchTrabajos])

  useEffect(() => {
    if (user?.id) {
      getWorker(user.id)
        .then((worker) => {
          const cats = worker.categories.map((c) => c.name)
          setWorkerCategories(cats)
          const saved = localStorage.getItem(WORKER_CATEGORY_KEY)
          if (saved && !cats.includes(saved) && saved !== '') {
            setCategory('')
            localStorage.setItem(WORKER_CATEGORY_KEY, '')
          }
          setCategoriesReady(true)
        })
        .catch(() => {
          setWorkerCategories([])
          setCategoriesReady(true)
        })
    }
  }, [user?.id])

  const filtradosYOrdenados = useMemo((): (TrabajoView & { lat?: number | null; lng?: number | null })[] => {
    let resultado = trabajos
    if (category === '' && workerCategories.length > 0) {
      resultado = resultado.filter((t) => workerCategories.includes(t.categoria))
    }
    const q = searchQuery.trim().toLowerCase()
    if (q !== '') {
      resultado = resultado.filter(
        (t) => t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)
      )
    }
    return resultado
  }, [trabajos, searchQuery, category, workerCategories])

  const totalPages = Math.max(1, Math.ceil(filtradosYOrdenados.length / PAGE_SIZE))
  const paginaActual = filtradosYOrdenados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [sortBy, category, locationFilter])

  const yaPostulado = (id: string): boolean => postulacionesIds.includes(id)

  const mostrarNotificacion = (tipo: 'error' | 'exito', mensaje: string) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current)
    setNotificacion({ tipo, mensaje })
    notifTimeoutRef.current = setTimeout(() => setNotificacion(null), 4000)
  }

  const handlePostular = async (formData: ApplicationFormData): Promise<void> => {
    if (!selected) return
    setEnviando(true)
    try {
      await applyToPost({
        postId: selected.id,
        message: formData.message || undefined,
        availableDays: formData.availableDays,
        availableTimeFrom: formData.availableTimeFrom,
        availableTimeTo: formData.availableTimeTo,
        chargesVisit: formData.chargesVisit,
        visitCost: formData.visitCost,
      })
      setPostulacionesIds((prev) => [...prev, selected.id])
      setShowModal(false)
      mostrarNotificacion('exito', 'Te postulaste correctamente')
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr.response?.data?.error ?? 'Error al postularte'
      setShowModal(false)
      setEnviando(false)
      mostrarNotificacion('error', msg)
    }
  }

  const handleOpenLocationModal = () => {
    if (locationFilter) {
      setShowLocationModal(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDefaultCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setShowLocationModal(true)
      },
      () => setShowLocationModal(true),
      { timeout: 5000 }
    )
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
    <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div className="hf-container" style={{ padding: '0 32px' }}>

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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Briefcase size={28} color="#10B981" />
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Trabajos disponibles
              </h1>
            </div>
            <div className="refresh-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastUpdated && !loading && (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Actualizado {formatLastUpdate(lastUpdated)}
                </span>
              )}
              <button
                onClick={() => { void loadPostulaciones(); void fetchTrabajos(true) }}
                disabled={refreshing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#E2E8F0', fontSize: 12, fontWeight: 600,
                  padding: '7px 14px', borderRadius: 8,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.6 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!refreshing) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              >
                <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                Actualizar
              </button>
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 0 38px' }}>
            {loading ? (
              'Cargando…'
            ) : (
              <>
                <strong style={{ color: '#fff' }}>{filtradosYOrdenados.length}</strong>{' '}
                {category.trim() !== '' ? (
                  <>trabajos de <strong style={{ color: '#fff' }}>{category}</strong></>
                ) : (
                  <>trabajos de <strong style={{ color: '#fff' }}>todos tus rubros</strong></>
                )}
                {locationFilter && (
                  <span> — {locationFilter.radius} km a la redonda</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* FilterBar — fuera del header oscuro */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div className="filter-bar-container hf-container" style={{ padding: '16px 32px' }}>
          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            workerCategories={workerCategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            locationFilter={locationFilter}
            onOpenLocationModal={handleOpenLocationModal}
          />
        </div>
      </div>

      {error !== '' && (
        <p className="hf-container" style={{ color: '#EF4444', fontSize: 13, margin: '12px auto 0', padding: '0 32px' }}>{error}</p>
      )}

      {notificacion && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          background: notificacion.tipo === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: `1px solid ${notificacion.tipo === 'error' ? '#FECACA' : '#A7F3D0'}`,
          borderRadius: 12, padding: '14px 20px',
          maxWidth: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.3s ease',
        }}>
          {notificacion.tipo === 'error'
            ? <XCircle size={20} color="#DC2626" />
            : <CheckCircle size={20} color="#059669" />
          }
          <span style={{ fontSize: 14, fontWeight: 500, color: notificacion.tipo === 'error' ? '#991B1B' : '#065F46' }}>
            {notificacion.mensaje}
          </span>
        </div>
      )}

      <div className="trabajos-grid-container hf-container" style={{ margin: '24px auto 0', padding: '0 32px 2rem' }}>
        {loading && <p style={{ color: '#64748B', fontSize: 14 }}>Cargando trabajos...</p>}
        {!loading && categoriesReady && workerCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ marginBottom: 8, fontSize: '1.1rem', color: '#0F172A' }}>Sin rubros asignados</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>Asignate un rubro desde tu perfil para ver trabajos disponibles.</p>
          </div>
        )}
        {!loading && categoriesReady && workerCategories.length > 0 && filtradosYOrdenados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ marginBottom: 8, fontSize: '1.1rem', color: '#0F172A' }}>No hay trabajos disponibles</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>No encontramos trabajos activos para este rubro o búsqueda.</p>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginBottom: 12,
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
              }}
            >
              <ChevronLeft size={16} color="#475569" />
            </button>
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, padding: '0 8px' }}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8,
                border: '1.5px solid #E2E8F0', background: '#fff',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={16} color="#475569" />
            </button>
          </div>
        )}
        {!loading && (
          <div className="trabajos-list-2col">
            {paginaActual.map((trabajo) => (
              <TrabajoCard
                key={trabajo.id}
                trabajo={trabajo}
                isSelected={selected?.id === trabajo.id}
                isApplied={yaPostulado(trabajo.id)}
                isOwnPost={trabajo.userId === user?.id}
                onClick={() => { setSelected(trabajo); setShowDetailModal(true) }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(trabajo)
                    setShowDetailModal(true)
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 24, paddingBottom: 8,
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
              }}
            >
              <ChevronLeft size={16} color="#475569" />
            </button>

            <div className="page-numbers-wrapper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8,
                border: '1.5px solid #E2E8F0', background: '#fff',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={16} color="#475569" />
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {showDetailModal && selected !== null && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDetailModal(false)}>
          <div className="modal-card detail-modal-card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <TrabajoDetail
              selected={selected}
              yaPostulado={yaPostulado(selected.id)}
              esPropio={selected.userId === user?.id}
              onClose={() => setShowDetailModal(false)}
              onPostular={() => { setShowDetailModal(false); setShowModal(true) }}
            />
          </div>
        </div>
      )}

      {showModal && selected !== null && (
        <ApplyModal
          selected={selected}
          onEnviar={handlePostular}
          onClose={() => setShowModal(false)}
          enviando={enviando}
        />
      )}

      {showLocationModal && (
        <LocationFilterModal
          initialLat={locationFilter?.lat ?? defaultCoords.lat}
          initialLng={locationFilter?.lng ?? defaultCoords.lng}
          initialRadius={locationFilter?.radius ?? 30}
          onApply={handleLocationApply}
          onClear={handleLocationClear}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .spin { animation: spin 0.8s linear infinite; }
        .trabajos-list-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .detail-modal-card { max-width: 520px; max-height: 85vh; overflow-y: auto; }
        .detail-modal-card .trabajos-detail-card { position: static; }
        @media (max-width: 640px) {
          .trabajos-list-2col { grid-template-columns: 1fr; }
          .trabajos-grid-container { padding-left: 16px !important; padding-right: 16px !important; margin-top: 16px !important; }
          .filter-bar-container { padding-left: 16px !important; padding-right: 16px !important; }
          .filter-bar-container .trabajos-filters-row { align-items: stretch; }
          .refresh-controls { display: none !important; }
        }
      `}</style>
    </div>
  )
}
