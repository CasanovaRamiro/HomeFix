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
    <div className="min-h-screen flex items-center justify-center">
      <form className="bg-card border border-border rounded-lg p-8 w-full max-w-[360px] flex flex-col gap-3" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold">Crear cuenta</h2>
        {error && <p className="text-danger text-[13px]">{error}</p>}
        {success && <p className="text-secondary-hover text-[13px]">{success}</p>}
        <input type="text" placeholder="Nombre" value={form.name} onChange={set('name')} required />
        <input type="text" placeholder="Apellido" value={form.lastName} onChange={set('lastName')} />
        <input type="email" placeholder="Correo" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Contrasena" value={form.password} onChange={set('password')} required />
        
        <ul className="list-none p-0 my-2.5 text-xs">
          <li className={`flex items-center gap-2 mb-1 ${validations.length ? 'text-secondary-hover' : 'text-danger'}`}>
            <span>{validations.length ? '✓' : '✕'}</span> Al menos 8 caracteres
          </li>
          <li className={`flex items-center gap-2 mb-1 ${validations.upper ? 'text-secondary-hover' : 'text-danger'}`}>
            <span>{validations.upper ? '✓' : '✕'}</span> Al menos una mayuscula
          </li>
          <li className={`flex items-center gap-2 mb-1 ${validations.lower ? 'text-secondary-hover' : 'text-danger'}`}>
            <span>{validations.lower ? '✓' : '✕'}</span> Al menos una minuscula
          </li>
          <li className={`flex items-center gap-2 mb-1 ${validations.number ? 'text-secondary-hover' : 'text-danger'}`}>
            <span>{validations.number ? '✓' : '✕'}</span> Al menos un numero
          </li>
          <li className={`flex items-center gap-2 mb-1 ${validations.special ? 'text-secondary-hover' : 'text-danger'}`}>
            <span>{validations.special ? '✓' : '✕'}</span> Al menos un caracter especial
          </li>
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
        <p className="text-[13px] text-text-muted text-center">Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link></p>
      </form>
    </div>
  )
}
