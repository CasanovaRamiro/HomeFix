import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { RatingStars } from '@/components/RatingStars'
import { VerificationBadge } from '@/components/VerificationBadge'
import { ReviewCard } from '@/components/ReviewCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { workers } from '@/lib/data/workers'
import { reviews as allReviews } from '@/lib/data/reviews'
import { WorkerChatClient } from '@/components/WorkerChatClient'
import { AgendarCitaButton } from '@/components/AgendarCitaButton'

export default async function WorkerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const worker = workers.find(w => w.id === id)

  if (!worker) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profesional no encontrado</h1>
          <Link href="/search">
            <Button className="bg-primary hover:bg-primary/90">Volver a Buscar</Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const workerReviews = allReviews.filter(r => r.workerId === worker.id)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link href="/search" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 sm:mb-6 transition-colors text-sm font-medium">
          <span>←</span>
          <span>Volver a resultados</span>
        </Link>

        {/* Mobile: Profile header card */}
        <div className="md:hidden mb-6">
          <Card className="overflow-hidden">
            {/* Square portrait centered on face */}
            <div className="relative w-full aspect-square overflow-hidden">
              <img
                src={worker.image}
                alt={worker.name}
                className="w-full h-full object-cover object-[center_15%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              {worker.verified && (
                <div className="absolute top-3 right-3">
                  <VerificationBadge verified={true} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h1 className="text-2xl font-bold">{worker.name}</h1>
                <p className="text-sm text-white/80">{worker.category}</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <RatingStars rating={worker.rating} reviews={worker.reviews} size="md" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ubicacion', value: worker.location },
                  { label: 'Distancia', value: `${worker.distance} km` },
                  { label: 'Respuesta', value: worker.responseTime },
                  { label: 'Trabajos', value: `${worker.reviews * 2}+` }
                ].map((item, idx) => (
                  <div key={idx} className="bg-secondary/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{item.label}</p>
                    <p className="font-bold text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <WorkerChatClient workerName={worker.name} />
                <AgendarCitaButton workerId={worker.id} workerName={worker.name} />
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop: Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-5 sm:space-y-6">
            {/* Desktop header */}
            <div className="hidden md:block space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{worker.name}</h1>
                  <p className="text-lg text-muted-foreground mt-1">{worker.category}</p>
                </div>
                {worker.verified && <VerificationBadge verified={true} />}
              </div>
              <RatingStars rating={worker.rating} reviews={worker.reviews} size="lg" />
            </div>

            {/* Bio */}
            <Card className="p-4 sm:p-6 bg-secondary/50 space-y-3">
              <h2 className="font-bold text-base sm:text-lg text-foreground">Sobre Mi</h2>
              <p className="text-foreground leading-relaxed text-sm sm:text-base">{worker.bio}</p>
            </Card>

            {/* Quick Info - desktop only */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ubicacion', value: worker.location },
                { label: 'Distancia', value: `${worker.distance} km` },
                { label: 'Respuesta', value: worker.responseTime },
                { label: 'Trabajos', value: `${worker.reviews * 2}+` }
              ].map((item, idx) => (
                <Card key={idx} className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">{item.label}</p>
                  <p className="font-bold text-foreground text-sm">{item.value}</p>
                </Card>
              ))}
            </div>

            {/* Availability */}
            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-foreground">Disponibilidad</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map((day) => {
                  const availDays = worker.availability.map(d =>
                    d.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                  )
                  const isAvailable = availDays.includes(day)
                  return (
                    <div
                      key={day}
                      className={`p-2 sm:p-3 rounded-lg text-center font-medium text-xs sm:text-sm transition-colors ${
                        isAvailable
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Reviews Section */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Reseñas ({workerReviews.length})
              </h2>
              {workerReviews.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {workerReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No hay reseñas aun</p>
                </Card>
              )}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:flex flex-col space-y-5">
            {/* Portrait photo - centered on face */}
            <Card className="overflow-hidden">
              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={worker.image}
                  alt={worker.name}
                  className="w-full h-full object-cover object-[center_15%]"
                />
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <WorkerChatClient workerName={worker.name} />
              <AgendarCitaButton workerId={worker.id} workerName={worker.name} size="lg" />
            </div>

            {/* Stats */}
            <Card className="p-5 space-y-4">
              <h3 className="font-bold text-foreground">Estadisticas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trabajos Completados</span>
                  <span className="font-semibold text-foreground">{worker.reviews * 2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasa de Aceptacion</span>
                  <span className="font-semibold text-foreground">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo de Respuesta</span>
                  <span className="font-semibold text-foreground">{worker.responseTime}</span>
                </div>
              </div>
            </Card>

            {/* Verified badge */}
            {worker.verified && (
              <Card className="p-5 bg-primary/5 border border-primary/20 space-y-2">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <span className="text-accent text-lg">✓</span> Identidad Verificada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Este profesional completo el proceso de verificacion de identidad, matricula y antecedentes de HomeFix.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
