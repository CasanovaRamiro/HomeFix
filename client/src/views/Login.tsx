import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import api from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
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

    try {
      setIsSubmitting(true)
      const { data } = await api.post<{ accessToken: string; idToken: string }>('/auth/login', form)
      localStorage.setItem('token', data.accessToken)
      setSuccess('Sesion iniciada con exito. Redirigiendo...')
      setTimeout(() => navigate('/worker/available-jobs'), 1200)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al iniciar sesion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Iniciar sesion</h2>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: '#059669', fontSize: 13 }}>{success}</p>}
        <input type="email" placeholder="Correo" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Contrasena" value={form.password} onChange={set('password')} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}</button>
        <p className="hint">¿No tienes cuenta? <Link to="/register">Registrate</Link></p>
      </form>
    </div>
  )
}
