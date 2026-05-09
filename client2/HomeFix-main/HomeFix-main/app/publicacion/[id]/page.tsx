'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Star,
  MessageSquare,
  User,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
  Send,
  Check,
  XCircle
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'

// Mock data for the publication
const mockPublicacion = {
  id: '1',
  titulo: 'Reparacion de tuberia en cocina',
  descripcion: 'Necesito reparar una tuberia que tiene fuga debajo del lavabo de la cocina. Es urgente.',
  categoria: 'Plomeria',
  estado: 'Pendiente',
  fechaPublicacion: '2024-01-15',
  ubicacion: 'Lima, Peru',
  presupuesto: 'S/ 150 - S/ 300'
}

// Mock data for applicants
const mockPostulantes = [
  {
    id: '1',
    nombre: 'Carlos Rodriguez',
    categoriaPrincipal: 'Plomeria',
    categorias: ['Plomeria', 'Gasfiteria'],
    calificacion: 4.8,
    totalReviews: 47,
    descripcion: 'Plomero profesional con mas de 10 anos de experiencia. Especializado en reparaciones de emergencia y mantenimiento preventivo.',
    ubicacion: 'San Isidro, Lima',
    trabajosCompletados: 156,
    tiempoRespuesta: '< 1 hora',
    verificado: true,
    reviews: [
      { id: '1', autor: 'Maria G.', calificacion: 5, comentario: 'Excelente trabajo, muy puntual y profesional.', fecha: '2024-01-10' },
      { id: '2', autor: 'Juan P.', calificacion: 5, comentario: 'Soluciono el problema rapido y a buen precio.', fecha: '2024-01-05' },
    ]
  },
  {
    id: '2',
    nombre: 'Luis Fernandez',
    categoriaPrincipal: 'Plomeria',
    categorias: ['Plomeria', 'Instalaciones Sanitarias'],
    calificacion: 4.5,
    totalReviews: 23,
    descripcion: 'Tecnico en plomeria y gasfiteria. Trabajo con garantia de satisfaccion.',
    ubicacion: 'Miraflores, Lima',
    trabajosCompletados: 89,
    tiempoRespuesta: '< 2 horas',
    verificado: true,
    reviews: [
      { id: '1', autor: 'Ana R.', calificacion: 4, comentario: 'Buen servicio, precios justos.', fecha: '2024-01-08' },
    ]
  },
  {
    id: '3',
    nombre: 'Pedro Martinez',
    categoriaPrincipal: 'Plomeria',
    categorias: ['Plomeria'],
    calificacion: 4.2,
    totalReviews: 12,
    descripcion: 'Plomero con 5 anos de experiencia. Disponible para trabajos de emergencia.',
    ubicacion: 'Surco, Lima',
    trabajosCompletados: 45,
    tiempoRespuesta: '< 3 horas',
    verificado: false,
    reviews: []
  }
]

type Postulante = typeof mockPostulantes[0]

