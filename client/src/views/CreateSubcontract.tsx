import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, ArrowLeft, Plus, Trash2, Loader } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useCategories } from '../hooks/useCategories'
import { useCreateSubcontract } from '../hooks/useCreateSubcontract'
import { fetchPostById } from '../services/posts'
import type { Post } from '../types/post'
import SuccessScreen from '../components/post/SuccessScreen'
import SubmitButton from '../components/ui/SubmitButton'

export default function CreateSubcontract() {
  const navigate = useNavigate()
  const location = useLocation()
  const { parentPostId } = (location.state as { parentPostId?: string }) || {}
  const theme = useTheme()
  const { categories, loading: loadingCategories } = useCategories()

  const [parentPost, setParentPost] = useState<Post | null>(null)
  const [loadingParent, setLoadingParent] = useState(!!parentPostId)

  const {
    form, setForm, formError, formSubmitting, formSuccess,
    setPrefill,
    addPosition, removePosition, updatePosition, handleSubmit,
  } = useCreateSubcontract(parentPostId)

  useEffect(() => {
    if (parentPostId) {
      fetchPostById(parentPostId)
        .then(res => {
          setParentPost(res.data)
          setPrefill(res.data)
        })
        .catch(() => setParentPost(null))
        .finally(() => setLoadingParent(false))
    }
  }, [parentPostId, setPrefill])

  const s = {
    main: { minHeight: '100vh', background: theme.background },
    wrapper: { maxWidth: '720px', margin: '0 auto', padding: '64px 16px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: theme.card, border: `1px solid ${theme.border}`, fontSize: '14px' },
    badgeIcon: { width: '16px', height: '16px', color: theme.accent },
    badgeText: { color: theme.muted },
    h1: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textWrap: 'balance' as const },
    desc: { fontSize: '18px', color: theme.muted, maxWidth: '560px', margin: '0 auto', textWrap: 'balance' as const },
    formCard: { borderRadius: '16px', padding: 'clamp(24px, 4vw, 40px)', background: theme.card, border: `1px solid ${theme.border}` },
    formLabel: { fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' },
    formInput: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const },
    formSelect: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const, cursor: 'pointer' },
    formTextarea: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', resize: 'none' as const, boxSizing: 'border-box' as const },
    errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
  }

  return (
    <main style={s.main}>
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '16px 2rem 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: theme.muted, padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', transition: 'color 0.15s, background 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Volver
        </button>
      </div>
      <div style={s.wrapper}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={s.badge}>
              <Users style={s.badgeIcon} />
              <span style={s.badgeText}>Subcontratación</span>
            </div>
          </div>
          <h1 style={{ ...s.h1, marginBottom: '16px' }}>Crear Subcontratación</h1>
          <p style={s.desc}>
            {parentPostId
              ? 'Completá los datos de la subcontratación. Los campos se pre-rellenan con la información del trabajo original.'
              : 'Creá una subcontratación para buscar otros profesionales.'}
          </p>
        </div>

        <div style={s.formCard}>
          {formSuccess ? (
            <SuccessScreen onGoHome={() => navigate('/worker/my-applications')}>
              ¡Subcontratación creada con éxito!
            </SuccessScreen>
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{formError}</div>}

              {loadingParent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: theme.hover, color: theme.muted, fontSize: '14px', marginBottom: '24px' }}>
                  <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Cargando datos del trabajo original...
                </div>
              )}

              {parentPost && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: theme.hover, border: `1px solid ${theme.border}`, marginBottom: '24px', fontSize: '13px', color: theme.muted }}>
                  Vinculado a: <strong style={{ color: theme.primaryDark }}>{parentPost.title}</strong>
                  <span style={{ fontSize: '12px', fontStyle: 'italic', marginLeft: '8px' }}>— Podés editar todos los campos</span>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Título del servicio"
                  required
                  style={s.formInput}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describí el servicio a subcontratar..."
                  required
                  rows={4}
                  style={s.formTextarea}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={s.formLabel}>Fecha de inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    required
                    style={s.formInput}
                  />
                </div>
                <div>
                  <label style={s.formLabel}>Fecha de finalización</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    required
                    style={s.formInput}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Dirección del servicio"
                  required
                  style={s.formInput}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Posiciones requeridas</label>
                {form.positions.map((pos, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      marginBottom: '12px',
                      background: theme.background,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: theme.muted }}>Posición {index + 1}</span>
                      {form.positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePosition(index)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.danger, padding: '4px' }}
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: theme.muted, display: 'block', marginBottom: '4px' }}>Categoría</label>
                      <select
                        value={pos.categoryId}
                        onChange={e => updatePosition(index, 'categoryId', e.target.value)}
                        required
                        style={s.formSelect}
                        disabled={loadingCategories}
                      >
                        <option value="">
                          {loadingCategories ? 'Cargando...' : 'Seleccioná una categoría'}
                        </option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: theme.muted, display: 'block', marginBottom: '4px' }}>Cantidad de personas</label>
                      <input
                        type="number"
                        min={1}
                        value={pos.quantity}
                        onChange={e => updatePosition(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        required
                        style={s.formInput}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', color: theme.muted, display: 'block', marginBottom: '4px' }}>Descripción del rol</label>
                      <textarea
                        value={pos.roleDescription}
                        onChange={e => updatePosition(index, 'roleDescription', e.target.value)}
                        placeholder="Ej: Albañilería general, colocación de cerámicos"
                        required
                        rows={2}
                        style={s.formTextarea}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPosition}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 500, border: `1px dashed ${theme.border}`,
                    background: 'transparent', color: theme.accent, cursor: 'pointer',
                    transition: 'all 0.15s', width: '100%', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.hover }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Agregar posición
                </button>
              </div>

              <SubmitButton loading={formSubmitting} loadingText="Creando subcontratación...">
                Crear subcontratación
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
