'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  MapPin, 
  Clock, 
  CheckCircle,
  X,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Eye,
  AlertCircle,
  Inbox
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

interface Postulacion {
  id: string
  trabajoId: string
  trabajo: string
  cliente: string
  clienteInicial?: string
  ubicacion?: string
  mensaje: string
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'expirada'
  fechaPostulacion: string
  fechaServicio?: string
  presupuesto?: string
}

// Mock postulaciones
const mockPostulaciones: Postulacion[] = [
  {
    id: '1',
    trabajoId: 'job-1',
    trabajo: 'Instalacion de luces LED en cocina',
    cliente: 'Maria Gonzalez',
    clienteInicial: 'MG',
    ubicacion: 'Recoleta, Buenos Aires',
    mensaje: 'Hola, tengo amplia experiencia en instalacion de luces LED. Puedo ir el viernes.',
    estado: 'pendiente',
    fechaPostulacion: '2026-05-08',
    fechaServicio: '2026-05-15',
    presupuesto: '$18,000'
  },
  {
    id: '2',
    trabajoId: 'job-2',
    trabajo: 'Reparacion de tablero electrico',
    cliente: 'Juan Perez',
    clienteInicial: 'JP',
    ubicacion: 'Palermo, Buenos Aires',
    mensaje: 'Puedo ir hoy mismo a revisar el tablero. Trabajo con garantia.',
    estado: 'aceptada',
    fechaPostulacion: '2026-05-06',
    fechaServicio: '2026-05-10',
    presupuesto: '$12,000'
  },
  {
    id: '3',
    trabajoId: 'job-3',
    trabajo: 'Cambio de cableado en departamento',
    cliente: 'Laura Martinez',
    clienteInicial: 'LM',
    ubicacion: 'Villa Crespo, Buenos Aires',
    mensaje: 'Tengo disponibilidad la proxima semana.',
    estado: 'rechazada',
    fechaPostulacion: '2026-05-04',
    fechaServicio: '2026-05-20',
    presupuesto: '$65,000'
  },
  {
    id: '4',
    trabajoId: 'job-4',
    trabajo: 'Instalacion de ventiladores de techo',
    cliente: 'Roberto Sanchez',
    clienteInicial: 'RS',
    ubicacion: 'Belgrano, Buenos Aires',
    mensaje: 'Puedo instalar los 3 ventiladores en un solo dia.',
    estado: 'aceptada',
    fechaPostulacion: '2026-05-02',
    fechaServicio: '2026-05-08',
    presupuesto: '$25,000'
  }
]

type FilterEstado = 'todas' | 'pendiente' | 'aceptada' | 'rechazada'

