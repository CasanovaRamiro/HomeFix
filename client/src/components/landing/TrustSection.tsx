// src/components/landing/TrustSection.tsx
import { useNavigate } from 'react-router-dom'
import { Fingerprint, BadgeCheck, FileCheck, ArrowRight, type LucideIcon } from 'lucide-react'

interface TrustItem {
  icon: LucideIcon
  tag: string
  title: string
  desc: string
}

const items: TrustItem[] = [
  { icon: Fingerprint, tag: 'Verificado', title: 'Verificación de Identidad', desc: 'Validamos el DNI de cada profesional con bases de datos oficiales. Sabés exactamente quién entrará a tu hogar.' },
  { icon: BadgeCheck, tag: 'Matriculado', title: 'Matrículas Profesionales', desc: 'Ofrecemos la posibilidad de que el trabajador cargue su matrícula habilitante.' },
  { icon: FileCheck, tag: 'Antecedentes', title: 'Control de Antecedentes', desc: 'Ofrecemos la posibilidad de que el trabajador cargue sus antecedentes penales.' },
]

export default function TrustSection() {
  const navigate = useNavigate()

  return (
    <section id="confia-en-nosotros" className="bg-[#F8FAFC] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-accent">Sistema de Confianza</p>
          <h2 className="mb-3 text-3xl font-bold text-[#0F172A] sm:text-4xl">Tu seguridad es nuestra prioridad</h2>
          <p className="text-lg text-slate-500">Cada profesional en HomeFix pasa por un proceso de verificación exhaustivo.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-accent hover:shadow-xl"
            >
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="mb-4 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                  {item.tag}
                </span>
                <h3 className="mb-3 text-xl font-bold text-[#0F172A]">{item.title}</h3>
                <p className="leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border-0 bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Encontrar profesional
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
