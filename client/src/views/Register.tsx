import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import api from '../services/api'

type RegisterResponse = {
  userId: string
  email: string
  emailVerified: boolean
  message: string
}

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      }

      const { data } = await api.post<RegisterResponse>('/auth/register', payload)
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
      <form className="card" onSubmit={handleSubmit}>
        <h2>Crear cuenta</h2>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: '#059669', fontSize: 13 }}>{success}</p>}
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
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}</button>
        <p className="hint">Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link></p>
      </form>
    </div>
  )
}
