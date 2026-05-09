'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle,
  Calendar,
  User,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// Mock trabajador actual (simulando sesion)
const mockTrabajador = {
  id: '1',
  name: 'Carlos Mendez',
  category: 'Electricista',
  location: 'Palermo, Buenos Aires'
}

// Mock trabajos disponibles - filtrados por categoria del trabajador
const allTrabajos = [
  {
    id: '1',
    titulo: 'Instalacion de luces LED en cocina',
    descripcion: 'Necesito instalar 6 spots LED en la cocina. Ya tengo las luces compradas, solo necesito la mano de obra. La cocina tiene falso techo de durlock.',
    categoria: 'Electricista',
    ubicacion: 'Recoleta, Buenos Aires',
    distancia: 3.2,
    urgencia: 'media',
    fechaPublicacion: '2026-05-08',
    fechaServicio: '2026-05-15',
    cliente: {
      nombre: 'Maria Gonzalez',
      inicial: 'MG',
      trabajosAnteriores: 5,
      calificacion: 4.8
    }
  },
  {
    id: '2',
    titulo: 'Revision de tablero electrico urgente',
    descripcion: 'El tablero salta cada vez que prendo el aire acondicionado. Necesito una revision urgente porque hace mucho calor. El edificio es antiguo.',
    categoria: 'Electricista',
    ubicacion: 'Palermo, Buenos Aires',
    distancia: 1.5,
    urgencia: 'alta',
    fechaPublicacion: '2026-05-09',
    fechaServicio: '2026-05-10',
    cliente: {
      nombre: 'Juan Perez',
      inicial: 'JP',
      trabajosAnteriores: 12,
      calificacion: 4.9
    }
  },
  {
    id: '3',
    titulo: 'Cambio de cableado completo',
    descripcion: 'Departamento de 2 ambientes con cableado muy viejo (mas de 40 anos). Quiero cambiar todo el cableado y poner llaves termicas nuevas.',
    categoria: 'Electricista',
    ubicacion: 'Villa Crespo, Buenos Aires',
    distancia: 2.8,
    urgencia: 'baja',
    fechaPublicacion: '2026-05-07',
    fechaServicio: '2026-05-20',
    cliente: {
      nombre: 'Laura Martinez',
      inicial: 'LM',
      trabajosAnteriores: 3,
      calificacion: 5.0
    }
  },
  {
    id: '4',
    titulo: 'Instalar enchufes adicionales',
    descripcion: 'Necesito agregar 4 enchufes en el living y 2 en el dormitorio. El departamento tiene instalacion electrica relativamente nueva.',
    categoria: 'Electricista',
    ubicacion: 'Belgrano, Buenos Aires',
    distancia: 5.1,
    urgencia: 'media',
    fechaPublicacion: '2026-05-06',
    fechaServicio: '2026-05-18',
    cliente: {
      nombre: 'Roberto Sanchez',
      inicial: 'RS',
      trabajosAnteriores: 8,
      calificacion: 4.7
    }
  },
  {
    id: '5',
    titulo: 'Reparar cortocircuito en habitacion',
    descripcion: 'Hay un cortocircuito en una de las habitaciones. No funciona ninguna luz ni enchufe de ese cuarto desde ayer.',
    categoria: 'Electricista',
    ubicacion: 'Caballito, Buenos Aires',
    distancia: 4.2,
    urgencia: 'alta',
    fechaPublicacion: '2026-05-09',
    fechaServicio: '2026-05-09',
    cliente: {
      nombre: 'Ana Fernandez',
      inicial: 'AF',
      trabajosAnteriores: 2,
      calificacion: 4.5
    }
  }
]

type Urgencia = 'alta' | 'media' | 'baja'

export default function TrabajosDisponiblesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    }>
      <TrabajosContent />
    </Suspense>
  )
}

function TrabajosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUrgencia, setFilterUrgencia] = useState<Urgencia | 'todas'>('todas')
  const [filterDistancia, setFilterDistancia] = useState<number | 'todas'>('todas')
  const [selectedTrabajo, setSelectedTrabajo] = useState<typeof allTrabajos[0] | null>(null)
  const [showPostularModal, setShowPostularModal] = useState(false)
  const [postulacionMensaje, setPostulacionMensaje] = useState('')
  const [postulacionEnviada, setPostulacionEnviada] = useState(false)
  const [postulacionesRealizadas, setPostulacionesRealizadas] = useState<string[]>([])

  // Filtrar trabajos por categoria del trabajador
  const trabajosCategoria = allTrabajos.filter(t => t.categoria === mockTrabajador.category)

  // Aplicar filtros adicionales
  const trabajosFiltrados = trabajosCategoria.filter(trabajo => {
    if (searchQuery && !trabajo.titulo.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !trabajo.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterUrgencia !== 'todas' && trabajo.urgencia !== filterUrgencia) {
      return false
    }
    if (filterDistancia !== 'todas' && trabajo.distancia > filterDistancia) {
      return false
    }
    return true
  })

  // Seleccionar trabajo desde URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const trabajo = trabajosCategoria.find(t => t.id === id)
      if (trabajo) setSelectedTrabajo(trabajo)
    }
  }, [searchParams])

  const getUrgenciaBadge = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Urgente</Badge>
      case 'media':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Normal</Badge>
      default:
        return <Badge className="bg-green-500/10 text-green-600 border-0">Flexible</Badge>
    }
  }

  const handlePostular = () => {
    if (!selectedTrabajo) return
    setPostulacionEnviada(true)
    setPostulacionesRealizadas(prev => [...prev, selectedTrabajo.id])
    
    // Guardar en sessionStorage
    const postulaciones = JSON.parse(sessionStorage.getItem('homefix_postulaciones_trabajador') || '[]')
    postulaciones.push({
      id: `post-${Date.now()}`,
      trabajoId: selectedTrabajo.id,
      trabajo: selectedTrabajo.titulo,
      cliente: selectedTrabajo.cliente.nombre,
      mensaje: postulacionMensaje,
      estado: 'pendiente',
      fechaPostulacion: new Date().toISOString().split('T')[0]
    })
    sessionStorage.setItem('homefix_postulaciones_trabajador', JSON.stringify(postulaciones))

    setTimeout(() => {
      setShowPostularModal(false)
      setPostulacionEnviada(false)
      setPostulacionMensaje('')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => router.push('/dashboard/trabajador')}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Trabajos Disponibles</h1>
            <p className="text-white/70 mt-1">
              Encontramos <span className="text-accent font-semibold">{trabajosFiltrados.length} trabajos</span> de {mockTrabajador.category} en tu zona
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-background border-b border-border py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Urgencia Filter */}
              <select
                value={filterUrgencia}
                onChange={(e) => setFilterUrgencia(e.target.value as Urgencia | 'todas')}
                className="h-10 px-4 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="todas">Todas las urgencias</option>
                <option value="alta">Urgente</option>
                <option value="media">Normal</option>
                <option value="baja">Flexible</option>
              </select>

              {/* Distancia Filter */}
              <select
                value={filterDistancia}
                onChange={(e) => setFilterDistancia(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                className="h-10 px-4 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="todas">Cualquier distancia</option>
                <option value="2">Menos de 2 km</option>
                <option value="5">Menos de 5 km</option>
                <option value="10">Menos de 10 km</option>
              </select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Lista de Trabajos */}
              <div className="lg:col-span-2 space-y-4">
                {trabajosFiltrados.length > 0 ? (
                  trabajosFiltrados.map((trabajo) => (
                    <Card 
                      key={trabajo.id}
                      className={`p-5 cursor-pointer transition-all ${
                        selectedTrabajo?.id === trabajo.id 
                          ? 'ring-2 ring-accent shadow-lg' 
                          : 'hover:shadow-md border-border/50'
                      } ${postulacionesRealizadas.includes(trabajo.id) ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedTrabajo(trabajo)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {getUrgenciaBadge(trabajo.urgencia)}
                            {postulacionesRealizadas.includes(trabajo.id) && (
                              <Badge className="bg-accent/10 text-accent border-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Postulado
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{trabajo.fechaPublicacion}</span>
                          </div>
                          <h3 className="font-bold text-foreground text-lg">{trabajo.titulo}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{trabajo.descripcion}</p>
                          
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {trabajo.ubicacion}
                            </span>
                            <span className="text-muted-foreground">{trabajo.distancia} km</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {trabajo.fechaServicio}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {trabajo.cliente.inicial}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{trabajo.cliente.nombre}</p>
                              <p className="text-xs text-muted-foreground">{trabajo.cliente.trabajosAnteriores} trabajos anteriores</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary">{trabajo.presupuestoEstimado}</p>
                          <p className="text-xs text-muted-foreground">estimado</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No hay trabajos disponibles</h3>
                    <p className="text-muted-foreground">No encontramos trabajos que coincidan con tus filtros.</p>
                  </Card>
                )}
              </div>

              {/* Panel Detalle */}
              <div className="lg:col-span-1">
                {selectedTrabajo ? (
                  <Card className="p-6 sticky top-24 border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground">Detalle del Trabajo</h3>
                      <button 
                        onClick={() => setSelectedTrabajo(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">{selectedTrabajo.titulo}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          {getUrgenciaBadge(selectedTrabajo.urgencia)}
                          <span className="text-sm text-muted-foreground">{selectedTrabajo.fechaPublicacion}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Descripcion</p>
                        <p className="text-sm text-muted-foreground">{selectedTrabajo.descripcion}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Ubicacion</p>
                          <p className="text-sm font-medium text-foreground">{selectedTrabajo.ubicacion}</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Distancia</p>
                          <p className="text-sm font-medium text-foreground">{selectedTrabajo.distancia} km</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Fecha servicio</p>
                          <p className="text-sm font-medium text-foreground">{selectedTrabajo.fechaServicio}</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Presupuesto</p>
                          <p className="text-sm font-medium text-primary">{selectedTrabajo.presupuestoEstimado}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground mb-2">Cliente</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {selectedTrabajo.cliente.inicial}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{selectedTrabajo.cliente.nombre}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{selectedTrabajo.cliente.trabajosAnteriores} trabajos</span>
                              <span>-</span>
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-accent" />
                                {selectedTrabajo.cliente.calificacion}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {postulacionesRealizadas.includes(selectedTrabajo.id) ? (
                        <div className="p-4 bg-accent/10 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
                          <p className="font-semibold text-accent">Ya te postulaste</p>
                          <p className="text-sm text-muted-foreground">El cliente revisara tu postulacion</p>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-accent hover:bg-accent/90 text-white"
                          onClick={() => setShowPostularModal(true)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Postularme a este trabajo
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center border-border/50">
                    <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Selecciona un trabajo para ver los detalles</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Postular */}
      {showPostularModal && selectedTrabajo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative">
            <button 
              onClick={() => {
                setShowPostularModal(false)
                setPostulacionMensaje('')
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {!postulacionEnviada ? (
              <>
                <h3 className="text-xl font-bold text-foreground mb-2">Postularte a este trabajo</h3>
                <p className="text-muted-foreground mb-6">{selectedTrabajo.titulo}</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Mensaje para el cliente (opcional)
                    </label>
                    <textarea
                      value={postulacionMensaje}
                      onChange={(e) => setPostulacionMensaje(e.target.value)}
                      placeholder="Presentate brevemente, menciona tu experiencia o haz preguntas sobre el trabajo..."
                      className="w-full h-32 p-3 rounded-lg border border-border bg-background text-foreground resize-none"
                    />
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Tu perfil sera visible</p>
                    <p className="text-xs text-muted-foreground">El cliente podra ver tu nombre, calificacion, resenas y validaciones.</p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowPostularModal(false)
                        setPostulacionMensaje('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1 bg-accent hover:bg-accent/90 text-white"
                      onClick={handlePostular}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Postulacion
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Postulacion Enviada</h3>
                <p className="text-muted-foreground">
                  El cliente recibira tu postulacion y podra contactarte si le interesa.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      <Footer />
    </div>
  )
}
