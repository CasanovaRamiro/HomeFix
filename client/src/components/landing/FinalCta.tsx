// src/components/landing/FinalCta.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MessageSquare } from 'lucide-react'
import logoNeg from '../../assets/homefix-logo-negative.png'

export default function FinalCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-[#0F172A] py-24">
      <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <img src={logoNeg} alt="HomeFix" className="mx-auto mb-8 h-12 w-auto" />
        <h2 className="mb-6 text-3xl font-bold text-white text-balance sm:text-4xl lg:text-5xl">
          Resolvé tu problema hoy mismo
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">
          Conectá con profesionales verificados cerca de ti. Rápido, seguro y con garantía de satisfacción.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex h-16 items-center justify-center gap-2 rounded-lg border-0 bg-accent px-10 text-lg font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Buscar profesional ahora
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/diagnosis')}
            className="inline-flex h-16 items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-transparent px-10 text-lg font-semibold text-white transition-colors hover:bg-white/10"
          >
            <MessageSquare className="h-5 w-5" />
            Diagnóstico gratuito
          </button>
        </div>
      </div>
    </section>
  )
}
