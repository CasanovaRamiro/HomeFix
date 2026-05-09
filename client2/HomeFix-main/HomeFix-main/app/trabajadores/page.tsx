'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Shield,
  CheckCircle2,
  Star,
  ArrowRight,
  BadgeCheck,
  Wallet,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
  Briefcase,
  Award,
  Zap,
  MapPin,
  Phone
} from 'lucide-react'

const stats = [
  { value: '$850K+', label: 'Pagados a profesionales' },
  { value: '2,500+', label: 'Profesionales activos' },
  { value: '15+', label: 'Trabajos por semana promedio' },
  { value: '98%', label: 'Tasa de satisfaccion' },
]

const benefits = [
  {
    icon: Wallet,
    title: 'Ingresos estables',
    description: 'Accede a un flujo constante de clientes verificados que buscan tus servicios.'
  },
  {
    icon: Calendar,
    title: 'Maneja tu agenda',
    description: 'Tu decides cuando trabajar. Acepta o rechaza trabajos segun tu disponibilidad.'
  },
  {
    icon: Shield,
    title: 'Clientes verificados',
    description: 'Todos los clientes pasan por verificacion. Trabaja con tranquilidad.'
  },
  {
    icon: TrendingUp,
    title: 'Crece tu reputacion',
    description: 'Construi un perfil con resenas y calificaciones que atraigan mas clientes.'
  },
  {
    icon: MessageSquare,
    title: 'Comunicacion directa',
    description: 'Chat integrado para coordinar detalles sin intermediarios.'
  },
  {
    icon: Award,
    title: 'Sin comisiones ocultas',
    description: 'Transparencia total. Sabes exactamente cuanto ganas por cada trabajo.'
  }
]

const testimonials = [
  {
    name: 'Carlos Rodriguez',
    role: 'Electricista Matriculado',
    image: '/workers/worker-1.jpg',
    rating: 5,
    quote: 'Desde que me uni a HomeFix, mis ingresos aumentaron un 40%. Los clientes llegan solos y son serios.',
    jobs: 234
  },
  {
    name: 'Maria Gonzalez',
    role: 'Plomera Profesional',
    image: '/workers/worker-2.jpg',
    rating: 5,
    quote: 'La verificacion me da credibilidad. Los clientes confian en mi desde el primer momento.',
    jobs: 189
  },
  {
    name: 'Juan Martinez',
    role: 'Tecnico en Refrigeracion',
    image: '/workers/worker-3.jpg',
    rating: 5,
    quote: 'Manejo mi propia agenda y trabajo cuando quiero. Mejor que cualquier empleo fijo.',
    jobs: 312
  }
]

const steps = [
  {
    number: '1',
    title: 'Registrate gratis',
    description: 'Crea tu cuenta en minutos con tus datos basicos.'
  },
  {
    number: '2',
    title: 'Verifica tu identidad',
    description: 'Completa la verificacion KYC para generar confianza.'
  },
  {
    number: '3',
    title: 'Arma tu perfil',
    description: 'Agrega tus servicios, tarifas y disponibilidad.'
  },
  {
    number: '4',
    title: 'Recibe solicitudes',
    description: 'Los clientes te contactan directamente.'
  }
]

