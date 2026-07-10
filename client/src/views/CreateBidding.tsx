import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, ArrowLeft, ArrowUp, ArrowDown, Clock, DollarSign, Star, Calendar, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useCategories } from '../hooks/useCategories'
import { createBidding } from '../services/posts'
import { uploadImages } from '../services/upload'
import SuccessScreen from '../components/post/SuccessScreen'
import SubmitButton from '../components/ui/SubmitButton'
import AddressAutocomplete from '../components/ui/AddressAutocomplete'
import FileUpload from '../components/ui/FileUpload'

interface WeightVariable {
  key: string
  label: string
  icon: typeof DollarSign
}

const DEFAULT_VARIABLES: WeightVariable[] = [
  { key: 'offeredCost', label: 'Costo', icon: DollarSign },
  { key: 'duration', label: 'Duración', icon: Clock },
  { key: 'startDate', label: 'Fecha de inicio', icon: Calendar },
  { key: 'minRating', label: 'Calificación del licitante', icon: Star },
]

export default function CreateBidding() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { categories, loading: loadingCategories } = useCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [endDate, setEndDate] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [materialResponsibility, setMaterialResponsibility] = useState('to_agree')
  const [files, setFiles] = useState<File[]>([])
  const [weights, setWeights] = useState(DEFAULT_VARIABLES)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const moveWeight = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= weights.length) return
    const next = [...weights]
    ;[next[index], next[target]] = [next[target], next[index]]
    setWeights(next)
  }

  const addCategory = (id: string) => {
    if (!selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds([...selectedCategoryIds, id])
    }
  }

  const removeCategory = (id: string) => {
    setSelectedCategoryIds(selectedCategoryIds.filter(c => c !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('El título es obligatorio'); return }
    if (selectedCategoryIds.length === 0) { setError('Agregá al menos una categoría'); return }
    if (!endDate) { setError('La fecha de finalización es obligatoria'); return }
    if (!address.trim()) { setError('La dirección es obligatoria'); return }

    setSubmitting(true)
    try {
      let imageUrls: string[] = []
      if (files.length > 0) {
        imageUrls = await uploadImages(files)
      }

      await createBidding({
        title: title.trim(),
        description: description.trim(),
        categoryIds: selectedCategoryIds,
        endDate,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        address: address.trim(),
        latitude,
        longitude,
        materialResponsibility,
        imageUrls,
        bidWeights: JSON.stringify(weights.map(w => w.key)),
      })
      setSuccess(true)
    } catch {
      setError('Error al crear la licitación. Intentalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (success) {
    return (
      <main style={s.main}>
        <div style={s.wrapper}>
          <SuccessScreen onGoHome={() => navigate('/client/biddings')}>
            ¡Licitación creada con éxito!
          </SuccessScreen>
        </div>
      </main>
    )
  }

  const selectedCategories = categories.filter(c => selectedCategoryIds.includes(c.id))

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
              <Gavel style={s.badgeIcon} />
              <span style={s.badgeText}>Licitación</span>
            </div>
          </div>
          <h1 style={{ ...s.h1, marginBottom: '16px' }}>Nueva Licitación</h1>
          <p style={s.desc}>
            Publicá una licitación para que los profesionales envíen sus ofertas. Definí el orden de prioridad de las variables de evaluación.
          </p>
        </div>

        <div style={s.formCard}>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{error}</div>}

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la licitación" required style={s.formInput} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describí el trabajo a realizar..." required rows={4} style={s.formTextarea} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Categorías</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  style={s.formSelect}
                  value=""
                  onChange={e => { if (e.target.value) addCategory(e.target.value) }}
                  disabled={loadingCategories}
                >
                  <option value="">{loadingCategories ? 'Cargando...' : 'Seleccioná una categoría'}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} disabled={selectedCategoryIds.includes(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedCategories.map(c => (
                    <span key={c.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                      background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
                    }}>
                      {c.name}
                      <button type="button" onClick={() => removeCategory(c.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065F46', padding: 0, lineHeight: 1 }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Fecha tope para ofertar</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={s.formInput} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Presupuesto estimado ($)</label>
              <input type="number" min={0} value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="Opcional" style={s.formInput} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Dirección</label>
              <AddressAutocomplete
                value={address}
                onChange={(addr, lat, lng) => { setAddress(addr); setLatitude(lat); setLongitude(lng) }}
              />
              {latitude && longitude && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: theme.accent }}>✓ Ubicación confirmada</p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Responsable de materiales</label>
              <select value={materialResponsibility} onChange={e => setMaterialResponsibility(e.target.value)} style={s.formSelect}>
                <option value="client">Cliente</option>
                <option value="licitator">Licitador (profesional)</option>
                <option value="to_agree">A convenir</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Imágenes</label>
              <FileUpload files={files} onFilesChange={setFiles} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={s.formLabel}>Orden de prioridad para evaluar ofertas</label>
              <p style={{ fontSize: '13px', color: theme.muted, marginBottom: '12px' }}>
                Ordená las variables según su importancia. La más importante primero.
              </p>
              {weights.map((v, i) => {
                const Icon = v.icon
                return (
                  <div key={v.key} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', marginBottom: '8px',
                    borderRadius: '12px', border: `1px solid ${theme.border}`,
                    background: theme.background,
                  }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: theme.accent, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <Icon size={18} style={{ color: theme.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: theme.primaryDark }}>
                      {v.label}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => moveWeight(i, -1)} disabled={i === 0}
                        style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, color: theme.muted }}>
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveWeight(i, 1)} disabled={i === weights.length - 1}
                        style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px', cursor: i === weights.length - 1 ? 'not-allowed' : 'pointer', opacity: i === weights.length - 1 ? 0.3 : 1, color: theme.muted }}>
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              <details style={{ marginTop: '8px', fontSize: '13px', color: theme.muted }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500 }}>¿Cómo se calcula el puntaje?</summary>
                <div style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: theme.hover, lineHeight: 1.6 }}>
                  Cada oferta recibe un ranking por variable según su valor. El puntaje final se calcula con estos multiplicadores según la posición:
                  <br /><strong>1°</strong> ×2.5 &nbsp; <strong>2°</strong> ×1.8 &nbsp; <strong>3°</strong> ×1.5 &nbsp; <strong>4°</strong> ×1.0
                  <br />Menor puntaje = mejor oferta.
                </div>
              </details>
            </div>

            <SubmitButton loading={submitting} loadingText="Creando licitación...">
              Crear Licitación
            </SubmitButton>
          </form>
        </div>
      </div>
    </main>
  )
}
