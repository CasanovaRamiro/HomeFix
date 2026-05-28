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
      setTimeout(() => navigate('/users'), 1200)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al iniciar sesion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="bg-card border border-border rounded-lg p-8 w-full max-w-[360px] flex flex-col gap-3" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold">Iniciar sesion</h2>
        {error && <p className="text-danger text-[13px]">{error}</p>}
        {success && <p className="text-secondary-hover text-[13px]">{success}</p>}
        <input type="email" placeholder="Correo" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Contrasena" value={form.password} onChange={set('password')} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}</button>
        <p className="text-[13px] text-text-muted text-center">¿No tienes cuenta? <Link to="/register">Registrate</Link></p>
      </form>
    </div>
  )
}
