'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  FileText,
  MessageSquare,
  Clock,
  MapPin,
  Calendar,
  User,
  Star,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  X,
  Search,
  Filter
} from 'lucide-react'

type Tab = 'publicaciones' | 'chats' | 'historial'
type PublicacionEstado = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'

interface Solicitud {
  id: string
  trabajadorId: string
  trabajadorNombre: string
  trabajadorCategoria: string
  trabajadorCalificacion: number
  trabajadorReviews: number
  trabajadorVerificado: boolean
  mensaje: string
  presupuesto: string
  fechaPropuesta: string
  estado: 'pendiente' | 'aceptada' | 'rechazada'
}

interface Publicacion {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  estado: PublicacionEstado
  fechaCreacion: string
  fechaServicio: string
  ubicacion: string
  presupuesto: string
  urgencia: string
  solicitudes: Solicitud[]
}

interface Chat {
  id: string
  publicacionId: string
  publicacionTitulo: string
  trabajadorId: string
  trabajadorNombre: string
  trabajadorCategoria: string
  ultimoMensaje: string
  fechaUltimoMensaje: string
  noLeidos: number
}

// Mock data
const mockPublicaciones: Publicacion[] = [
  {
    id: '1',
    titulo: 'Reparacion de tuberia en cocina',
    descripcion: 'Tengo una fuga debajo del lavabo de la cocina que necesita reparacion urgente.',
    categoria: 'Plomeria',
    estado: 'pendiente',
    fechaCreacion: '2024-01-15',
    fechaServicio: '2024-01-20',
    ubicacion: 'Buenos Aires, Palermo',
    presupuesto: '$15.000 - $30.000',
    urgencia: 'Alta',
    solicitudes: [
      {
        id: '1',
        trabajadorId: '1',
        trabajadorNombre: 'Carlos Rodriguez',
        trabajadorCategoria: 'Plomeria',
        trabajadorCalificacion: 4.8,
        trabajadorReviews: 47,
        trabajadorVerificado: true,
        mensaje: 'Hola, tengo disponibilidad para ir esta semana. Cuento con todas las herramientas necesarias.',
        presupuesto: '$18.000',
        fechaPropuesta: '2024-01-18',
        estado: 'pendiente'
      },
      {
        id: '2',
        trabajadorId: '2',
        trabajadorNombre: 'Luis Fernandez',
        trabajadorCategoria: 'Plomeria',
        trabajadorCalificacion: 4.5,
        trabajadorReviews: 23,
        trabajadorVerificado: true,
        mensaje: 'Puedo revisar el problema manana. Presupuesto sin compromiso.',
        presupuesto: '$22.000',
        fechaPropuesta: '2024-01-19',
        estado: 'pendiente'
      }
    ]
  },
  {
    id: '2',
    titulo: 'Instalacion de aire acondicionado',
    descripcion: 'Necesito instalar un split de 3000 frigorias en el dormitorio principal.',
    categoria: 'HVAC',
    estado: 'en_progreso',
    fechaCreacion: '2024-01-10',
    fechaServicio: '2024-01-22',
    ubicacion: 'Buenos Aires, Belgrano',
    presupuesto: '$25.000 - $40.000',
    urgencia: 'Media',
    solicitudes: [
      {
        id: '3',
        trabajadorId: '3',
        trabajadorNombre: 'Martin Gomez',
        trabajadorCategoria: 'HVAC',
        trabajadorCalificacion: 4.9,
        trabajadorReviews: 89,
        trabajadorVerificado: true,
        mensaje: 'Trabajo aceptado. Confirmo visita para el 22/01.',
        presupuesto: '$35.000',
        fechaPropuesta: '2024-01-22',
        estado: 'aceptada'
      }
    ]
  },
  {
    id: '3',
    titulo: 'Pintura de living comedor',
    descripcion: 'Pintar las 4 paredes del living comedor, aproximadamente 40m2.',
    categoria: 'Pintura',
    estado: 'completada',
    fechaCreacion: '2024-01-05',
    fechaServicio: '2024-01-12',
    ubicacion: 'Buenos Aires, Recoleta',
    presupuesto: '$30.000 - $45.000',
    urgencia: 'Baja',
    solicitudes: []
  }
]

const mockChats: Chat[] = [
  {
    id: '1',
    publicacionId: '1',
    publicacionTitulo: 'Reparacion de tuberia en cocina',
    trabajadorId: '1',
    trabajadorNombre: 'Carlos Rodriguez',
    trabajadorCategoria: 'Plomeria',
    ultimoMensaje: 'Perfecto, entonces confirmo para el jueves a las 10hs.',
    fechaUltimoMensaje: '2024-01-16 14:30',
    noLeidos: 2
  },
  {
    id: '2',
    publicacionId: '2',
    publicacionTitulo: 'Instalacion de aire acondicionado',
    trabajadorId: '3',
    trabajadorNombre: 'Martin Gomez',
    trabajadorCategoria: 'HVAC',
    ultimoMensaje: 'Ya tengo el equipo listo. Nos vemos el lunes.',
    fechaUltimoMensaje: '2024-01-15 18:45',
    noLeidos: 0
  }
]

