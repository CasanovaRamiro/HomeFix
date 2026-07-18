import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchAvailableBiddings } from '../services/posts'
import { applyToBidding } from '../services/applications'
import { useCategories } from '../hooks/useCategories'
import type { AvailableBiddingDTO } from '../services/posts'
import type { LocationFilter } from '../components/worker/types'
import CustomSelect from '../components/ui/CustomSelect'
import BiddingCard from '../components/worker/BiddingCard'
import LocationFilterModal from '../components/post/LocationFilterModal'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, GitBranch, RefreshCw, XCircle, CheckCircle,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'

const PAGE_SIZE = 8
const LOCATION_FILTER_KEY = 'homefix_location_filter'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatLastUpdate(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return 'recién'
  if (secs < 60) return `hace ${secs} seg`
  const mins = Math.floor(secs / 60)
  return `hace ${mins} min`
}

function loadStoredFilter(): LocationFilter | null {
  try {
    const raw = localStorage.getItem(LOCATION_FILTER_KEY)
    return raw ? JSON.parse(raw) as LocationFilter : null
  } catch {
    return null
  }
}

export default function WorkerAvailableBiddings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { categories } = useCategories()

  const [biddings, setBiddings] = useState<AvailableBiddingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [page, setPage] = useState(1)
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(loadStoredFilter)
  const [defaultCoords] = useState<{ lat: number; lng: number }>({ lat: -34.6037, lng: -58.3816 })
  const [showLocationModal, setShowLocationModal] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<AvailableBiddingDTO | null>(null)
  const [offeredCost, setOfferedCost] = useState('')
  const [offeredDuration, setOfferedDuration] = useState('')
  const [offeredStartDate, setOfferedStartDate] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [notificacion, setNotificacion] = useState<{ tipo: 'error' | 'success'; mensaje: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchAvailableBiddings()
      setBiddings(res.data)
    } catch {
      setBiddings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  const filtrados = useMemo(() => {
    let res = biddings
    if (category) {
      res = res.filter((b) => b.categories.some((c) => c.name === category))
    }
    if (locationFilter) {
      res = res.filter((b) => {
        if (b.latitude == null || b.longitude == null) return false
        const dist = haversineKm(locationFilter.lat, locationFilter.lng, b.latitude, b.longitude)
        return dist <= locationFilter.radius
      })
    }
    if (sortBy === 'reciente') {
      res = [...res].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      res = [...res].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    return res
  }, [biddings, category, sortBy, locationFilter])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginated = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [sortBy, category, locationFilter])

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  const handleLocationApply = (lat: number, lng: number, radius: number) => {
    const filter: LocationFilter = { lat, lng, radius }
    setLocationFilter(filter)
    localStorage.setItem(LOCATION_FILTER_KEY, JSON.stringify(filter))
    setShowLocationModal(false)
  }

  const handleLocationClear = () => {
    setLocationFilter(null)
    localStorage.removeItem(LOCATION_FILTER_KEY)
    setShowLocationModal(false)
  }

  const openApply = (bid: AvailableBiddingDTO) => {
    setSelected(bid)
    setOfferedCost('')
    setOfferedDuration('')
    setOfferedStartDate('')
    setMessage('')
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selected || !user) return
    setError('')
    setSuccess('')

    const cost = parseFloat(offeredCost)
    if (!cost || cost <= 0) { setError('Ingresá un costo ofertado válido'); return }
    const dur = parseInt(offeredDuration)
    if (!dur || dur <= 0) { setError('Ingresá una duración estimada válida'); return }
    if (offeredStartDate && new Date(offeredStartDate) <= new Date(selected.endDate)) {
      setError('La fecha de inicio debe ser posterior a la fecha tope de la licitación'); return
    }

    setSubmitting(true)
    try {
      await applyToBidding({
        postId: selected.id,
        offeredCost: cost,
        offeredDuration: dur,
        offeredStartDate: offeredStartDate || undefined,
        message: message || undefined,
      })
      setSuccess('Oferta enviada exitosamente')
      setBiddings((prev) =>
        prev.map((b) => (b.id === selected.id ? { ...b, hasApplied: true } : b))
      )
      setTimeout(() => setShowModal(false), 1500)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = e?.response?.data?.error || e?.message || 'Error al enviar la oferta'
      setError(msg)
      setNotificacion({ tipo: 'error', mensaje: msg })
      setTimeout(() => setNotificacion(null), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const modalInput = {
    width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.875rem',
    background: '#fff', color: '#0F172A',
    boxSizing: 'border-box' as const,
  }
  const modalLabel = { fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', marginBottom: '0.3rem', display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{
        background: '#0F172A',
        width: '100%', paddingTop: 40, paddingBottom: 48,
      }}>
        <div className="hf-container" style={{ padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/worker')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', padding: 0,
                color: '#94A3B8', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
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
                Licitaciones activas
              </h1>
            </div>
            <div className="refresh-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastUpdated && !loading && (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Actualizado {formatLastUpdate(lastUpdated)}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#E2E8F0', fontSize: 12, fontWeight: 600,
                  padding: '7px 14px', borderRadius: 8,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.6 : 1,
                  transition: 'background 0.15s', fontFamily: 'inherit',
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
                <strong style={{ color: '#fff' }}>{filtrados.length}</strong> licitaciones activas
                {category && (
                  <> &middot; <strong style={{ color: '#fff' }}>{category}</strong></>
                )}
                {locationFilter && (
                  <span> &middot; {locationFilter.radius} km a la redonda</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div className="filter-bar-container hf-container" style={{ padding: '16px 32px' }}>
          <div className="trabajos-filters-row">
            <div className="filter-group filter-category">
              <CustomSelect
                id="bid-category"
                label="Rubro"
                options={[
                  { value: '', label: 'Todos los rubros' },
                  ...categories.map((c) => ({ value: c.name, label: c.name })),
                ]}
                value={category}
                onChange={handleCategoryChange}
              />
            </div>

            <div className="filter-group filter-sort">
              <CustomSelect
                id="bid-sort"
                label="Orden"
                options={[
                  { value: 'reciente', label: 'Mas recientes' },
                  { value: 'antiguo', label: 'Mas antiguos' },
                ]}
                value={sortBy}
                onChange={(val) => setSortBy(val as 'reciente' | 'antiguo')}
              />
            </div>

            <div className="filter-group filter-location">
              <label>&nbsp;</label>
              <button
                type="button"
                className={`btn-filter-location ${locationFilter ? 'active' : ''}`}
                onClick={() => setShowLocationModal(true)}
              >
                {locationFilter ? `${locationFilter.radius} km` : 'Filtrar por ubicación'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error !== '' && (
        <div className="hf-container" style={{ margin: '12px auto 0', padding: '0 32px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#DC2626', fontSize: 14 }}>&#9888;</span>
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
          {notificacion.tipo === 'error'
            ? <XCircle size={20} color="#DC2626" />
            : <CheckCircle size={20} color="#059669" />
          }
          <span style={{ fontSize: 14, fontWeight: 500, color: notificacion.tipo === 'error' ? '#991B1B' : '#065F46' }}>
            {notificacion.mensaje}
          </span>
        </div>
      )}

      <div className="hf-container" style={{ margin: '28px auto 0', padding: '0 32px 3rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #E2E8F0',
              borderTopColor: '#3B82F6', borderRadius: '50%',
              margin: '0 auto', animation: 'spin 0.7s linear infinite',
            }} />
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 16 }}>Cargando licitaciones…</p>
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#fff' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#EFF6FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <GitBranch size={24} color="#3B82F6" />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: '1.1rem', color: '#0F172A', fontWeight: 600 }}>
              No hay licitaciones activas
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {locationFilter
                ? 'No hay licitaciones dentro del área seleccionada. Probá con un radio mayor o desactivá el filtro.'
                : 'No hay licitaciones activas en este momento. Volvé más tarde para ver nuevas oportunidades.'}
            </p>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginBottom: 12,
          }}>
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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
            <div className="sc-grid">
              {paginated.map((bid, idx) => (
                <div key={bid.id} className="sc-card-wrapper" style={{ animation: `fadeInUp 0.35s ease-out ${idx * 0.06}s both` }}>
                  <BiddingCard
                    bidding={bid}
                    onClick={() => navigate(`/worker/biddings/${bid.id}`)}
                    onOfertar={() => openApply(bid)}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginTop: 24, paddingBottom: 8,
              }}>
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: p === page ? '1.5px solid #3B82F6' : '1.5px solid #E2E8F0',
                        background: p === page ? '#3B82F6' : '#fff',
                        color: p === page ? '#fff' : '#475569',
                        fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { if (p !== page) { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLElement).style.color = '#0F172A' } }}
                      onMouseLeave={(e) => { if (p !== page) { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#475569' } }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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

      {showModal && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '2rem',
            width: '90%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Enviar oferta</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#0F172A', marginBottom: '0.25rem' }}>
              {selected.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Cliente: {selected.client.name} {selected.client.surname}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={modalLabel}>Costo ofertado ($) *</label>
              <input style={modalInput} type="number" placeholder="Ej: 250000" value={offeredCost}
                onChange={(e) => setOfferedCost(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={modalLabel}>Duración estimada (días) *</label>
              <input style={modalInput} type="number" placeholder="Ej: 15" value={offeredDuration}
                onChange={(e) => setOfferedDuration(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={modalLabel}>Fecha de inicio estimada</label>
              <input style={modalInput} type="date" value={offeredStartDate}
                onChange={(e) => setOfferedStartDate(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={modalLabel}>Mensaje al cliente</label>
              <textarea style={{ ...modalInput, minHeight: '80px', resize: 'vertical' }} placeholder="Contá por qué te gustaría tomar este trabajo..."
                value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {error && <div style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{error}</div>}
            {success && <div style={{ color: '#16a34a', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{success}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', background: 'transparent', color: '#0F172A',
                  border: '1px solid #E2E8F0', fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: '#3B82F6', color: '#fff',
                  border: 'none', opacity: submitting ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {submitting ? 'Enviando...' : 'Enviar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

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
