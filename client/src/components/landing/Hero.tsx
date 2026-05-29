// src/components/landing/Hero.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import heroBg from '../../assets/hero-bg.jpg'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative flex min-h-[86vh] items-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.96), rgba(15,23,42,0.8) 45%, rgba(15,23,42,0.4))' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Soluciones para tu hogar, <span className="text-accent">con total confianza</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Conectamos tu hogar con profesionales verificados. Cada técnico pasa por validación de identidad.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/register')}
              className="flex h-14 items-center justify-center gap-2 rounded-lg border-0 bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Buscar profesional
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/diagnosis')}
              className="flex h-14 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              ¿Cómo funciona?
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2 text-sm font-medium text-white/90">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              DNI verificado
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-white/90">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              Verificación facial biométrica
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