export default function TrabajadoresLanding() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Profesional de HomeFix"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/98 via-primary/90 to-primary/60 sm:from-primary/95 sm:via-primary/80 sm:to-primary/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-accent/20 border border-accent/30 mb-6 sm:mb-8">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              <span className="text-xs sm:text-sm font-semibold text-accent">Para Profesionales</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] sm:leading-[1.1] tracking-tight mb-4 sm:mb-6 text-balance">
              Consegui mas clientes,{' '}
              <span className="text-accent">sin buscarlos</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 leading-relaxed max-w-xl">
              Unite a la red de profesionales verificados de HomeFix. Los clientes te encuentran, vos solo trabajas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 bg-accent hover:bg-accent/90 text-white font-semibold text-sm sm:text-base w-full sm:w-auto shadow-xl shadow-accent/25"
                onClick={() => router.push('/register/trabajador')}
              >
                Registrarme gratis
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-6 sm:px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold text-sm sm:text-base w-full sm:w-auto"
                onClick={() => router.push('/login')}
              >
                Ya tengo cuenta
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white/90">Sin costo de registro</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white/90">Comisiones transparentes</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white/90">Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Beneficios</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 text-balance">
              Por que los profesionales eligen HomeFix
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Herramientas diseñadas para que te enfoques en lo que mejor haces: tu trabajo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="p-6 sm:p-8 bg-card border-border hover:border-accent hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-semibold shadow-xl shadow-accent/25"
              onClick={() => router.push('/register/trabajador')}
            >
              Unirme ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-6 sm:py-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center py-1">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent mb-0.5 sm:mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-white/60 font-medium leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Como funciona</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 text-balance">
              Empeza a trabajar en 4 pasos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Un proceso simple para que comiences a recibir clientes rapidamente.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                {/* Connection line */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-border" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-semibold shadow-xl shadow-accent/25"
              onClick={() => router.push('/register/trabajador')}
            >
              Comenzar registro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Testimonios</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 text-balance">
              Lo que dicen nuestros profesionales
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-6 sm:p-8 bg-card border-border hover:shadow-lg transition-shadow">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden relative">
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-accent">{testimonial.jobs}</span> trabajos completados en HomeFix
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator Preview */}
      <section className="py-20 sm:py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Potencial de ingresos</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 text-balance">
                Calcula cuanto podrias ganar
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Nuestros profesionales mas activos ganan en promedio <span className="text-accent font-bold">$180.000</span> mensuales trabajando 30 horas semanales.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Electricistas', avg: '$12.500/trabajo' },
                  { label: 'Plomeros', avg: '$10.800/trabajo' },
                  { label: 'Gasistas', avg: '$15.200/trabajo' },
                  { label: 'Tecnicos AC', avg: '$14.000/trabajo' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white font-medium">{item.label}</span>
                    <span className="text-accent font-bold">{item.avg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - CTA Card */}
            <Card className="p-8 bg-white border-0 shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">
                  Empieza a ganar hoy
                </h3>
                <p className="text-muted-foreground mb-8">
                  El registro es gratuito y solo toma 2 minutos. Comienza a recibir solicitudes de trabajo de inmediato.
                </p>
                <Button
                  size="lg"
                  className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold text-lg shadow-xl shadow-accent/25"
                  onClick={() => router.push('/register/trabajador')}
                >
                  Crear mi cuenta gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Sin tarjeta de credito. Sin compromisos.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Preguntas frecuentes</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">
              Dudas comunes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Cuanto cuesta registrarse?', a: 'El registro es 100% gratuito. No hay costos ocultos para crear tu perfil.' },
              { q: 'Como recibo los pagos?', a: 'Los clientes te pagan directamente. HomeFix no retiene tu dinero.' },
              { q: 'Necesito estar matriculado?', a: 'No es obligatorio, pero los profesionales matriculados reciben un badge especial y mas visibilidad.' }
            ].map((faq, idx) => (
              <Card key={idx} className="p-6 border-border">
                <h3 className="font-bold text-primary mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
            Los clientes te estan buscando
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Cada dia, cientos de personas buscan profesionales como vos en HomeFix. No te quedes afuera.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 sm:h-16 px-8 sm:px-10 bg-accent hover:bg-accent/90 text-white font-bold text-base sm:text-lg shadow-xl shadow-accent/30"
              onClick={() => router.push('/register/trabajador')}
            >
              Registrarme ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 sm:h-16 px-8 sm:px-10 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-base sm:text-lg"
              onClick={() => router.push('/login')}
            >
              <Phone className="w-5 h-5 mr-2" />
              Contactar soporte
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
