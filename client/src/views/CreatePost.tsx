import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useCategories } from '../hooks/useCategories'
import { useCreatePost } from '../hooks/useCreatePost'
import SuccessScreen from '../components/SuccessScreen'
import SubmitButton from '../components/SubmitButton'

export default function CrearPublicacion() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { categories, loading: loadingCategories } = useCategories()
  const { form, setForm, formError, formSubmitting, formSuccess, handleFocus, handleBlur, handleSubmit } = useCreatePost()

  const s = {
    main: { minHeight: '100vh', background: theme.background },
    wrapper: { maxWidth: '720px', margin: '0 auto', padding: '64px 16px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: theme.card, border: `1px solid ${theme.border}`, fontSize: '14px' },
    badgeIcon: { width: '16px', height: '16px', color: theme.accent },
    badgeText: { color: theme.muted },
    h1: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textWrap: 'balance' as const },
    desc: { fontSize: '18px', color: theme.muted, maxWidth: '560px', margin: '0 auto', textWrap: 'balance' as const },
    formCard: { borderRadius: '16px', padding: '40px', background: theme.card, border: `1px solid ${theme.border}` },
    formLabel: { fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' },
    formInput: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const },
    formSelect: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const, cursor: 'pointer' },
    formTextarea: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', resize: 'none' as const, boxSizing: 'border-box' as const },
    errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
  }

  return (
    <main style={s.main}>
      <div style={s.wrapper}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={s.badge}>
              <FileText style={s.badgeIcon} />
              <span style={s.badgeText}>Nueva Publicación</span>
            </div>
          </div>
          <h1 style={{ ...s.h1, marginBottom: '16px' }}>Crear Publicación</h1>
          <p style={s.desc}>
            Completá los datos para publicar tu problema y recibir respuestas de profesionales cercanos.
          </p>
        </div>

        <div style={s.formCard}>
          {formSuccess ? (
            <SuccessScreen onGoHome={() => navigate('/')} />
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{formError}</div>}

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Título del problema</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Se rompió la canilla de la cocina"
                  required
                  style={s.formInput}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Categoría</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  required
                  style={s.formSelect}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Cargando categorías...' : 'Seleccioná una categoría'}
                  </option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={s.formLabel}>Descripción del problema</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describí tu problema en detalle..."
                  required
                  rows={4}
                  style={s.formTextarea}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                    onFocus={handleFocus}
                    onBlur={handleBlur}
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
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={s.formLabel}>Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Ingresá tu dirección"
                  required
                  style={s.formInput}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <SubmitButton loading={formSubmitting} loadingText="Publicando...">
                Publicar solicitud
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
