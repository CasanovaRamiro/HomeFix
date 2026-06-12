import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ArrowLeft, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { fetchAvailableSubcontracts } from '../services/posts'
import type { AvailableSubcontractDTO } from '../types/post'
import SubcontractCard from '../components/worker/SubcontractCard'
import LandingFooter from '../components/landing/LandingFooter'

const PAGE_SIZE = 8

export default function AvailableSubcontracts() {
  const navigate = useNavigate()
  const [subcontratos, setSubcontratos] = useState<AvailableSubcontractDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo'>('reciente')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchAvailableSubcontracts()
      .then((res) => {
        setSubcontratos(res.data)
      })
      .catch((err) => {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        setError(axiosErr.response?.data?.error ?? 'No se pudieron cargar los subcontratos')
        setSubcontratos([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtrados = useMemo(() => {
    let resultado = [...subcontratos]

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
  }, [subcontratos, searchQuery, sortBy])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleSortChange = (value: 'reciente' | 'antiguo') => {
    setSortBy(value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginated = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalVacantes = subcontratos.reduce(
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/worker')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.08)', border: 'none', padding: '6px 12px',
                borderRadius: 8, color: '#94A3B8', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>

          <div className="sc-hero" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              }}
            >
              <GitBranch size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Subcontrataciones disponibles
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '2px 0 0' }}>
                {loading ? (
                  'Cargando…'
                ) : (
                  <>
                    <strong style={{ color: '#fff' }}>{filtrados.length}</strong> subcontrataciones activas
                    {!loading && totalVacantes > 0 && (
                      <> &middot; <strong style={{ color: '#93C5FD' }}>{totalVacantes}</strong> vacantes totales</>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div
        style={{
          background: '#fff', borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px' }}>
          <div className="sc-filters-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label htmlFor="sc-search" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                <Search size={12} style={{ display: 'inline', marginRight: 4 }} />
                Buscar
              </label>
              <input
                id="sc-search"
                type="search"
                placeholder="Subcontrato, categoría..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  fontSize: 14, outline: 'none', width: '100%',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6' }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0' }}
              />
            </div>
            <div>
              <label htmlFor="sc-sort" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                <SlidersHorizontal size={12} style={{ display: 'inline', marginRight: 4 }} />
                Orden
              </label>
              <select
                id="sc-sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'reciente' | 'antiguo')}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  fontSize: 14, outline: 'none', background: '#fff',
                  transition: 'border-color 0.15s', cursor: 'pointer',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6' }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0' }}
              >
                <option value="reciente">Más recientes</option>
                <option value="antiguo">Más antiguos</option>
              </select>
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

        {!loading && paginated.length > 0 && (
          <>
            <div className="sc-grid" style={{ marginBottom: totalPages > 1 ? 24 : 0 }}>
              {paginated.map((sub, idx) => (
                <div key={sub.id} className="sc-card-wrapper" style={{ animation: `fadeInUp 0.35s ease-out ${idx * 0.06}s both` }}>
                  <SubcontractCard
                    subcontract={sub}
                    onClick={() => navigate(`/posts/${sub.id}`)}
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

      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
        .sc-card-wrapper { will-change: transform, opacity; }
        @media (max-width: 768px) { .sc-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .sc-filters-row { flex-direction: column; }
          .sc-filters-row > div:first-child { min-width: 0; width: 100%; }
          .sc-hero { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
      `}</style>
    </div>
  )
}
