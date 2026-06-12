// src/components/landing/HowItWorks.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface Step {
  n: number
  title: string
  desc: string
  accent?: boolean
}

const steps: Step[] = [
  { n: 1, title: 'Describí tu problema', desc: 'Usá nuestro diagnóstico asistido o buscá directamente el servicio que necesitás.' },
  { n: 2, title: 'Elegí un profesional', desc: 'Compará perfiles, reseñas y disponibilidad. Todos verificados.' },
  { n: 3, title: 'Problema resuelto', desc: 'Coordiná la visita, recibí el servicio y calificá tu experiencia.', accent: true },
]

export default function HowItWorks() {
  const navigate = useNavigate()

  return (
    <section className="bg-[#0F172A] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-accent">Cómo Funciona</p>
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">Simple, rápido y seguro</h2>
          <p className="text-lg text-white/60">Tres pasos simples para resolver cualquier problema en tu hogar</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                  s.accent ? 'bg-accent text-white' : 'bg-white text-[#0F172A]'
                }`}
              >
                {s.n}
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{s.title}</h3>
              <p className="leading-relaxed text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('/diagnosis')}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border-0 bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Iniciar diagnóstico gratuito
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
