// src/components/landing/Categories.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { categories } from '../../data/landingData'

export default function Categories() {
  const navigate = useNavigate()

  return (
    <section className="bg-[#F8FAFC] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-accent">Servicios</p>
            <h2 className="mb-2 text-3xl font-bold text-[#0F172A] sm:text-4xl">Nuestros rubros más solicitados</h2>
            <p className="text-slate-500">Expertos verificados en todas las categorías</p>
          </div>
          <button
            onClick={() => navigate('/register/worker')}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg border border-[#0F172A] bg-transparent px-5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#0F172A] hover:text-white"
          >
            ¿Buscás trabajo?
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate('/login')}
              className="group relative h-56 overflow-hidden rounded-2xl border-0 p-0 shadow-md transition-all duration-300 hover:shadow-xl md:h-64"
            >
              <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div
                className="absolute inset-0 opacity-85 transition-opacity group-hover:opacity-90"
                style={{ background: 'linear-gradient(to top, #0F172A, rgba(15,23,42,0.5) 45%, transparent)' }}
              />
              <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                <h3 className="text-lg font-bold text-white drop-shadow-md">{cat.name}</h3>
                <p className="text-sm text-white/80">{cat.count}+ profesionales</p>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-colors group-hover:border-accent" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
