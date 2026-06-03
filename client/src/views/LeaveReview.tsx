import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, CheckCircle, Loader2, Star } from 'lucide-react'
import FileUpload from '../components/ui/FileUpload'
import ReviewStarRating from '../components/review/ReviewStarRating'

const MAX_CHARS = 500

export interface ReviewTarget {
  trabajoId: string
  titulo: string
  fecha: string
  ubicacion: string
  trabajador: {
    id: string
    nombre: string
    categoria: string
    imagen?: string
    verificado: boolean
  }
}

// Mock — reemplazá por datos del trabajo finalizado (props / loader / fetch)
const MOCK: ReviewTarget = {
  trabajoId: '1',
  titulo: 'Reparación de tubería en cocina',
  fecha: '10 de mayo de 2026',
  ubicacion: 'Recoleta, Buenos Aires',
  trabajador: {
    id: '7',
    nombre: 'Pedro',
    categoria: 'Plomería',
    imagen:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    verificado: true,
  },
}

export default function LeaveReview({ target = MOCK }: { target?: ReviewTarget }) {
  const navigate = useNavigate()
  const { trabajador } = target

  const [rating, setRating] = useState(0)
  const [comentario, setComentario] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [imgError, setImgError] = useState(false)

  const initials = trabajador.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      // TODO: enviar a tu API — p.ej. reviewsService.create({ ... })
      await new Promise((r) => setTimeout(r, 1200))
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Pantalla de agradecimiento ─────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary-dark">
            ¡Gracias por tu reseña!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Tu opinión ayuda a{' '}
            <span className="font-semibold text-primary-dark">{trabajador.nombre}</span> y a otros
            clientes a tomar mejores decisiones.
          </p>
          <div className="mt-5 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-6 w-6 ${s <= rating ? 'fill-warning text-warning' : 'fill-transparent text-slate-200'}`}
                strokeWidth={1.6}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-8 h-12 w-full rounded-xl bg-primary-dark px-4 font-semibold text-white transition hover:bg-primary-dark hover:brightness-125 active:scale-[.99]"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  /* ── Formulario ─────────────────────────────────────────────── */
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background">
      {/* Header */}
      <header className="bg-primary-dark">
        <div className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Trabajo finalizado
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Dejá tu reseña
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Contanos cómo fue tu experiencia con el servicio.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1">
        <div className="mx-auto -mt-3 max-w-xl space-y-4 px-5 py-6 sm:px-6">
          {/* Resumen del trabajador */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-4">
              {trabajador.imagen && !imgError ? (
                <img
                  src={trabajador.imagen}
                  alt={trabajador.nombre}
                  onError={() => setImgError(true)}
                  className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover object-top ring-1 ring-black/5"
                />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-dark text-xl font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-base font-bold text-primary-dark">
                    {trabajador.nombre}
                  </h2>
                  {trabajador.verificado && (
                    <BadgeCheck className="h-[18px] w-[18px] flex-shrink-0 text-accent" />
                  )}
                </div>
                <span className="mt-0.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {trabajador.categoria}
                </span>
                <p className="mt-1.5 truncate text-[13px] text-muted">{target.titulo}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-border pt-4 text-xs text-muted">
              <span>📅 {target.fecha}</span>
              <span>📍 {target.ubicacion}</span>
            </div>
          </section>

          {/* Calificación */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 text-[15px] font-bold text-primary-dark">
              ¿Cómo calificarías el servicio?
            </h3>
            <div className="py-2">
              <ReviewStarRating value={rating} onChange={setRating} />
            </div>
          </section>

          {/* Opinión + fotos */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 text-[15px] font-bold text-primary-dark">Tu opinión</h3>
            <div className="relative">
              <textarea
                value={comentario}
                maxLength={MAX_CHARS}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Describí tu experiencia: puntualidad, calidad del trabajo, trato…"
                className="h-28 w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-primary-dark outline-none transition placeholder:text-muted focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/10"
              />
              <span
                className={`absolute bottom-3 right-3 text-[11px] font-medium ${
                  comentario.length > MAX_CHARS - 50 ? 'text-warning' : 'text-muted'
                }`}
              >
                {comentario.length}/{MAX_CHARS}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between">
                <h4 className="text-[15px] font-bold text-primary-dark">
                  Fotos <span className="text-xs font-medium text-muted">(opcional)</span>
                </h4>
                <span className="text-[11px] text-muted">{fotos.length}/5</span>
              </div>
              <FileUpload files={fotos} onFilesChange={setFotos} maxFiles={5} />
            </div>
          </section>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="sticky bottom-0 border-t border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-xl gap-3 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-12 flex-1 rounded-xl border border-border bg-card px-4 font-semibold text-muted transition hover:bg-background active:scale-[.99]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)] transition hover:bg-accent-hover active:scale-[.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-muted disabled:shadow-none"
            style={{ height: '48px' }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar reseña'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
