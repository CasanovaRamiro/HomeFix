'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { workers } from '@/lib/data/workers'
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00'
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const SERVICIOS = [
  'Presupuesto / Diagnóstico',
  'Reparación urgente',
  'Instalación nueva',
  'Mantenimiento preventivo',
  'Consulta técnica',
  'Otro'
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function AgendarCitaPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const workerId = params.workerId as string
  const worker = workers.find(w => w.id === workerId)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHora, setSelectedHora] = useState<string | null>(null)
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')

  if (!worker) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profesional no encontrado</h1>
          <Link href="/search">
            <Button className="bg-primary hover:bg-primary/90">Buscar profesionales</Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const isAvailableDay = (date: Date) => {
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()]
    return worker.availability.some(d =>
      d.normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
      dayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
  }

  const isPastDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    date.setHours(0, 0, 0, 0)
    const todayClean = new Date()
    todayClean.setHours(0, 0, 0, 0)
    return date < todayClean
  }

  const handleDayClick = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    if (isPastDay(day) || !isAvailableDay(date)) return
    setSelectedDate(date)
    setSelectedHora(null)
  }

  const canConfirm = selectedDate && selectedHora && selectedServicio

  const handleConfirm = () => {
    if (!canConfirm) return
    setStep('confirm')
  }

  const handleFinalBook = () => {
    // Guardar la cita en sessionStorage para verla en Mis Publicaciones
    const cita = {
      id: `cita-${Date.now()}`,
      titulo: `Cita con ${worker.name}`,
      descripcion: descripcion || `${selectedServicio} - ${worker.category}`,
      categoria: worker.category,
      estado: 'en_progreso',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaServicio: selectedDate?.toISOString().split('T')[0] || '',
      horario: selectedHora,
      ubicacion: worker.location,
      urgencia: 'media',
      solicitudes: [],
      tipo: 'cita',
      trabajadorNombre: worker.name,
      trabajadorId: worker.id
    }
    const existing = JSON.parse(sessionStorage.getItem('homefix_publicaciones') || '[]')
    sessionStorage.setItem('homefix_publicaciones', JSON.stringify([cita, ...existing]))
    setStep('success')
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Cita confirmada</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Tu cita con <strong>{worker.name}</strong> fue agendada para el{' '}
            <strong>
              {selectedDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </strong>{' '}
            a las <strong>{selectedHora}</strong>. Te notificaremos cuando confirme.
          </p>
          <Card className="p-5 text-left space-y-3 mb-8 bg-secondary/40">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">
                {selectedDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{selectedHora} hs</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{worker.location}</span>
            </div>
          </Card>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => router.push('/mis-publicaciones')}
            >
              Ver mis solicitudes
            </Button>
            <Button variant="outline" onClick={() => router.push('/search')}>
              Buscar otro profesional
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (step === 'confirm') {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Confirmar cita</h1>
            <p className="text-muted-foreground text-sm">Revisa los detalles antes de confirmar</p>
          </div>

          {/* Worker summary */}
          <Card className="p-5 mb-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={worker.image}
                alt={worker.name}
                className="w-full h-full object-cover object-[center_15%]"
              />
            </div>
            <div>
              <p className="font-bold text-foreground">{worker.name}</p>
              <p className="text-sm text-muted-foreground">{worker.category}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{worker.location}</p>
            </div>
          </Card>

          {/* Booking details */}
          <Card className="p-5 space-y-4 mb-5">
            <h2 className="font-bold text-foreground">Detalle de la cita</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-medium mb-0.5">Fecha</p>
                  <p className="font-semibold text-foreground capitalize">
                    {selectedDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-medium mb-0.5">Hora</p>
                  <p className="font-semibold text-foreground">{selectedHora} hs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-medium mb-0.5">Servicio</p>
                  <p className="font-semibold text-foreground">{selectedServicio}</p>
                </div>
              </div>
              {descripcion && (
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-medium mb-0.5">Descripcion</p>
                    <p className="text-foreground">{descripcion}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
            <p className="text-xs text-muted-foreground">
              Al confirmar, el profesional recibira una solicitud de cita. 
              Tenes hasta <strong>2 horas antes</strong> para cancelar sin costo.
            </p>
          </Card>

          <Button
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold h-13"
            onClick={handleFinalBook}
          >
            Confirmar cita
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <Link
          href={`/worker/${worker.id}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </Link>

        {/* Worker mini card */}
        <Card className="p-4 mb-6 flex items-center gap-4 bg-secondary/30">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
            <img
              src={worker.image}
              alt={worker.name}
              className="w-full h-full object-cover object-[center_15%]"
            />
          </div>
          <div>
            <p className="font-bold text-foreground">{worker.name}</p>
            <p className="text-sm text-muted-foreground">{worker.category} · {worker.location}</p>
          </div>
          {worker.verified && (
            <span className="ml-auto text-xs font-semibold text-accent border border-accent/30 rounded-full px-2 py-0.5">
              Verificado
            </span>
          )}
        </Card>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Agendar cita</h1>
        <p className="text-muted-foreground text-sm mb-8">Selecciona fecha, horario y tipo de servicio</p>

        <div className="space-y-6">
          {/* Calendar */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                disabled={isPrevDisabled}
                className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <h2 className="font-bold text-foreground text-base">
                {MESES[viewMonth]} {viewYear}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(viewYear, viewMonth, day)
                const past = isPastDay(day)
                const available = isAvailableDay(date)
                const isSelected =
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === viewMonth &&
                  selectedDate?.getFullYear() === viewYear

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={past || !available}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-primary text-white shadow-md'
                        : available && !past
                          ? 'hover:bg-primary/10 text-foreground'
                          : 'text-muted-foreground/40 cursor-not-allowed'
                      }
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-xs text-muted-foreground">No disponible</span>
              </div>
            </div>
          </Card>

          {/* Time slots */}
          {selectedDate && (
            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Horario disponible
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {HORARIOS.map(hora => (
                  <button
                    key={hora}
                    onClick={() => setSelectedHora(hora)}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      selectedHora === hora
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Service type */}
          {selectedHora && (
            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-foreground mb-4">Tipo de servicio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {SERVICIOS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedServicio(s)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border text-left transition-all ${
                      selectedServicio === s
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-border text-foreground hover:border-primary/40 hover:bg-secondary/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descripcion adicional <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Contale brevemente al profesional sobre el trabajo..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </Card>
          )}

          {/* CTA */}
          <Button
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold h-13 text-base disabled:opacity-50"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Revisar y confirmar
          </Button>

          {!canConfirm && (
            <p className="text-center text-xs text-muted-foreground -mt-2">
              {!selectedDate
                ? 'Selecciona una fecha para continuar'
                : !selectedHora
                ? 'Selecciona un horario'
                : 'Selecciona el tipo de servicio'}
            </p>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
