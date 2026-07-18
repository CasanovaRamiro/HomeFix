import { useEffect, type JSX } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useCategories } from '../../hooks/useCategories'
import { useCreateEmergency } from '../../hooks/useCreateEmergency'
import AddressAutocomplete from '../ui/AddressAutocomplete'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EmergencyModal({ userId, onClose, onSuccess }: Props): JSX.Element {
  const theme = useTheme()
  const { categories, loading: loadingCategories } = useCategories()
  const { form, setForm, loading, error, success, handleSubmit } = useCreateEmergency(userId)

  useEffect(() => {
    if (success) onSuccess()
  }, [success, onSuccess])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    border: `1px solid ${theme.border}`,
    background: theme.background,
    color: theme.primaryDark,
    transition: 'all 0.3s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: theme.primaryDark,
    display: 'block',
    marginBottom: '8px',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}

    >
      <div
        style={{
          width: '100%', maxWidth: '480px',
          borderRadius: '16px', background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '32px', position: 'relative',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: theme.muted, padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#FEF2F2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={20} style={{ color: '#DC2626' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: theme.primaryDark, margin: 0 }}>
              Emergencia
            </h2>
            <p style={{ fontSize: '13px', color: theme.muted, margin: '4px 0 0' }}>
              Completá los datos para recibir ayuda urgente
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
            background: '#FEF2F2', color: theme.danger,
            border: '1px solid #FECACA', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Título</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Ej: Se inundó el baño"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Categoría</label>
          <select
            value={form.categoryId}
            onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
            required
            style={{ ...inputStyle, cursor: 'pointer' }}
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

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Describí tu emergencia..."
            required
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Dirección</label>
          <AddressAutocomplete
            value={form.address}
            onChange={(address, lat, lng) => setForm(p => ({ ...p, address, latitude: lat, longitude: lng }))}
          />
          {form.latitude && form.longitude && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: theme.accent }}>
              ✓ Ubicación confirmada
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600, fontSize: '15px',
              border: `1px solid ${theme.border}`, cursor: 'pointer',
              background: theme.background, color: theme.muted,
              transition: 'all 0.2s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600, fontSize: '15px',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: '#DC2626', color: '#FFFFFF', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Enviando...
              </span>
            ) : (
              'Solicitar ayuda urgente'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
