import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FormEvent, ChangeEvent } from 'react'
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react'
import { forgotPassword } from '../services/auth'
import logo from '../assets/homefix-logo.png'
import heroBg from '../assets/hero-bg.jpg'
import './auth.css'

const STATS = [
  { value: '15K+', label: 'Profesionales' },
  { value: '50K+', label: 'Trabajos' },
  { value: '4,9', label: 'Calificacion' },
]

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setIsSubmitting(true)
      await forgotPassword(email.trim())
      setSuccess('Si el correo está registrado, recibirás un email para restablecer tu contraseña.')
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Ocurrió un error. Intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="au-root">
      <main className="au-shell">
        {/* ===== LEFT — form ===== */}
        <section className="au-panel">
          <div className="au-form-wrap">
            <Link to="/login" className="au-back">
              <ArrowLeft /> Volver al inicio de sesión
            </Link>

            <Link to="/">
              <img className="au-logo" src={logo} alt="HomeFix" />
            </Link>

            <div className="au-head">
              <h1>¿Olvidaste tu contraseña?</h1>
              <p>Ingresá tu correo y te enviaremos un link para restablecerla.</p>
            </div>

            {error && (
              <div className="au-error"><AlertCircle /> {error}</div>
            )}
            {success && (
              <div className="au-success"><CheckCircle2 /> {success}</div>
            )}

            {!success && (
              <form className="au-form" onSubmit={handleSubmit} noValidate>
                <div className="au-field">
                  <label htmlFor="email">Correo electrónico</label>
                  <div className="au-input-wrap">
                    <Mail className="au-lead" />
                    <input
                      className="au-input"
                      type="email"
                      id="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="au-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="au-spinner" /> Enviando...
                    </>
                  ) : (
                    <>
                      Enviar link de recuperación <ArrowRight />
                    </>
                  )}
                </button>
              </form>
            )}

            {success && (
              <Link to="/login" className="au-btn-submit" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px', textDecoration: 'none' }}>
                Volver al inicio de sesión
              </Link>
            )}

            <p className="au-register" style={{ marginTop: '20px' }}>
              ¿Recordaste tu contraseña? <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </section>

        {/* ===== RIGHT — visual ===== */}
        <aside className="au-visual">
          <img className="au-visual-img" src={heroBg} alt="Profesional de HomeFix" />
          <div className="au-visual-tint" />

          <div className="au-visual-content">
            <span className="au-secure-badge">
              <Shield /> Plataforma 100% Segura
            </span>

            <div className="au-visual-mid">
              <h2>Tu hogar merece las mejores manos</h2>
              <p className="au-vsub">
                Conectamos a más de 15.000 profesionales verificados con familias que buscan
                soluciones confiables para su hogar.
              </p>

              <div className="au-stats">
                {STATS.map((s) => (
                  <div className="au-stat" key={s.label}>
                    <div className="au-stat-num">{s.value}</div>
                    <div className="au-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