export default function MisPostulacionesPage() {
  const router = useRouter()
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todas')
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>(mockPostulaciones)
  const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null)

  // Cargar postulaciones del sessionStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('homefix_postulaciones_trabajador') || '[]')
      if (stored.length > 0) {
        setPostulaciones([...stored, ...mockPostulaciones])
      }
    } catch {
      // Ignorar errores de parsing
    }
  }, [])

  const filteredPostulaciones = filterEstado === 'todas' 
    ? postulaciones 
    : postulaciones.filter(p => p.estado === filterEstado)

  const stats = {
    total: postulaciones.length,
    pendientes: postulaciones.filter(p => p.estado === 'pendiente').length,
    aceptadas: postulaciones.filter(p => p.estado === 'aceptada').length,
    rechazadas: postulaciones.filter(p => p.estado === 'rechazada').length
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pendiente</Badge>
      case 'aceptada':
        return <Badge className="bg-accent/10 text-accent border-0">Aceptada</Badge>
      case 'rechazada':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Rechazada</Badge>
      case 'expirada':
        return <Badge className="bg-muted text-muted-foreground border-0">Expirada</Badge>
      default:
        return null
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'aceptada':
        return <CheckCircle className="w-5 h-5 text-accent" />
      case 'rechazada':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => router.push('/dashboard/trabajador')}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Postulaciones</h1>
            </div>
            <p className="text-white/70">
              Revisa el estado de tus postulaciones a trabajos
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-primary/95 border-t border-white/10 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats.total, color: 'text-white' },
                { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
                { label: 'Aceptadas', value: stats.aceptadas, color: 'text-accent' },
                { label: 'Rechazadas', value: stats.rechazadas, color: 'text-red-400' }
              ].map((stat, idx) => (
                <Card key={idx} className="bg-white/5 border-white/10 p-4 text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-background border-b border-border py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'todas' as FilterEstado, label: 'Todas' },
                { id: 'pendiente' as FilterEstado, label: 'Pendientes' },
                { id: 'aceptada' as FilterEstado, label: 'Aceptadas' },
                { id: 'rechazada' as FilterEstado, label: 'Rechazadas' }
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={filterEstado === filter.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado(filter.id)}
                  className={filterEstado === filter.id 
                    ? 'bg-primary hover:bg-primary/90 text-white' 
                    : 'text-muted-foreground'
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredPostulaciones.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPostulaciones.map((postulacion) => (
                  <Card 
                    key={postulacion.id}
                    className={`p-5 border-border/50 transition-all hover:shadow-md cursor-pointer ${
                      selectedPostulacion?.id === postulacion.id ? 'ring-2 ring-accent' : ''
                    }`}
                    onClick={() => setSelectedPostulacion(
                      selectedPostulacion?.id === postulacion.id ? null : postulacion
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        postulacion.estado === 'aceptada' ? 'bg-accent/10' :
                        postulacion.estado === 'pendiente' ? 'bg-yellow-500/10' :
                        'bg-red-500/10'
                      }`}>
                        {getEstadoIcon(postulacion.estado)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-foreground truncate pr-2">{postulacion.trabajo}</h3>
                          {getEstadoBadge(postulacion.estado)}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {postulacion.clienteInicial || postulacion.cliente.charAt(0)}
                            </div>
                            {postulacion.cliente}
                          </span>
                        </div>

                        {postulacion.ubicacion && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" />
                            {postulacion.ubicacion}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Postulado: {postulacion.fechaPostulacion}
                          </span>
                          {postulacion.fechaServicio && (
                            <span>Servicio: {postulacion.fechaServicio}</span>
                          )}
                        </div>

                        {/* Expanded Content */}
                        {selectedPostulacion?.id === postulacion.id && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">Tu mensaje:</p>
                              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                                {postulacion.mensaje}
                              </p>
                            </div>

                            {postulacion.presupuesto && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Presupuesto:</span>
                                <span className="font-bold text-primary">{postulacion.presupuesto}</span>
                              </div>
                            )}

                            {postulacion.estado === 'aceptada' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-accent hover:bg-accent/90 text-white"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contactar Cliente
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalles
                                </Button>
                              </div>
                            )}

                            {postulacion.estado === 'pendiente' && (
                              <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <p className="text-xs text-yellow-700 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  El cliente esta revisando tu postulacion
                                </p>
                              </div>
                            )}

                            {postulacion.estado === 'rechazada' && (
                              <div className="p-3 bg-red-500/10 rounded-lg">
                                <p className="text-xs text-red-700">
                                  El cliente eligio a otro profesional para este trabajo.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-border/50">
                <Inbox className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay postulaciones</h3>
                <p className="text-muted-foreground mb-6">
                  {filterEstado === 'todas' 
                    ? 'Aun no te has postulado a ningun trabajo.' 
                    : `No tienes postulaciones ${filterEstado}s.`
                  }
                </p>
                <Button 
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => router.push('/trabajador/trabajos')}
                >
                  Buscar Trabajos
                </Button>
              </Card>
            )}

            {/* Tips */}
            {filteredPostulaciones.length > 0 && (
              <Card className="p-6 mt-8 bg-primary/5 border-primary/20">
                <h3 className="font-bold text-foreground mb-3">Consejos para mejorar tus postulaciones</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    Responde rapido a las publicaciones nuevas para tener mas chances.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    Personaliza tu mensaje mencionando tu experiencia relevante.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    Completa tu perfil y validaciones para generar mas confianza.
                  </li>
                </ul>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
