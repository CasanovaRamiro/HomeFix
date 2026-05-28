import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ChangeEvent } from 'react'
import api from '../services/api'
import { useCategories } from '../hooks/useCategories'

type RegisterResponse = {
  userId: string
  email: string
  emailVerified: boolean
  message: string
}

export default function RegisterWorker() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { categories, loading: loadingCategories } = useCategories()

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const handleNext = () => {
    setError('')
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (selectedCategories.length === 0) {
      setError('Debes seleccionar al menos una especialidad')
      return
    }

    try {
      setIsSubmitting(true)
      const { data } = await api.post<RegisterResponse>('/auth/register/worker', {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        categories: selectedCategories,
      })
      setSuccess(data.message || 'Registro exitoso. Ahora puedes iniciar sesion.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'No se pudo completar el registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={(e) => e.preventDefault()}>
        <h2>Crear cuenta</h2>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: '#059669', fontSize: 13 }}>{success}</p>}

        {step === 1 && (
          <>
            <input type="text" placeholder="Nombre" value={form.name} onChange={set('name')} required />
            <input type="text" placeholder="Apellido" value={form.lastName} onChange={set('lastName')} />
            <input type="email" placeholder="Correo" value={form.email} onChange={set('email')} required />
            <input type="password" placeholder="Contrasena" value={form.password} onChange={set('password')} required />
            <input
              type="password"
              placeholder="Confirmar contrasena"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              required
            />
            <input type="tel" placeholder="Telefono (opcional)" value={form.phone} onChange={set('phone')} />
            <button type="button" onClick={handleNext}>Continuar</button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Selecciona tus especialidades:</p>
            {loadingCategories ? (
              <p style={{ fontSize: 13, color: '#6B7280' }}>Cargando categorias...</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${selectedCategories.includes(cat.name) ? '#10B981' : '#ddd'}`,
                      background: selectedCategories.includes(cat.name) ? '#ECFDF5' : '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#111111',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1 }}>Atras</button>
              <button type="button" onClick={() => { void handleSubmit() }} disabled={isSubmitting} style={{ flex: 1 }}>
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </>
        )}

        <p className="hint">Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link></p>
      </form>
    </div>
  )
}
