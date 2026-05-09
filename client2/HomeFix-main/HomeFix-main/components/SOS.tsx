'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Zap, Droplets, Flame, Lock, X, CheckCircle2, Phone, Star, MapPin, Clock, ArrowLeft, MessageSquare } from 'lucide-react'
import { workers } from '@/lib/data/workers'

type EmergencyType = 'electrico' | 'agua' | 'gas' | 'cerrajeria' | null

const emergencyConfig = {
  electrico: { 
    icon: Zap, 
    label: 'Problema Electrico', 
    desc: 'Apagones, cortocircuitos', 
    color: 'text-yellow-500',
    categories: ['Electricista', 'Electrónica']
  },
  agua: { 
    icon: Droplets, 
    label: 'Fuga de Agua', 
    desc: 'Tuberias rotas, inundaciones', 
    color: 'text-blue-500',
    categories: ['Plomería']
  },
  gas: { 
    icon: Flame, 
    label: 'Emergencia Gas', 
    desc: 'Fugas de gas, olor a gas', 
    color: 'text-orange-500',
    categories: ['Plomería']
  },
  cerrajeria: { 
    icon: Lock, 
    label: 'Cerrajeria Urgente', 
    desc: 'Llaves perdidas, cerraduras', 
    color: 'text-purple-500',
    categories: ['Cerrajería']
  }
}

export function SOS({ showForTrabajador = true }: { showForTrabajador?: boolean }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EmergencyType>(null)
  const [isContacting, setIsContacting] = useState(false)
  const [contactedWorker, setContactedWorker] = useState<string | null>(null)

  // Ocultar SOS si es trabajador
  if (!showForTrabajador) {
    return null
  }

  const handleSelectType = (type: EmergencyType) => {
    setSelectedType(type)
  }

  const handleBack = () => {
    setSelectedType(null)
    setContactedWorker(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedType(null)
    setContactedWorker(null)
  }

  const handleContactWorker = (workerId: string) => {
    setIsContacting(true)
    setContactedWorker(workerId)
    
    setTimeout(() => {
      setIsContacting(false)
    }, 2000)
  }

  const handleViewProfile = (workerId: string) => {
    handleClose()
    router.push(`/worker/${workerId}`)
  }

  // Filtrar trabajadores disponibles para urgencia segun el tipo seleccionado
  const getAvailableWorkers = () => {
    if (!selectedType) return []
    
    const config = emergencyConfig[selectedType]
    return workers
      .filter(w => w.disponibleUrgencia && config.categories.some(cat => 
        w.category.toLowerCase().includes(cat.toLowerCase()) || 
        cat.toLowerCase().includes(w.category.toLowerCase())
      ))
      .sort((a, b) => a.distance - b.distance) // Ordenar por cercania
  }

  const availableWorkers = getAvailableWorkers()

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="Emergencia"
      >
        <AlertTriangle className="w-7 h-7 group-hover:animate-pulse" />
      </button>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-card border-border p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Contacto exitoso */}
            {contactedWorker && !isContacting && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Solicitud enviada</h2>
                <p className="text-muted-foreground">
                  Hemos notificado al profesional de tu emergencia. Te contactara en los proximos minutos.
                </p>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">
                    Codigo de referencia: <span className="font-bold text-primary">EM{Date.now().toString().slice(-8)}</span>
                  </p>
                </div>
                <Button onClick={handleClose} className="mt-4 bg-primary hover:bg-primary/90">
                  Cerrar
                </Button>
              </div>
            )}

            {/* Contactando */}
            {isContacting && (
              <div className="text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Contactando profesional...</h2>
                <p className="text-muted-foreground">Enviando tu solicitud de emergencia</p>
              </div>
            )}

            {/* Lista de trabajadores disponibles */}
            {selectedType && !contactedWorker && !isContacting && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleBack}
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Profesionales disponibles
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {emergencyConfig[selectedType].label} - Ordenados por cercania
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleClose}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {availableWorkers.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {availableWorkers.map((worker) => (
                      <Card key={worker.id} className="p-4 border-border hover:border-accent/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <Image
                            src={worker.image}
                            alt={worker.name}
                            width={60}
                            height={60}
                            className="w-14 h-14 rounded-xl object-cover object-[center_15%]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{worker.name}</h3>
                              {worker.verified && (
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{worker.category}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Star className="w-3 h-3 text-accent fill-accent" />
                                {worker.rating} ({worker.reviews})
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {worker.distance} km
                              </span>
                              <span className="flex items-center gap-1 text-accent font-medium">
                                <Clock className="w-3 h-3" />
                                {worker.responseTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleViewProfile(worker.id)}
                          >
                            Ver perfil
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                            onClick={() => handleContactWorker(worker.id)}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Contactar YA
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No hay profesionales disponibles</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      En este momento no hay profesionales de esta categoria disponibles para urgencias.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleBack}
                    >
                      Elegir otra categoria
                    </Button>
                  </div>
                )}

                {availableWorkers.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Solo se muestran profesionales con disponibilidad para urgencias
                  </p>
                )}
              </div>
            )}

            {/* Seleccion de tipo de emergencia */}
            {!selectedType && !contactedWorker && !isContacting && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Solicitud de Emergencia
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selecciona el tipo de emergencia para ver profesionales disponibles
                    </p>
                  </div>
                  <button 
                    onClick={handleClose}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Tipo de emergencia</h3>
                  {(Object.entries(emergencyConfig) as [EmergencyType, typeof emergencyConfig.electrico][]).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className="w-full p-4 text-left border border-border rounded-xl hover:border-destructive/50 hover:bg-destructive/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${config.color}`}>
                          <config.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.desc}</p>
                        </div>
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                          Ver disponibles
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Solo se mostraran profesionales con disponibilidad para urgencias en este momento
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
