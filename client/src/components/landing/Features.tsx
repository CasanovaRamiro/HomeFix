// src/components/landing/Features.tsx
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Shield, MessageSquare, ArrowRight, type LucideIcon } from 'lucide-react'
import logo from '../../assets/homefix-logo.png'

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
}

const features: Feature[] = [
  { icon: MapPin, title: 'Búsqueda Geolocalizada', desc: 'Profesionales cerca de ti con filtros avanzados.' },
  { icon: Zap, title: 'Diagnóstico Inteligente', desc: 'Sistema que identifica exactamente qué necesitás.' },
  { icon: Shield, title: 'Verificación Triple', desc: 'Identidad, matrículas y antecedentes verificados.' },
  { icon: MessageSquare, title: 'Chat Directo', desc: 'Comunicación directa sin intermediarios.' },
]

export default function Features() {
  const navigate = useNavigate()

  return (
    <section id="que-ofrecemos-cliente" className="bg-[#0F172A]/5 pt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative hidden justify-center lg:flex">
          <div className="absolute -inset-8 rounded-full bg-accent/10 blur-3xl" />
          <img src={logo} alt="HomeFix" className="relative w-4/5 max-w-sm" />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-accent">Por qué HomeFix</p>
          <h2 className="mb-8 text-3xl font-bold text-[#0F172A] sm:text-4xl">Todo lo que necesitás en un solo lugar</h2>

          <div className="flex flex-col gap-6">
            {features.map((f) => (
              <div key={f.title} className="group flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0F172A]/10 text-[#0F172A] transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[#0F172A]">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border-0 bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Comenzar ahora
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
