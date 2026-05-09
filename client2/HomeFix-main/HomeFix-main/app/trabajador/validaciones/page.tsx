'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowLeft,
  Upload,
  FileText,
  Camera,
  MapPin,
  Award,
  X,
  Loader2
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

interface Validacion {
  id: string
  tipo: string
  label: string
  descripcion: string
  status: 'completado' | 'pendiente' | 'en_revision' | 'rechazado'
  fechaCompletado?: string
  fechaVencimiento?: string
  icon: any
  documentos?: string[]
}

const validaciones: Validacion[] = [
  {
    id: 'dni',
    tipo: 'identidad',
    label: 'Verificacion de Identidad (DNI)',
    descripcion: 'Sube fotos del frente y dorso de tu DNI para verificar tu identidad.',
    status: 'completado',
    fechaCompletado: '2024-03-15',
    icon: FileText,
    documentos: ['DNI Frente', 'DNI Dorso', 'Selfie']
  },
  {
    id: 'antecedentes',
    tipo: 'seguridad',
    label: 'Certificado de Antecedentes',
    descripcion: 'Certificado de antecedentes penales emitido por el Registro Nacional de Reincidencia.',
    status: 'completado',
    fechaCompletado: '2024-03-18',
    fechaVencimiento: '2025-03-18',
    icon: Shield,
    documentos: ['Certificado PDF']
  },
  {
    id: 'matricula',
    tipo: 'profesional',
    label: 'Matricula Profesional',
    descripcion: 'Matricula habilitante para ejercer tu profesion (si aplica).',
    status: 'completado',
    fechaCompletado: '2024-03-20',
    icon: Award,
    documentos: ['Matricula PDF', 'Certificado de Habilitacion']
  },
  {
    id: 'domicilio',
    tipo: 'ubicacion',
    label: 'Comprobante de Domicilio',
    descripcion: 'Factura de servicio o documento que acredite tu domicilio actual.',
    status: 'pendiente',
    icon: MapPin,
    documentos: []
  }
]

export default function MisValidacionesPage() {
  const router = useRouter()
  const [selectedValidacion, setSelectedValidacion] = useState<Validacion | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const completadas = validaciones.filter(v => v.status === 'completado').length
  const total = validaciones.length
  const porcentaje = Math.round((completadas / total) * 100)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completado':
        return <Badge className="bg-accent/10 text-accent border-0">Completado</Badge>
      case 'pendiente':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pendiente</Badge>
      case 'en_revision':
        return <Badge className="bg-blue-500/10 text-blue-600 border-0">En Revision</Badge>
      case 'rechazado':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Rechazado</Badge>
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completado':
        return <CheckCircle className="w-6 h-6 text-accent" />
      case 'pendiente':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />
      case 'en_revision':
        return <Clock className="w-6 h-6 text-blue-500" />
      case 'rechazado':
        return <X className="w-6 h-6 text-red-500" />
      default:
        return null
    }
  }

  const handleUpload = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setUploadSuccess(true)
      setTimeout(() => {
        setShowUploadModal(false)
        setUploadSuccess(false)
        setSelectedValidacion(null)
      }, 2000)
    }, 2000)
  }

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
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Validaciones</h1>
            </div>
            <p className="text-white/70">
              Completa todas las validaciones para obtener el sello de profesional verificado
            </p>
          </div>
        </section>

        {/* Progress Bar */}
        <section className="bg-primary/95 border-t border-white/10 py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm">Progreso de verificacion</span>
              <span className="text-white font-bold">{completadas} de {total} completadas</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            {porcentaje === 100 && (
              <div className="flex items-center gap-2 mt-3 text-accent">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Perfil 100% verificado</span>
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Info Card */}
            <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Por que verificarte?</h3>
                  <p className="text-sm text-muted-foreground">
                    Los profesionales verificados reciben <strong>3x mas solicitudes</strong> de trabajo y generan mayor confianza en los clientes. 
                    Tu informacion es tratada de forma confidencial y segura.
                  </p>
                </div>
              </div>
            </Card>

            {/* Validaciones List */}
            <div className="space-y-4">
              {validaciones.map((validacion) => (
                <Card 
                  key={validacion.id}
                  className={`p-6 border-border/50 transition-all ${
                    validacion.status === 'pendiente' ? 'hover:shadow-md cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (validacion.status === 'pendiente') {
                      setSelectedValidacion(validacion)
                      setShowUploadModal(true)
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`p-3 rounded-xl ${
                      validacion.status === 'completado' ? 'bg-accent/10' :
                      validacion.status === 'pendiente' ? 'bg-yellow-500/10' :
                      validacion.status === 'en_revision' ? 'bg-blue-500/10' :
                      'bg-red-500/10'
                    }`}>
                      {getStatusIcon(validacion.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-foreground">{validacion.label}</h3>
                        {getStatusBadge(validacion.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{validacion.descripcion}</p>
                      
                      {validacion.status === 'completado' && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Verificado: {validacion.fechaCompletado}</span>
                          {validacion.fechaVencimiento && (
                            <span>Vence: {validacion.fechaVencimiento}</span>
                          )}
                        </div>
                      )}

                      {validacion.status === 'completado' && validacion.documentos && validacion.documentos.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {validacion.documentos.map((doc, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-secondary/50">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {validacion.status === 'pendiente' && (
                        <Button 
                          size="sm" 
                          className="mt-3 bg-accent hover:bg-accent/90 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedValidacion(validacion)
                            setShowUploadModal(true)
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Documentos
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Help Section */}
            <Card className="p-6 mt-8 border-border/50">
              <h3 className="font-bold text-foreground mb-4">Preguntas Frecuentes</h3>
              <div className="space-y-4">
                {[
                  {
                    q: 'Cuanto tarda el proceso de verificacion?',
                    a: 'La verificacion de documentos tarda entre 24 y 48 horas habiles.'
                  },
                  {
                    q: 'Mis documentos son confidenciales?',
                    a: 'Si, toda tu informacion es tratada de forma segura y no se comparte con terceros.'
                  },
                  {
                    q: 'Que pasa si mi documento es rechazado?',
                    a: 'Recibiras un email con el motivo del rechazo y podras subir un nuevo documento.'
                  }
                ].map((faq, idx) => (
                  <div key={idx}>
                    <p className="font-medium text-foreground">{faq.q}</p>
                    <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Upload Modal */}
      {showUploadModal && selectedValidacion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative">
            <button 
              onClick={() => {
                setShowUploadModal(false)
                setSelectedValidacion(null)
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {!uploadSuccess ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <selectedValidacion.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{selectedValidacion.label}</h3>
                </div>

                <p className="text-muted-foreground mb-6">{selectedValidacion.descripcion}</p>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">Arrastra tu archivo aqui</p>
                  <p className="text-sm text-muted-foreground mb-3">o haz click para seleccionar</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG o PNG (max 5MB)</p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedValidacion(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 bg-accent hover:bg-accent/90 text-white"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Documento
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Documento Enviado</h3>
                <p className="text-muted-foreground">
                  Tu documento sera revisado en las proximas 24-48 horas.
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
