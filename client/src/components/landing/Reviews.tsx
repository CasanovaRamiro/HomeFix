// src/components/landing/Reviews.tsx
import { Star } from 'lucide-react'
import { testimonials } from '../../data/landingData'

export default function Reviews() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            <Star className="h-4 w-4 fill-accent text-accent" />
            4.9 de calificación promedio
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[#0F172A] sm:text-4xl">Lo que dicen nuestros usuarios</h2>
          <p className="text-slate-500">Miles de hogares ya confían en HomeFix</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((r) => (
            <div key={r.author} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-[#0F172A]">{r.author}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">{r.date}</p>
                </div>
                <span className="whitespace-nowrap rounded-md bg-[#0F172A]/10 px-2 py-1 text-xs font-semibold text-[#0F172A]">
                  Verificado
                </span>
              </div>
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < r.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-slate-200 text-slate-200'}`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