export default function PostulantesPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; timestamp: string }[]>([])

  const handleVerPerfil = (postulante: Postulante) => {
    setSelectedPostulante(postulante)
  }

  const handleCerrarPerfil = () => {
    setSelectedPostulante(null)
  }

  const handleIniciarChat = (postulante: Postulante) => {
    setSelectedPostulante(postulante)
    setShowChat(true)
    setChatMessages([])
  }

  const handleCerrarChat = () => {
    setShowChat(false)
  }

  const handleAceptarPostulante = (postulante: Postulante, e: React.MouseEvent) => {
    e.stopPropagation()
    // Aqui iria la logica para aceptar al postulante
    alert(`Has aceptado a ${postulante.nombre} para el trabajo.`)
  }

  const handleRechazarPostulante = (postulante: Postulante, e: React.MouseEvent) => {
    e.stopPropagation()
    // Aqui iria la logica para rechazar al postulante
    alert(`Has rechazado a ${postulante.nombre}.`)
  }

  const handleEnviarMensaje = () => {
    if (chatMessage.trim() && selectedPostulante) {
      const nuevoMensaje = {
        sender: 'cliente',
        text: chatMessage,
        timestamp: new Date().toISOString()
      }
      setChatMessages([...chatMessages, nuevoMensaje])
      setChatMessage('')

      // Simular respuesta
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'trabajador',
            text: 'Gracias por contactarme. Estoy disponible para realizar el trabajo. Podemos coordinar la visita?',
            timestamp: new Date().toISOString()
          }
        ])
      }, 1000)
    }
  }

  const renderStars = (calificacion: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= calificacion
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
              }`}
          />
        ))}
      </div>
    )
  }

  // Si la publicacion no esta en estado "Pendiente", no mostrar postulantes
  if (mockPublicacion.estado !== 'Pendiente') {
    return (
      <main className="min-h-screen bg-secondary/30">
        <div className="bg-primary py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/mis-publicaciones" className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mis publicaciones
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Postulantes</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-12 text-center bg-background border-border">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No hay postulantes disponibles</h2>
            <p className="text-muted-foreground">Solo puedes ver postulantes cuando la publicacion esta en estado &quot;Pendiente&quot;.</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-secondary/30">
      {/* Navbar */}
      <Navbar />

      {/* Header */}
      <div className="bg-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Postulantes</h1>
          <p className="text-white/70">{mockPublicacion.titulo}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12">
        {/* Publication Summary Card */}
        <Card className="p-5 mb-6 bg-background border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {mockPublicacion.categoria}
                </Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">
                  {mockPublicacion.estado}
                </Badge>
              </div>
              <h2 className="font-bold text-foreground">{mockPublicacion.titulo}</h2>
              <p className="text-sm text-muted-foreground mt-1">{mockPublicacion.descripcion}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {mockPublicacion.ubicacion}
              </span>
              <span className="font-semibold text-foreground">{mockPublicacion.presupuesto}</span>
            </div>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applicants List */}
          <div className={`lg:col-span-2 ${selectedPostulante && !showChat ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {mockPostulantes.length} Postulantes
              </h2>
            </div>

            {mockPostulantes.length > 0 ? (
              <div className="space-y-4">
                {mockPostulantes.map((postulante) => (
                  <Card
                    key={postulante.id}
                    className="p-5 bg-background border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVerPerfil(postulante)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{postulante.nombre}</h3>
                            {postulante.verificado && (
                              <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{postulante.categoriaPrincipal}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(postulante.calificacion)}
                          <span className="text-sm font-semibold text-foreground">{postulante.calificacion}</span>
                          <span className="text-sm text-muted-foreground">({postulante.totalReviews} resenas)</span>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {postulante.trabajosCompletados} trabajos
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {postulante.tiempoRespuesta}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {postulante.ubicacion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerPerfil(postulante)
                        }}
                      >
                        Ver perfil
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleIniciarChat(postulante)
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Iniciar chat
                      </Button>
                      <Button
                        size="sm"
                        className="bg-accent hover:bg-accent/90 text-white flex-1 sm:flex-none"
                        onClick={(e) => handleAceptarPostulante(postulante, e)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Contratar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white flex-1 sm:flex-none"
                        onClick={(e) => handleRechazarPostulante(postulante, e)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-background border-border">
                <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-foreground mb-2">Aun no hay postulantes</h3>
                <p className="text-muted-foreground">Los trabajadores interesados apareceran aqui.</p>
              </Card>
            )}
          </div>

          {/* Profile Panel / Chat Panel */}
          <div className={`lg:col-span-1 ${!selectedPostulante ? 'hidden lg:block' : ''}`}>
            {selectedPostulante && !showChat && (
              <Card className="p-5 bg-background border-border sticky top-6">
                {/* Close button for mobile */}
                <button
                  onClick={handleCerrarPerfil}
                  className="lg:hidden absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-foreground">{selectedPostulante.nombre}</h3>
                    {selectedPostulante.verificado && (
                      <CheckCircle className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedPostulante.categoriaPrincipal}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {renderStars(selectedPostulante.calificacion)}
                  <span className="font-bold text-foreground">{selectedPostulante.calificacion}</span>
                  <span className="text-sm text-muted-foreground">({selectedPostulante.totalReviews})</span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  {selectedPostulante.descripcion}
                </p>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categorias</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPostulante.categorias.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-secondary text-foreground">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-xl mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedPostulante.trabajosCompletados}</p>
                    <p className="text-xs text-muted-foreground">Trabajos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedPostulante.tiempoRespuesta}</p>
                    <p className="text-xs text-muted-foreground">Respuesta</p>
                  </div>
                </div>

                {/* Reviews */}
                {selectedPostulante.reviews.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resenas recientes</h4>
                    <div className="space-y-3">
                      {selectedPostulante.reviews.slice(0, 2).map((review) => (
                        <div key={review.id} className="p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground">{review.autor}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(review.calificacion)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{review.comentario}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={() => handleIniciarChat(selectedPostulante)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Iniciar conversacion
                </Button>
              </Card>
            )}

            {/* Chat Panel */}
            {selectedPostulante && showChat && (
              <Card className="p-5 bg-background border-border sticky top-6">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{selectedPostulante.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{selectedPostulante.categoriaPrincipal}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCerrarChat}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="bg-secondary/30 rounded-xl h-80 overflow-y-auto p-4 space-y-3 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Inicia la conversacion con {selectedPostulante.nombre}</p>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'cliente'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-background border border-border text-foreground rounded-bl-md'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                    className="flex-1 px-4 py-3 border border-input rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                  <Button
                    onClick={handleEnviarMensaje}
                    className="bg-accent hover:bg-accent/90 text-white px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Solo tu puedes iniciar la conversacion
                </p>
              </Card>
            )}

            {/* Empty State for Desktop */}
            {!selectedPostulante && (
              <Card className="p-8 bg-background border-border text-center hidden lg:block">
                <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecciona un postulante para ver su perfil
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
