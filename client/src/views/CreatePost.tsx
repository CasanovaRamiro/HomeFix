import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, CheckCircle } from 'lucide-react'
import api from '../services/api'

interface Category {
  id: number
  name: string
}

const theme = {
  primaryDark: '#0F172A',
  accent: '#10B981',
  accentHover: '#059669',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  danger: '#EF4444',
}

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
  submitBtn: { width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF', transition: 'all 0.3s' },
  errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
  successIcon: { width: '40px', height: '40px', color: theme.accent },
}

export default function CrearPublicacion() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ title: '', categoryId: '', description: '', startDate: '', endDate: '', address: '' })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Category[]>('/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => setFormError('Error al cargar categorías'))
      .finally(() => setLoadingCategories(false))
  }, [])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = theme.accent
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = theme.border
    e.target.style.boxShadow = 'none'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim() || !form.categoryId || !form.description.trim() || !form.startDate || !form.endDate || !form.address.trim()) {
      setFormError('Todos los campos son obligatorios'); return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio'); return
    }

    setFormSubmitting(true)
    try {
      await api.post('/posts/create', {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        address: form.address,
        categoryId: Number(form.categoryId),
      })
      setFormSuccess(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setFormError(axiosErr.response?.data?.error ?? 'Error al publicar la solicitud')
    } finally { setFormSubmitting(false) }
  }

  return (
    <main style={s.main}>
      <div style={s.wrapper}>
        {/* Header */}
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

        {/* Form Card */}
        <div style={s.formCard}>
          {formSuccess ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle style={s.successIcon} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: theme.primaryDark, marginBottom: '8px' }}>¡Solicitud publicada con éxito!</h2>
              <p style={{ color: theme.muted, marginBottom: '24px' }}>Pronto recibirás respuestas de profesionales cercanos.</p>
              <button
                onClick={() => navigate('/')}
                style={s.submitBtn}
                onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{formError}</div>}

              {/* Title */}
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

              {/* Category */}
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

              {/* Description */}
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

              {/* Dates */}
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

              {/* Address */}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={formSubmitting}
                style={{ ...s.submitBtn, opacity: formSubmitting ? 0.5 : 1 }}
                onMouseEnter={e => { if (!formSubmitting) { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
              >
                {formSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    Publicando...
                  </span>
                ) : 'Publicar solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
