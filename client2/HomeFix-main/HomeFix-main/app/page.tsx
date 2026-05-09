'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReviewCard } from '@/components/ReviewCard'
import { reviews } from '@/lib/data/reviews'
import { categories } from '@/lib/data/categories'
import {
  Shield,
  Search,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Star,
  Zap,
  Users,
  ArrowRight,
  BadgeCheck,
  FileCheck,
  Fingerprint,
  Clock,
  Phone,
  Play
} from 'lucide-react'

const stats = [
  { value: '15,000+', label: 'Servicios completados' },
  { value: '2,500+', label: 'Profesionales verificados' },
  { value: '4.9', label: 'Calificacion promedio' },
  { value: '< 1hs', label: 'Tiempo de respuesta' },
]

const trustedBy = [
  'Gobierno de la Ciudad',
  'Consejo Profesional',
  'Camara de Comercio',
  'Defensa al Consumidor'
]

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Full Width Image Background */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Profesional de HomeFix trabajando"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay Gradient - more opaque on mobile for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/98 via-primary/90 to-primary/60 sm:from-primary/95 sm:via-primary/80 sm:to-primary/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-2xl">


            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] sm:leading-[1.1] tracking-tight mb-4 sm:mb-6 text-balance">
              Soluciones para tu hogar,{' '}
              <span className="text-accent">con total confianza</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 leading-relaxed max-w-xl">
              Conectamos tu hogar con profesionales verificados. Cada tecnico pasa por validacion de identidad.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 bg-accent hover:bg-accent/90 text-white font-semibold text-sm sm:text-base w-full sm:w-auto"
                onClick={() => router.push('/search')}
              >
                Buscar profesional
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-6 sm:px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold text-sm sm:text-base w-full sm:w-auto"
                onClick={() => router.push('/diagnostico')}
              >
                ¿Cómo funciona?
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white/90">DNI verificado</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white/90">Verifición facial biométrica</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - hide on very small screens */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>


      {/* Security Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Sistema de Confianza</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
              Tu seguridad es nuestra prioridad
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Cada profesional en HomeFix pasa por un proceso de verificacion exhaustivo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Verification Card 1 */}
            <Card className="p-8 bg-card border-border hover:border-accent hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-8 h-8 text-white" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                  Verificado
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  Verificacion de Identidad
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Validamos el DNI de cada profesional con bases de datos oficiales. Sabes exactamente quien entrara a tu hogar.
                </p>
              </div>
            </Card>

            {/* Verification Card 2 */}
            <Card className="p-8 bg-card border-border hover:border-accent hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BadgeCheck className="w-8 h-8 text-white" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                  Matriculado
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  Matriculas Profesionales
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ofrecemos la posibilidad de que el trabajador cargue su matricula.
                </p>
              </div>
            </Card>

            {/* Verification Card 3 */}
            <Card className="p-8 bg-card border-border hover:border-accent hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                  Control de Antecedentes
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  Control de Antecedentes
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ofrecemos la posibilidad de que el trabajador cargue sus antecedentes penales.
                </p>
              </div>
            </Card>
          </div>

          {/* CTA After Security */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-semibold"
              onClick={() => router.push('/search')}
            >
              Encontrar profesional
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold text-accent uppercase tracking-wider mb-3">Como Funciona</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 text-balance">
              Simple, rapido y seguro
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto text-base sm:text-lg">
              Tres pasos simples para resolver cualquier problema en tu hogar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connection Line - only on sm+ */}
            <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-white/20" />

            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-6 relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Describe tu problema
              </h3>
              <p className="text-white/70 leading-relaxed">
                Usá nuestro diagnostico asistido o buscá directamente el servicio que necesitas.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-6 relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Elige un profesional
              </h3>
              <p className="text-white/70 leading-relaxed">
                Compará perfiles, reseñas y disponibilidad. Todos verificados.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-bold text-2xl mx-auto mb-6 relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Problema resuelto
              </h3>
              <p className="text-white/70 leading-relaxed">
                Coordiná la visita, recibí el servicio y calificá tu experiencia.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              size="lg"
              className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-semibold"
              onClick={() => router.push('/diagnostico')}
            >
              Iniciar diagnostico gratuito
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Servicios</p>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Nuestros rubros más solicitados
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Expertos verificados en todas las categorias
              </p>
            </div>
            <Link href="/search" className="mt-6 md:mt-0">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                ¿Buscás labubu?
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => router.push(`/search?category=${category.id}`)}
                className="group relative h-44 sm:h-56 md:h-64 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Background Image */}
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5">
                  <h3 className="font-bold text-white text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 drop-shadow-md">
                    {category.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80">
                    {category.count}+ profesionales
                  </p>
                </div>
                {/* Hover Accent Border */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-accent transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </section>


     {/* Stats Bar */}
      <section className="bg-primary py-6 sm:py-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center py-1">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">
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

      {/* Features Section */}
      <section className="pt-20 pb-0 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Image/Logo */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-accent/10 rounded-full blur-3xl" />
                <Image
                  src="/homefix-logo.png"
                  alt="HomeFix"
                  width={1600}
                  height={1600}
                  className="relative"
                />
              </div>
            </div>

            {/* Right - Features */}
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Por que HomeFix</p>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">
                Todo lo que necesitas en un solo lugar
              </h2>

              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: 'Busqueda Geolocalizada',
                    description: 'Profesionales cerca de ti con filtros avanzados.'
                  },
                  {
                    icon: Zap,
                    title: 'Diagnostico Inteligente',
                    description: 'Sistema que identifica exactamente que necesitas.'
                  },
                  {
                    icon: Shield,
                    title: 'Verificacion Triple',
                    description: 'Identidad, matriculas y antecedentes verificados.'
                  },
                  {
                    icon: MessageSquare,
                    title: 'Chat Directo',
                    description: 'Comunicacion directa sin intermediarios.'
                  },
                ].map((feature, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button
                  size="lg"
                  className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-semibold"
                  onClick={() => router.push('/search')}
                >
                  Comenzar ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="pt-14 pb-16 sm:pb-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-accent/10 border border-accent/20 mb-4 sm:mb-6">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent fill-accent" />
              <span className="text-xs sm:text-sm font-semibold text-accent">4.9 de calificacion promedio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4 text-balance">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Miles de hogares ya confian en HomeFix
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.slice(0, 6).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/homefix-logo-negative.png"
            alt="HomeFix"
            width={200}
            height={56}
            className="h-10 sm:h-12 w-auto mx-auto mb-6 sm:mb-8"
          />
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 text-balance">
            Resuelve tu problema hoy mismo
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
            Conecta con profesionales verificados cerca de ti. Rapido, seguro y con garantia de satisfaccion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="h-12 sm:h-16 px-6 sm:px-10 bg-accent hover:bg-accent/90 text-white font-bold text-base sm:text-lg w-full sm:w-auto"
              onClick={() => router.push('/search')}
            >
              Buscar profesional ahora
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-16 px-6 sm:px-10 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-base sm:text-lg w-full sm:w-auto"
              onClick={() => router.push('/diagnostico')}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Diagnostico gratuito
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
