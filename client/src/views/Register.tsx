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

  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  })

  const validatePassword = (password: string) => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm({ ...form, [field]: value })
    if (field === 'password') {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!Object.values(validations).every(Boolean)) {
      setError('La contraseña no cumple con todos los requisitos')
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
        
        <ul className="validation-list">
          <li className={`validation-item ${validations.length ? 'valid' : ''}`}>Al menos 8 caracteres</li>
          <li className={`validation-item ${validations.upper ? 'valid' : ''}`}>Al menos una mayuscula</li>
          <li className={`validation-item ${validations.lower ? 'valid' : ''}`}>Al menos una minuscula</li>
          <li className={`validation-item ${validations.number ? 'valid' : ''}`}>Al menos un numero</li>
          <li className={`validation-item ${validations.special ? 'valid' : ''}`}>Al menos un caracter especial</li>
        </ul>

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
