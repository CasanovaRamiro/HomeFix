import { useNavigate } from 'react-router-dom'
import {
  User, Briefcase, CheckCircle2, ArrowRight, ArrowLeft, Shield, Star, Zap,
} from 'lucide-react'
import type { ElementType } from 'react'
import { useTheme } from '../hooks/useTheme'

type Role = {
  id: 'cliente' | 'profesional'
  subtitle: string
  title: string
  description: string
  icon: ElementType
  features: string[]
  href: string
  /** emerald accent for clients, navy/slate for professionals */
  variant: 'accent' | 'navy'
}

const ROLES: Role[] = [
  {
    id: 'cliente',
    subtitle: 'Busco profesionales',
    title: 'Soy Cliente',
    description: 'Necesito reparaciones o servicios de mantenimiento para mi hogar.',
    icon: User,
    features: [
      'Publica solicitudes de trabajo',
      'Accede a profesionales verificados',
      'Diagnóstico con IA',
      'Califica y deja reseñas',
    ],
    href: '/register',
    variant: 'accent',
  },
  {
    id: 'profesional',
    subtitle: 'Ofrezco mis servicios',
    title: 'Soy Profesional',
    description: 'Quiero ofrecer mis servicios de reparación y mantenimiento.',
    icon: Briefcase,
    features: [
      'Recibe solicitudes de trabajo',
      'Construye tu reputación',
      'Elige tus especialidades',
      'Verificación de identidad',
    ],
    href: '/register/worker',
    variant: 'navy',
  },
]

export default function RegisterChoice() {
  const navigate = useNavigate()
  const theme = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '16px 2rem 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: theme.muted, padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', transition: 'color 0.15s, background 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Volver
        </button>
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-14 sm:py-16">
        <div className="hf-container-xs w-full">
          {/* Title block */}
          <div className="text-center mb-11">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full mb-5 text-sm font-semibold text-accent-hover">
              <Zap className="w-4 h-4" />
              Registro rápido en 2 minutos
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3.5">
              Crea tu cuenta en HomeFix
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Role cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {ROLES.map((role) => {
              const Icon = role.icon
              const isAccent = role.variant === 'accent'
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => navigate(role.href)}
                  className={`group relative text-left p-8 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isAccent ? 'hover:border-accent' : 'hover:border-slate-900'
                  }`}
                >
                  {/* Hover gradient wash */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${
                      isAccent ? 'from-accent/8 to-accent/0' : 'from-slate-900/6 to-slate-900/0'
                    }`}
                  />

                  <div className="relative">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                        isAccent ? 'bg-accent/10 text-accent' : 'bg-slate-900/8 text-slate-900'
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Title + description */}
                    <p className="text-sm font-semibold text-slate-500 mb-1">{role.subtitle}</p>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2.5">{role.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">{role.description}</p>

                    {/* Features */}
                    <ul className="space-y-3 mb-7">
                      {role.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                          <CheckCircle2
                            className={`w-[18px] h-[18px] flex-shrink-0 ${isAccent ? 'text-accent' : 'text-slate-900'}`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <span
                      className={`inline-flex items-center gap-2 text-[15px] font-bold transition-all group-hover:gap-3 ${
                        isAccent ? 'text-accent-hover' : 'text-slate-900'
                      }`}
                    >
                      Continuar
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-medium text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Datos encriptados
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              +15,000 usuarios
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              Verificación segura
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