export default function MisPublicacionesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('publicaciones')
  const [selectedPublicacion, setSelectedPublicacion] = useState<Publicacion | null>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'trabajador', text: 'Hola! Vi tu publicacion y me interesa el trabajo.', time: '14:20' },
    { sender: 'cliente', text: 'Hola Carlos! Gracias por responder. Cuando podrias venir?', time: '14:25' },
    { sender: 'trabajador', text: 'Puedo ir el jueves por la manana, te parece bien?', time: '14:28' },
    { sender: 'trabajador', text: 'Perfecto, entonces confirmo para el jueves a las 10hs.', time: '14:30' }
  ])
  const [filterEstado, setFilterEstado] = useState<PublicacionEstado | 'todas'>('todas')
  const [sessionData, setSessionData] = useState<Publicacion[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('homefix_publicaciones') || '[]')
      setSessionData(stored as Publicacion[])
    } catch {
      setSessionData([])
    }
  }, [])

  const getEstadoBadge = (estado: PublicacionEstado) => {
    const styles = {
      pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
      en_progreso: 'bg-blue-100 text-blue-700 border-blue-200',
      completada: 'bg-green-100 text-green-700 border-green-200',
      cancelada: 'bg-red-100 text-red-700 border-red-200'
    }
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    }
    return (
      <Badge variant="outline" className={`${styles[estado]} border`}>
        {labels[estado]}
      </Badge>
    )
  }

  const allPublicaciones = [...sessionData, ...mockPublicaciones]
  const filteredPublicaciones = filterEstado === 'todas'
    ? allPublicaciones
    : allPublicaciones.filter(p => p.estado === filterEstado)

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages(prev => [...prev, {
        sender: 'cliente',
        text: chatMessage,
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }])
      setChatMessage('')
    }
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-primary py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Publicaciones</h1>
              <p className="text-white/70 mt-1">Gestiona tus solicitudes y conversaciones</p>
            </div>
            <Button
              onClick={() => router.push('/publicacion/nueva')}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Publicacion
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'publicaciones' as Tab, label: 'Publicaciones', icon: FileText, count: allPublicaciones.length },
              { id: 'chats' as Tab, label: 'Chats', icon: MessageSquare, count: mockChats.reduce((acc, c) => acc + c.noLeidos, 0) },
              { id: 'historial' as Tab, label: 'Historial', icon: Clock, count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSelectedPublicacion(null)
                  setSelectedChat(null)
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Publicaciones Tab */}
        {activeTab === 'publicaciones' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de publicaciones */}
            <div className={`lg:col-span-2 space-y-4 ${selectedPublicacion ? 'hidden lg:block' : ''}`}>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {['todas', 'pendiente', 'en_progreso', 'completada'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFilterEstado(estado as PublicacionEstado | 'todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterEstado === estado
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {estado === 'todas' ? 'Todas' : estado === 'en_progreso' ? 'En Progreso' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </button>
                ))}
              </div>

              {filteredPublicaciones.length > 0 ? (
                filteredPublicaciones.map((pub) => (
                  <Card
                    key={pub.id}
                    className={`p-5 border-border hover:shadow-md transition-all cursor-pointer ${
                      selectedPublicacion?.id === pub.id ? 'ring-2 ring-primary/30 border-primary/50' : ''
                    }`}
                    onClick={() => setSelectedPublicacion(pub)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {(pub as any).tipo === 'cita' && (
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                              Cita agendada
                            </Badge>
                          )}
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                            {pub.categoria}
                          </Badge>
                          {getEstadoBadge(pub.estado)}
                        </div>
                        <h3 className="font-bold text-foreground truncate">{pub.titulo}</h3>
                      </div>
                      {pub.solicitudes.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold text-accent">{pub.solicitudes.length}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pub.descripcion}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {pub.fechaServicio}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pub.ubicacion}
                      </span>
                      <span className="font-medium text-foreground">{pub.presupuesto}</span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center border-border">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-bold text-foreground mb-2">No hay publicaciones</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {filterEstado === 'todas' 
                      ? 'Crea tu primera publicacion para recibir ofertas de profesionales.'
                      : 'No hay publicaciones con este estado.'}
                  </p>
                  {filterEstado === 'todas' && (
                    <Button
                      onClick={() => router.push('/publicacion/nueva')}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear publicacion
                    </Button>
                  )}
                </Card>
              )}
            </div>

            {/* Panel de solicitudes */}
            <div className={`lg:col-span-1 ${!selectedPublicacion ? 'hidden lg:block' : ''}`}>
              {selectedPublicacion ? (
                <Card className="p-5 border-border sticky top-20">
                  {/* Mobile close button */}
                  <button
                    onClick={() => setSelectedPublicacion(null)}
                    className="lg:hidden absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mb-4 pb-4 border-b border-border">
                    <h3 className="font-bold text-foreground mb-1">{selectedPublicacion.titulo}</h3>
                    <p className="text-xs text-muted-foreground">{selectedPublicacion.categoria} - {selectedPublicacion.ubicacion}</p>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Solicitudes ({selectedPublicacion.solicitudes.length})
                  </h4>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-4"
                    onClick={() => router.push(`/publicacion/${selectedPublicacion.id}`)}
                  >
                    Ver detalle completo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>

                  {selectedPublicacion.solicitudes.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedPublicacion.solicitudes.map((sol) => (
                        <div
                          key={sol.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            sol.estado === 'aceptada' 
                              ? 'bg-green-50 border-green-200' 
                              : sol.estado === 'rechazada'
                              ? 'bg-red-50 border-red-200 opacity-60'
                              : 'bg-secondary/30 border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground truncate">{sol.trabajadorNombre}</span>
                                {sol.trabajadorVerificado && (
                                  <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {renderStars(sol.trabajadorCalificacion)}
                                <span className="text-xs text-muted-foreground">({sol.trabajadorReviews})</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{sol.mensaje}</p>

                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-muted-foreground">Presupuesto:</span>
                            <span className="font-bold text-foreground">{sol.presupuesto}</span>
                          </div>

                          {sol.estado === 'pendiente' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => router.push(`/worker/${sol.trabajadorId}`)}
                              >
                                Ver perfil
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-accent hover:bg-accent/90 text-white text-xs"
                              >
                                Aceptar
                              </Button>
                            </div>
                          )}

                          {sol.estado === 'aceptada' && (
                            <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aceptado
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Aun no hay solicitudes.<br />Los profesionales veran tu publicacion pronto.
                      </p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-8 border-border text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecciona una publicacion para ver las solicitudes
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de chats */}
            <div className={`lg:col-span-1 space-y-2 ${selectedChat ? 'hidden lg:block' : ''}`}>
              {mockChats.length > 0 ? (
                mockChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`p-4 border-border hover:shadow-md transition-all cursor-pointer ${
                      selectedChat?.id === chat.id ? 'ring-2 ring-primary/30 border-primary/50' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-foreground text-sm truncate">{chat.trabajadorNombre}</h4>
                          {chat.noLeidos > 0 && (
                            <span className="bg-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                              {chat.noLeidos}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{chat.publicacionTitulo}</p>
                        <p className="text-xs text-foreground mt-1 truncate">{chat.ultimoMensaje}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 border-border text-center">
                  <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No tienes conversaciones activas
                  </p>
                </Card>
              )}
            </div>

            {/* Chat window */}
            <div className={`lg:col-span-2 ${!selectedChat ? 'hidden lg:block' : ''}`}>
              {selectedChat ? (
                <Card className="border-border h-[500px] flex flex-col">
                  {/* Chat header */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{selectedChat.trabajadorNombre}</h4>
                      <p className="text-xs text-muted-foreground">{selectedChat.publicacionTitulo}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/worker/${selectedChat.trabajadorId}`)}
                    >
                      Ver perfil
                    </Button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === 'cliente' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.sender === 'cliente'
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-background border border-border text-foreground rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.sender === 'cliente' ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-2.5 border border-input rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                        className="bg-primary hover:bg-primary/90 text-white px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-border h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Selecciona una conversacion para ver los mensajes
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Historial Tab */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            {mockPublicaciones.filter(p => p.estado === 'completada' || p.estado === 'cancelada').length > 0 ? (
              mockPublicaciones
                .filter(p => p.estado === 'completada' || p.estado === 'cancelada')
                .map((pub) => (
                  <Card key={pub.id} className="p-5 border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                            {pub.categoria}
                          </Badge>
                          {getEstadoBadge(pub.estado)}
                        </div>
                        <h3 className="font-bold text-foreground">{pub.titulo}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{pub.descripcion}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {pub.fechaServicio}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {pub.ubicacion}
                          </span>
                        </div>
                      </div>
                      {pub.estado === 'completada' && (
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4 mr-2" />
                          Dejar resena
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
            ) : (
              <Card className="p-12 text-center border-border">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-foreground mb-2">Sin historial</h3>
                <p className="text-sm text-muted-foreground">
                  Aqui apareceran tus publicaciones completadas y canceladas.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
