import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, XCircle, Calendar, MapPin, Users } from 'lucide-react'
import { fetchAvailableSubcontracts } from '../services/posts'
import { applyToSubcontract } from '../services/applications'
import { getWorker } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { WORKER_CATEGORY_KEY, DEFAULT_WORKER_CATEGORY } from '../lib/post'
import type { AvailableSubcontractDTO } from '../types/post'
import type { LocationFilter } from '../components/worker/types'
import SubcontractCard from '../components/worker/SubcontractCard'
import LocationFilterModal from '../components/post/LocationFilterModal'
import ApplyModal, { type ApplicationFormData } from '../components/worker/ApplyModal'
import StarRating from '../components/ui/StarRating'
import CustomSelect from '../components/ui/CustomSelect'
import api from '../services/api'
import LandingFooter from '../components/landing/LandingFooter'

const PAGE_SIZE = 8
const POLL_INTERVAL = 30000

function formatLastUpdate(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'hace unos segundos'
  const min = Math.floor(diff / 60)
  if (min === 1) return 'hace 1 minuto'
  return `hace ${min} minutos`
}

export default function AvailableSubcontracts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subcontratos, setSubcontratos] = useState<AvailableSubcontractDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [page, setPage] = useState(1)
  const [workerCategories, setWorkerCategories] = useState<string[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)
  const [category, setCategory] = useState<string>(() => {
    const saved = localStorage.getItem(WORKER_CATEGORY_KEY)
    return saved ?? DEFAULT_WORKER_CATEGORY
  })
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(() => {
    try {
      const raw = localStorage.getItem('homefix_location_filter')
      return raw ? JSON.parse(raw) as LocationFilter : null
    } catch { return null }
  })
  const [defaultCoords, setDefaultCoords] = useState<{ lat: number; lng: number }>({ lat: -34.6037, lng: -58.3816 })
  const [selected, setSelected] = useState<AvailableSubcontractDTO | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [postulacionesIds, setPostulacionesIds] = useState<Set<string>>(new Set())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [notificacion, setNotificacion] = useState<{ tipo: 'error' | 'exito'; mensaje: string } | null>(null)
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const loadPostulaciones = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<{ postId: string; categoryId: string | null }[]>('/applications/my-applications')
      setPostulacionesIds(new Set(res.data.map((a) => a.categoryId ? `${a.postId}:${a.categoryId}` : a.postId)))
    } catch {
      setPostulacionesIds(new Set())
    }
  }, [])

  const fetchSubcontratos = useCallback(async (isRefresh = false): Promise<void> => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await fetchAvailableSubcontracts()
      setSubcontratos(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
      if (!isRefresh) {
        setError(axiosErr.response?.data?.error ?? 'No se pudieron cargar los subcontratos')
        setSubcontratos([])
      } else {
        mostrarNotificacion('error', axiosErr.response?.data?.error ?? 'Error al actualizar')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadPostulaciones()
  }, [loadPostulaciones])

  useEffect(() => {
    if (!categoriesReady) return
    void fetchSubcontratos(false)
  }, [categoriesReady, fetchSubcontratos])

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      void loadPostulaciones()
      void fetchSubcontratos(true)
    }, POLL_INTERVAL)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadPostulaciones, fetchSubcontratos])

  const yaPostulado = (id: string, categoryId?: string): boolean =>
    categoryId ? postulacionesIds.has(`${id}:${categoryId}`) : postulacionesIds.has(id)

  const mostrarNotificacion = (tipo: 'error' | 'exito', mensaje: string) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current)
    setNotificacion({ tipo, mensaje })
    notifTimeoutRef.current = setTimeout(() => setNotificacion(null), 4000)
  }

  const handlePostular = async (formData: ApplicationFormData): Promise<void> => {
    if (!selected || !selectedCategoryId) return
    setEnviando(true)
    try {
      await applyToSubcontract({
        postId: selected.id,
        categoryId: selectedCategoryId,
        message: formData.message || undefined,
        chargesVisit: formData.chargesVisit,
        visitCost: formData.visitCost,
      })
      setPostulacionesIds((prev) => new Set(prev).add(`${selected.id}:${selectedCategoryId}`))
      setShowApplyModal(false)
      setSelectedCategoryId(null)
      mostrarNotificacion('exito', 'Te postulaste correctamente')
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setShowApplyModal(false)
      setSelectedCategoryId(null)
      setEnviando(false)
      mostrarNotificacion('error', axiosErr.response?.data?.error ?? 'Error al postularte')
    }
  }

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const filtrados = useMemo(() => {
    let resultado = [...subcontratos]

    const categoryFilter = category || workerCategories
    resultado = resultado.filter((s) =>
      s.categories.some((c) => categoryFilter.includes(c.name)),
    )

    if (locationFilter) {
      resultado = resultado.filter((s) => {
        if (s.latitude == null || s.longitude == null) return false
        const dist = haversineKm(locationFilter.lat, locationFilter.lng, s.latitude, s.longitude)
        return dist <= locationFilter.radius
      })
    }

    const q = searchQuery.trim().toLowerCase()
    if (q !== '') {
      resultado = resultado.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.categories.some((c) => c.name.toLowerCase().includes(q)),
      )
    }

    resultado.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()
      return sortBy === 'reciente' ? dateB - dateA : dateA - dateB
    })

    return resultado
  }, [subcontratos, searchQuery, sortBy, category, workerCategories, locationFilter])

  useEffect(() => { setPage(1) }, [sortBy, category, locationFilter])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleSortChange = (value: 'reciente' | 'antiguo') => {
    setSortBy(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    localStorage.setItem(WORKER_CATEGORY_KEY, value)
    setPage(1)
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
    localStorage.setItem('homefix_location_filter', JSON.stringify(filter))
    setShowLocationModal(false)
  }

  const handleLocationClear = () => {
    setLocationFilter(null)
    localStorage.removeItem('homefix_location_filter')
  }

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginated = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalVacantes = filtrados.reduce(
    (acc, s) => acc + s.categories.reduce((a, c) => a + (c.quantity - c.filledCount), 0),
    0,
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      {/* ── Header con degradado ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1E293B 100%)',
          width: '100%', paddingTop: 40, paddingBottom: 48,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(59,130,246,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -40, left: -30, width: 160, height: 160,
            borderRadius: '50%', background: 'rgba(59,130,246,0.06)',
          }}
        />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
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
              <GitBranch size={28} color="#3B82F6" />
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Subcontrataciones disponibles
              </h1>
            </div>
            <div className="refresh-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastUpdated && !loading && (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Actualizado {formatLastUpdate(lastUpdated)}
                </span>
              )}
              <button
                onClick={() => { void loadPostulaciones(); void fetchSubcontratos(true) }}
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
                <strong style={{ color: '#fff' }}>{filtrados.length}</strong> subcontrataciones activas
                {category.trim() !== '' && (
                  <> &middot; <strong style={{ color: '#fff' }}>{category}</strong></>
                )}
                {!loading && totalVacantes > 0 && (
                  <> &middot; <strong style={{ color: '#93C5FD' }}>{totalVacantes}</strong> vacantes totales</>
                )}
                {locationFilter && (
                  <span> &middot; {locationFilter.radius} km a la redonda</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div className="filter-bar-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px' }}>
          <div className="trabajos-filters-row">
            <div className="filter-group filter-category">
              <CustomSelect
                id="sc-category"
                label="Rubro"
                options={[
                  { value: '', label: 'Todos los rubros' },
                  ...workerCategories.map(cat => ({ value: cat, label: cat }))
                ]}
                value={category}
                onChange={handleCategoryChange}
              />
            </div>

            <div className="filter-group filter-search">
              <label htmlFor="sc-search">Buscar</label>
              <input
                id="sc-search"
                type="search"
                placeholder="Palabra clave..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="filter-group filter-sort">
              <CustomSelect
                id="sc-sort"
                label="Orden"
                options={[
                  { value: 'reciente', label: 'Mas recientes' },
                  { value: 'antiguo', label: 'Mas antiguos' }
                ]}
                value={sortBy}
                onChange={(val) => handleSortChange(val as 'reciente' | 'antiguo')}
              />
            </div>

            <div className="filter-group filter-location">
              <label>&nbsp;</label>
              <button
                type="button"
                className={`btn-filter-location ${locationFilter ? 'active' : ''}`}
                onClick={handleOpenLocationModal}
              >
                {locationFilter ? `${locationFilter.radius} km` : 'Filtrar por ubicación'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error !== '' && (
        <div style={{ maxWidth: 1280, margin: '12px auto 0', padding: '0 32px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#DC2626', fontSize: 14 }}>⚠</span>
            <span style={{ color: '#991B1B', fontSize: 13 }}>{error}</span>
          </div>
        </div>
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
          <XCircle size={20} color={notificacion.tipo === 'error' ? '#DC2626' : '#059669'} />
          <span style={{ fontSize: 14, fontWeight: 500, color: notificacion.tipo === 'error' ? '#991B1B' : '#065F46' }}>
            {notificacion.mensaje}
          </span>
        </div>
      )}

      {/* ── Grid de cards ── */}
      <div style={{ maxWidth: 1280, margin: '28px auto 0', padding: '0 32px 3rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div
              style={{
                width: 40, height: 40, border: '3px solid #E2E8F0',
                borderTopColor: '#3B82F6', borderRadius: '50%',
                margin: '0 auto', animation: 'spin 0.7s linear infinite',
              }}
            />
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 16 }}>Cargando subcontrataciones…</p>
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#fff' }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#EFF6FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px',
              }}
            >
              <GitBranch size={24} color="#3B82F6" />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: '1.1rem', color: '#0F172A', fontWeight: 600 }}>
              No hay subcontrataciones disponibles
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {searchQuery.trim()
                ? 'No encontramos subcontratos que coincidan con tu búsqueda. Probá con otros términos.'
                : 'No hay subcontratos activos en este momento. Volvé más tarde para ver nuevas oportunidades.'}
            </p>
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
        {!loading && paginated.length > 0 && (
          <>
            <div className="sc-grid" style={{ marginBottom: totalPages > 1 ? 24 : 0 }}>
              {paginated.map((sub, idx) => (
                <div key={sub.id} className="sc-card-wrapper" style={{ animation: `fadeInUp 0.35s ease-out ${idx * 0.06}s both` }}>
                  <SubcontractCard
                    subcontract={sub}
                    onClick={() => { setSelected(sub); setShowDetailModal(true) }}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
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

                <div className="page-numbers-wrapper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: p === page ? '1.5px solid #3B82F6' : '1.5px solid #E2E8F0',
                        background: p === page ? '#3B82F6' : '#fff',
                        color: p === page ? '#fff' : '#475569',
                        fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { if (p !== page) (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
                      onMouseLeave={(e) => { if (p !== page) { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#475569' } }}
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
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (page !== totalPages) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                >
                  <ChevronRight size={16} color="#475569" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

      {/* ── Detail modal ── */}
      {showDetailModal && selected !== null && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDetailModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12, background: '#fff' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px 0',
            }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                {selected.title}
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '1.3rem',
                  color: '#94A3B8', cursor: 'pointer', padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                x
              </button>
            </div>

            <div style={{ padding: '14px 20px 20px' }}>
              {/* Creator info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 12,
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#EEF2FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, fontWeight: 700,
                  color: '#4F46E5', flexShrink: 0,
                }}>
                  {selected.user?.name?.charAt(0).toUpperCase() ?? 'C'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                    {selected.user?.name ?? ''} {selected.user?.surname ?? ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Contratista
                    </span>
                    <StarRating rating={selected.clientRating} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, color: '#475569', margin: '0 0 14px', lineHeight: 1.55 }}>
                {selected.description}
              </p>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Calendar size={13} color="#64748B" />
                    <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Fechas</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                    {new Date(selected.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — {new Date(selected.endDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <MapPin size={13} color="#64748B" />
                    <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Ubicación</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{selected.address}</p>
                </div>
              </div>

              {/* Categories / Vacancies */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Users size={16} color="#3B82F6" />
                  <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>Vacantes</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.categories.map((cat, i) => {
                    const needed = cat.quantity - cat.filledCount
                    const applied = yaPostulado(selected.id, cat.id)
                    return (
                      <div key={i} style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{cat.name}</span>
                          <span style={{
                            padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                            background: needed > 0 ? '#ECFDF5' : '#F1F5F9',
                            color: needed > 0 ? '#059669' : '#94A3B8',
                          }}>
                            {needed > 0 ? `${needed} vacante${needed !== 1 ? 's' : ''}` : 'Completo'}
                          </span>
                        </div>
                        {cat.roleDescription && (
                          <p style={{ margin: '0 0 2px', fontSize: 12, color: '#64748B' }}>
                            Rol: {cat.roleDescription}
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                          {cat.filledCount} de {cat.quantity} cubierto{cat.filledCount !== 1 ? 's' : ''}
                        </p>
                        {needed > 0 && !applied && (
                          <button
                            type="button"
                            className="btn-accent"
                            onClick={() => { setSelectedCategoryId(cat.id); setShowDetailModal(false); setShowApplyModal(true) }}
                            style={{ width: '100%', marginTop: 8, fontSize: 13, padding: '6px 12px' }}
                          >
                            Postularme para {cat.name}
                          </button>
                        )}
                        {applied && (
                          <p style={{
                            background: '#E8F5E9', color: '#2D6A4F',
                            padding: '6px 12px', borderRadius: 6, fontSize: 12, textAlign: 'center', margin: '8px 0 0',
                          }}>
                            Ya te postulaste a este rubro
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>


              {/* Postular button */}
              <div style={{ paddingTop: 4 }}>
                {selected.userId === user?.id ? (
                  <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center', padding: 12 }}>
                    Es tu publicación
                  </p>
                ) : yaPostulado(selected.id) ? (
                  <p style={{
                    background: '#E8F5E9', color: '#2D6A4F',
                    padding: 12, borderRadius: 6, fontSize: 14, textAlign: 'center',
                  }}>
                    Ya te postulaste a esta subcontratación.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn-accent"
                    onClick={() => { setShowDetailModal(false); setShowApplyModal(true) }}
                    style={{ width: '100%' }}
                  >
                    Postularme
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Apply modal ── */}
      {showApplyModal && selected !== null && (
        <ApplyModal
          selected={{ id: selected.id, titulo: selected.title, startDate: selected.startDate, endDate: selected.endDate }}
          readOnlyDates
          onEnviar={(data) => { void handlePostular(data) }}
          onClose={() => { setShowApplyModal(false); setSelectedCategoryId(null) }}
          enviando={enviando}
        />
      )}

      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spin { animation: spin 0.8s linear infinite; }
        .sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
        .sc-card-wrapper { will-change: transform, opacity; }
        @media (max-width: 768px) { .sc-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .filter-bar-container { padding-left: 0 !important; padding-right: 16px !important; }
          .filter-bar-container .trabajos-filters-row { align-items: stretch; }
          .sc-grid { padding-left: 16px !important; padding-right: 16px !important; }
          .refresh-controls { display: none !important; }
        }
      `}</style>
    </div>
  )
}
