// src/components/landing/LandingFooter.tsx
import { useNavigate } from 'react-router-dom'
import { Shield, CheckCircle2 } from 'lucide-react'
import logoNeg from '../../assets/homefix-logo-negative.png'

const columns: { title: string; links: string[] }[] = [
  { title: 'Plataforma', links: ['Buscar Profesionales', 'Diagnóstico Asistido', 'Mi Cuenta', 'Para Profesionales'] },
  { title: 'Empresa', links: ['Sobre Nosotros', 'Cómo Funciona', 'Seguridad', 'Contacto'] },
  { title: 'Legal', links: ['Términos de Servicio', 'Privacidad', 'Cookies'] },
]

export default function LandingFooter() {
  const navigate = useNavigate()

  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-5">
          <div className="col-span-2 space-y-6">
            <img src={logoNeg} alt="HomeFix" className="h-14 w-auto" />
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Plataforma de confianza que conecta hogares con profesionales verificados. Seguridad, transparencia y calidad garantizada en cada servicio.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verificación Triple
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <Shield className="h-3.5 w-3.5" />
                Seguridad Garantizada
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-sm font-bold text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => navigate('/login')}
                      className="border-0 bg-transparent p-0 text-sm text-white/70 transition-colors hover:text-accent"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pb-8 pt-8 text-sm text-white/60 sm:flex-row">
          <p>© 2026 HomeFix. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a className="transition-colors hover:text-accent" href="#">LinkedIn</a>
            <a className="transition-colors hover:text-accent" href="#">Twitter</a>
            <a className="transition-colors hover:text-accent" href="#">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
