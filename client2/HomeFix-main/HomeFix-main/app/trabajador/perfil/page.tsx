'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Star, 
  MapPin, 
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Camera,
  Clock
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// Mock trabajador data
const mockTrabajador = {
  id: '1',
  name: 'Carlos Mendez',
  email: 'trabajador@demo.com',
  phone: '+54 11 5555-1234',
  category: 'Electricista',
  image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=500&fit=crop&crop=face',
  rating: 4.9,
  reviews: 247,
  location: 'Palermo, Buenos Aires',
  bio: 'Electricista matriculado con 15 años de experiencia en instalaciones residenciales y comerciales. Especialista en tableros electricos, cableado estructurado y domotica.',
  verified: true,
  memberSince: 'Marzo 2024',
  completedJobs: 312,
  responseRate: 98,
  responseTime: '< 1 hora',
  availability: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  validaciones: {
    dni: { status: true, label: 'DNI Verificado', date: '2024-03-15' },
    antecedentes: { status: true, label: 'Sin Antecedentes', date: '2024-03-18' },
    matricula: { status: true, label: 'Matricula Profesional', date: '2024-03-20' },
    domicilio: { status: false, label: 'Comprobante Domicilio', date: null }
  }
}

// Mock resenas
const mockResenas = [
  {
    id: '1',
    cliente: 'Maria G.',
    rating: 5,
    comment: 'Excelente trabajo, muy profesional y puntual. Resolvio el problema del tablero en menos de 2 horas.',
    date: '2026-04-28',
    trabajo: 'Revision de tablero electrico'
  },
  {
    id: '2',
    cliente: 'Juan P.',
    rating: 5,
    comment: 'Muy recomendable. Explico todo el proceso y dejo todo impecable.',
    date: '2026-04-15',
    trabajo: 'Instalacion de luces LED'
  },
  {
    id: '3',
    cliente: 'Laura M.',
    rating: 4,
    comment: 'Buen trabajo, llego un poco tarde pero cumplio con todo lo acordado.',
    date: '2026-03-22',
    trabajo: 'Cambio de enchufes'
  }
]

export default function MiPerfilPage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: mockTrabajador.name,
    phone: mockTrabajador.phone,
    bio: mockTrabajador.bio,
    location: mockTrabajador.location
  })
  const [availability, setAvailability] = useState(mockTrabajador.availability)

  const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

  const toggleDay = (day: string) => {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day))
    } else {
      setAvailability([...availability, day])
    }
  }

  const handleSave = () => {
    // En una app real, aqui se guardarian los datos
    setIsEditing(false)
  }

  const validacionesCompletadas = Object.values(mockTrabajador.validaciones).filter(v => v.status).length
  const totalValidaciones = Object.keys(mockTrabajador.validaciones).length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => router.push('/dashboard/trabajador')}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mi Perfil</h1>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-white"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Info Card */}
                <Card className="p-6 border-border/50">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Profile Image */}
                    <div className="relative">
                      <Image
                        src={mockTrabajador.image}
                        alt={mockTrabajador.name}
                        width={120}
                        height={120}
                        className="w-28 h-28 rounded-2xl object-cover"
                      />
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-lg">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {mockTrabajador.verified && !isEditing && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground">Nombre completo</label>
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Telefono</label>
                            <Input
                              value={editData.phone}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Ubicacion</label>
                            <Input
                              value={editData.location}
                              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-foreground">{mockTrabajador.name}</h2>
                            {mockTrabajador.verified && (
                              <Badge className="bg-accent/10 text-accent border-0">Verificado</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-4">{mockTrabajador.category}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {mockTrabajador.location}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {mockTrabajador.phone}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {mockTrabajador.email}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              Miembro desde {mockTrabajador.memberSince}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Bio */}
                <Card className="p-6 border-border/50">
                  <h3 className="font-bold text-foreground mb-3">Sobre mi</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="w-full h-32 p-3 rounded-lg border border-border bg-background text-foreground resize-none"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{mockTrabajador.bio}</p>
                  )}
                </Card>

                {/* Disponibilidad */}
                <Card className="p-6 border-border/50">
                  <h3 className="font-bold text-foreground mb-4">Disponibilidad</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {diasSemana.map((day) => (
                      <button
                        key={day}
                        onClick={() => isEditing && toggleDay(day)}
                        disabled={!isEditing}
                        className={`p-3 rounded-lg text-center text-sm font-medium transition-colors ${
                          availability.includes(day)
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                        } ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Resenas */}
                <Card className="p-6 border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground">Resenas Recientes</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                      <span className="font-bold text-foreground">{mockTrabajador.rating}</span>
                      <span className="text-muted-foreground">({mockTrabajador.reviews})</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {mockResenas.map((resena) => (
                      <div key={resena.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-foreground">{resena.cliente}</p>
                            <p className="text-xs text-muted-foreground">{resena.trabajo}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < resena.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{resena.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">{resena.date}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Column - Stats & Validations */}
              <div className="space-y-6">
                
                {/* Stats */}
                <Card className="p-6 border-border/50">
                  <h3 className="font-bold text-foreground mb-4">Estadisticas</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Trabajos Completados', value: mockTrabajador.completedJobs, icon: Briefcase },
                      { label: 'Calificacion', value: mockTrabajador.rating, icon: Star },
                      { label: 'Tasa de Respuesta', value: `${mockTrabajador.responseRate}%`, icon: CheckCircle },
                      { label: 'Tiempo de Respuesta', value: mockTrabajador.responseTime, icon: Clock },
                    ].map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <stat.icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className="font-bold text-foreground">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Validaciones */}
                <Card className="p-6 border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Validaciones
                    </h3>
                    <Badge className="bg-accent/10 text-accent border-0">
                      {validacionesCompletadas}/{totalValidaciones}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(mockTrabajador.validaciones).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {value.status ? (
                            <CheckCircle className="w-5 h-5 text-accent" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{value.label}</p>
                            {value.date && (
                              <p className="text-xs text-muted-foreground">{value.date}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {validacionesCompletadas < totalValidaciones && (
                    <Button 
                      className="w-full mt-4 bg-accent hover:bg-accent/90 text-white"
                      onClick={() => router.push('/trabajador/validaciones')}
                    >
                      Completar Validaciones
                    </Button>
                  )}
                </Card>

                {/* Vista previa */}
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <h3 className="font-bold text-foreground mb-2">Vista previa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Asi ven los clientes tu perfil publico.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary/10"
                    onClick={() => router.push(`/worker/${mockTrabajador.id}`)}
                  >
                    Ver mi perfil publico
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
