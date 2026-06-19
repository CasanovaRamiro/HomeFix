import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Users, GitBranch, X, Loader } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useSubcontractDetail } from '../hooks/useSubcontractDetail'
import { useAuth } from '../hooks/useAuth'
import StarRating from '../components/ui/StarRating'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function SubcontractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const { subcontract, loading, error } = useSubcontractDetail(id)
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const s = {
    main: { minHeight: '100vh', background: theme.background },
    wrapper: { maxWidth: '720px', margin: '0 auto', padding: '64px 16px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: theme.card, border: `1px solid ${theme.border}`, fontSize: '14px' },
    badgeIcon: { width: '16px', height: '16px', color: theme.accent },
    badgeText: { color: theme.muted },
    h1: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textWrap: 'balance' as const },
    desc: { fontSize: '18px', color: theme.muted, maxWidth: '560px', margin: '0 auto', textWrap: 'balance' as const },
    card: { borderRadius: '16px', padding: 'clamp(24px, 4vw, 40px)', background: theme.card, border: `1px solid ${theme.border}` },
    sectionTitle: { fontSize: '14px', fontWeight: 600, color: theme.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '16px' },
    labelSmall: { fontSize: '13px', color: theme.muted, display: 'block', marginBottom: '8px' },
    textBody: { fontSize: '14px', color: theme.primaryDark, lineHeight: '1.7' },
    textBold: { fontSize: '14px', fontWeight: 600, color: theme.primaryDark },
    errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
    box: { borderRadius: '12px', padding: '16px', background: theme.background, border: `1px solid ${theme.border}` },
    btnPrimary: { padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: theme.accent, color: '#fff', transition: 'background 0.15s' },
    btnGhost: { padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'transparent', color: theme.muted, transition: 'color 0.15s, background 0.15s' },
  }

  if (loading) {
    return (
      <main style={s.main}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader size={32} style={{ animation: 'spin 0.7s linear infinite', color: theme.accent }} />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main style={s.main}>
        <div style={s.wrapper}>
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => navigate('/worker/available-subcontracts')}
              style={s.btnGhost}
              onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
              onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
            >
              <ArrowLeft style={{ width: '18px', height: '18px', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Volver a Subcontrataciones
            </button>
          </div>
          <div style={s.errorBox}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!subcontract) return null

  const totalVacantes = subcontract.categories.reduce(
    (acc, c) => acc + (c.quantity - c.filledCount), 0,
  )

  return (
    <main style={s.main}>
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
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/worker/available-subcontracts')}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
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
                {subcontract.title}
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '2px 0 0' }}>
                Subcontrato
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={s.wrapper}>

        {/* Creator */}
        <div style={{ ...s.card, marginBottom: '24px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#EEF2FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#4F46E5', flexShrink: 0,
              }}>
                {subcontract.user?.name?.charAt(0).toUpperCase() ?? 'T'}
              </div>
              <div>
                <p style={{ fontSize: '13px', color: theme.muted, margin: '0 0 2px' }}>Creado por</p>
                <p style={{ fontWeight: 600, color: theme.primaryDark, margin: 0 }}>
                  {subcontract.user?.name ?? ''} {subcontract.user?.surname ?? ''}
                </p>
                {subcontract.workerRating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <StarRating rating={subcontract.workerRating} />
                    <span style={{ fontSize: '12px', color: theme.muted }}>{subcontract.workerRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
            >
              Ver perfil
            </button>
          </div>
        </div>

        {/* Original client (only if linked) */}
        {subcontract.parentPostId && (
          <div style={{ ...s.card, marginBottom: '24px', padding: '20px 24px' }}>
            <p style={s.sectionTitle}>Cliente original</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#FEF3C7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#D97706', flexShrink: 0,
                }}>
                  {subcontract.parentUser?.name?.charAt(0).toUpperCase() ?? 'C'}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: theme.primaryDark, margin: '0 0 4px' }}>
                    {subcontract.parentUser?.name ?? 'Cliente'} {subcontract.parentUser?.surname ?? ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StarRating rating={subcontract.clientRating} />
                    <span style={{ fontSize: '12px', color: theme.muted }}>
                      {subcontract.clientRating > 0
                        ? subcontract.clientRating.toFixed(1)
                        : 'Sin reseñas'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted,
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
              >
                Ver perfil
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ ...s.card, marginBottom: '24px' }}>
          <p style={s.sectionTitle}>Descripción</p>
          <p style={s.textBody}>{subcontract.description}</p>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={s.box}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Calendar size={16} color={theme.muted} />
              <span style={s.labelSmall}>Fecha del servicio</span>
            </div>
            <p style={s.textBold}>
              {formatDate(subcontract.startDate)} — {formatDate(subcontract.endDate)}
            </p>
          </div>

          <div style={s.box}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <MapPin size={16} color={theme.muted} />
              <span style={s.labelSmall}>Ubicación</span>
            </div>
            <p style={s.textBold}>{subcontract.address}</p>
          </div>
        </div>

        {/* Vacancies */}
        <div style={{ ...s.card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color={theme.accent} />
              <p style={{ ...s.sectionTitle, margin: 0 }}>Vacantes</p>
            </div>
            {totalVacantes > 0 && (
              <span style={{
                padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                background: '#ECFDF5', color: '#059669',
              }}>
                {totalVacantes} disponible{totalVacantes !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {subcontract.categories.length === 0 ? (
            <p style={{ fontSize: '14px', color: theme.muted }}>Sin posiciones especificadas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subcontract.categories.map((cat, i) => {
                const needed = cat.quantity - cat.filledCount
                return (
                  <div key={i} style={s.box}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ ...s.textBold, margin: 0 }}>{cat.name}</p>
                      <span style={{
                        padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                        background: needed > 0 ? '#ECFDF5' : '#F1F5F9',
                        color: needed > 0 ? '#059669' : '#94A3B8',
                      }}>
                        {needed > 0 ? `${needed} vacante${needed !== 1 ? 's' : ''}` : 'Completo'}
                      </span>
                    </div>
                    {cat.roleDescription && (
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: theme.muted }}>
                        Rol: {cat.roleDescription}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                      {cat.filledCount} de {cat.quantity} cubierto{cat.filledCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Apply button */}
        <div style={{ paddingTop: '8px', paddingBottom: '32px' }}>
          {subcontract?.userId === user?.id ? (
            <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center', padding: 12 }}>
              Es tu publicación
            </p>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              style={s.btnPrimary}
              onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.accent }}
            >
              Postularme
            </button>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', padding: '0 16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '480px', borderRadius: '16px',
              background: theme.card, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.border}`, padding: '20px 24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: theme.primaryDark, margin: 0 }}>
                Postularte
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px', borderRadius: '8px', color: theme.muted,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = theme.hover; e.currentTarget.style.color = theme.primaryDark }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.muted }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: theme.muted }}>
                Postularte a: <span style={{ fontWeight: 600, color: theme.primaryDark }}>{subcontract.title}</span>
              </p>

              <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>
                Mensaje para el contratista (opcional)
              </label>
              <textarea
                rows={4}
                placeholder="Presentate brevemente..."
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px',
                  outline: 'none', border: `1px solid ${theme.border}`,
                  background: theme.background, color: theme.primaryDark,
                  transition: 'all 0.3s', resize: 'none', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                    border: 'none', cursor: 'pointer', background: theme.hover, color: theme.primaryDark,
                    transition: 'background 0.15s',
                  }}
                >
                  Cancelar
                </button>
                <button
                  style={{
                    padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                    border: 'none', cursor: 'pointer', background: theme.accent, color: '#fff',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent }}
                >
                  Enviar postulación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}