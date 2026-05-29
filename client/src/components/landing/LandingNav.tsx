// src/components/landing/LandingNav.tsx
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/homefix-logo.png'

export default function LandingNav() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center border-0 bg-transparent p-0">
          <img src={logo} alt="HomeFix" className="h-9 w-auto" />
        </button>

        <div className="hidden items-center gap-1 md:flex">
          <button onClick={() => navigate('/login')} className="rounded-lg border-0 bg-transparent px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0F172A]">
            Buscar Profesionales
          </button>
          <button onClick={() => navigate('/register/worker')} className="rounded-lg border-0 bg-transparent px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0F172A]">
            Soy Profesional
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="rounded-lg border-0 bg-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#0F172A]">
            Iniciar Sesión
          </button>
          <button onClick={() => navigate('/register')} className="rounded-lg border-0 bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
            Registrarse
          </button>
        </div>
      </div>
    </nav>
  )
}
