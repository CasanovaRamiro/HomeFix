'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, ArrowLeft, Camera, CreditCard, User, CheckCircle, 
  AlertCircle, Shield, Upload, X, Loader2, Scan
} from 'lucide-react'

type VerificationMethod = 'document' | 'manual'
type Step = 'method' | 'document-front' | 'document-back' | 'selfie' | 'manual-dni' | 'liveness' | 'processing' | 'result'

export default function VerificacionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [method, setMethod] = useState<VerificationMethod | null>(null)
  const [step, setStep] = useState<Step>('method')
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<'success' | 'pending' | 'failed' | null>(null)
  
  const [documents, setDocuments] = useState({
    dniFront: null as string | null,
    dniBack: null as string | null,
    selfie: null as string | null,
    manualDni: '',
    livenessComplete: false
  })

  const handleFileUpload = (type: 'dniFront' | 'dniBack' | 'selfie') => {
    // Simular subida de archivo
    const fakeUrl = `https://via.placeholder.com/400x250/13243B/FFFFFF?text=${type}`
    setDocuments(prev => ({ ...prev, [type]: fakeUrl }))
  }

  const simulateCapture = (type: 'dniFront' | 'dniBack' | 'selfie') => {
    setIsLoading(true)
    setTimeout(() => {
      handleFileUpload(type)
      setIsLoading(false)
      
      // Auto-advance to next step
      if (type === 'dniFront') setStep('document-back')
      else if (type === 'dniBack') setStep('selfie')
      else if (type === 'selfie') setStep('processing')
    }, 1500)
  }

  const simulateLiveness = () => {
    setIsLoading(true)
    setTimeout(() => {
      setDocuments(prev => ({ ...prev, livenessComplete: true }))
      setIsLoading(false)
      setStep('processing')
    }, 3000)
  }

  const processVerification = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Mock: 90% success rate
      const success = Math.random() > 0.1
      setVerificationResult(success ? 'success' : 'pending')
      setStep('result')
      setIsLoading(false)
    }, 3000)
  }

  const stepTitles: Record<Step, string> = {
    'method': 'Elige tu metodo de verificacion',
    'document-front': 'Captura el frente de tu DNI',
    'document-back': 'Captura el dorso de tu DNI',
    'selfie': 'Captura una selfie',
    'manual-dni': 'Ingresa tu numero de DNI',
    'liveness': 'Prueba de vida',
    'processing': 'Verificando tu identidad',
    'result': 'Resultado de verificacion'
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/homefix-logo.png"
            alt="HomeFix"
            width={160}
            height={44}
            className="h-10 w-auto"
            priority
          />
        </Link>
        {step === 'method' && (
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-muted-foreground">
            Omitir por ahora
          </Button>
        )}
      </header>

      {/* Progress bar */}
      {step !== 'method' && step !== 'result' && (
        <div className="w-full h-1 bg-muted">
          <div 
            className="h-full bg-accent transition-all duration-500"
            style={{ 
              width: step === 'document-front' ? '25%' 
                   : step === 'document-back' ? '50%' 
                   : step === 'selfie' || step === 'manual-dni' ? '75%'
                   : step === 'liveness' || step === 'processing' ? '90%'
                   : '100%'
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Verificacion KYC
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              {stepTitles[step]}
            </h1>
          </div>

          {/* Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Para garantizar la seguridad de nuestra comunidad, necesitamos verificar tu identidad.
              </p>

              <div className="grid gap-4">
                {/* Method 1: Document */}
                <Card 
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    method === 'document' ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setMethod('document')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">DNI + Reconocimiento Facial</h3>
                      <p className="text-sm text-muted-foreground">
                        Sube fotos de tu DNI (frente y dorso) y una selfie para verificacion automatica.
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-accent" /> Rapido
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-accent" /> Automatico
                        </span>
                      </div>
                    </div>
                    {method === 'document' && (
                      <CheckCircle className="w-6 h-6 text-accent" />
                    )}
                  </div>
                </Card>

                {/* Method 2: Manual */}
                <Card 
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    method === 'manual' ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setMethod('manual')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">DNI Manual + Prueba de Vida</h3>
                      <p className="text-sm text-muted-foreground">
                        Ingresa tu numero de DNI manualmente y completa una prueba de vida en video.
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-accent" /> Alternativo
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-accent" /> Seguro
                        </span>
                      </div>
                    </div>
                    {method === 'manual' && (
                      <CheckCircle className="w-6 h-6 text-accent" />
                    )}
                  </div>
                </Card>
              </div>

              <Button 
                onClick={() => {
                  if (method === 'document') setStep('document-front')
                  else if (method === 'manual') setStep('manual-dni')
                }}
                disabled={!method}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                Continuar con verificacion
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Document Front */}
          {step === 'document-front' && (
            <Card className="p-6 space-y-6">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                {documents.dniFront ? (
                  <Image src={documents.dniFront} alt="DNI Frente" fill className="object-cover" />
                ) : (
                  <div className="text-center">
                    <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Frente del DNI</p>
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => simulateCapture('dniFront')}
                  disabled={isLoading}
                  className="w-full h-12 bg-accent hover:bg-accent/90"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Capturar foto
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Asegurate de que el documento sea legible y este bien iluminado
                </p>
              </div>
            </Card>
          )}

          {/* Document Back */}
          {step === 'document-back' && (
            <Card className="p-6 space-y-6">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                {documents.dniBack ? (
                  <Image src={documents.dniBack} alt="DNI Dorso" fill className="object-cover" />
                ) : (
                  <div className="text-center">
                    <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Dorso del DNI</p>
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => simulateCapture('dniBack')}
                  disabled={isLoading}
                  className="w-full h-12 bg-accent hover:bg-accent/90"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Capturar foto
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('document-front')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </Card>
          )}

          {/* Selfie */}
          {step === 'selfie' && (
            <Card className="p-6 space-y-6">
              <div className="aspect-square max-w-xs mx-auto bg-muted rounded-full flex items-center justify-center relative overflow-hidden">
                {documents.selfie ? (
                  <Image src={documents.selfie} alt="Selfie" fill className="object-cover" />
                ) : (
                  <div className="text-center">
                    <User className="w-20 h-20 text-muted-foreground mx-auto" />
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => simulateCapture('selfie')}
                  disabled={isLoading}
                  className="w-full h-12 bg-accent hover:bg-accent/90"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Tomar selfie
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Mira directamente a la camara con buena iluminacion
                </p>
              </div>
            </Card>
          )}

          {/* Manual DNI */}
          {step === 'manual-dni' && (
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Numero de DNI</label>
                  <Input
                    placeholder="12345678"
                    value={documents.manualDni}
                    onChange={(e) => setDocuments(prev => ({ ...prev, manualDni: e.target.value }))}
                    className="h-12 text-center text-lg tracking-widest"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Ingresa los 8 digitos de tu DNI sin puntos ni espacios
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setStep('liveness')}
                  disabled={documents.manualDni.length < 7}
                  className="w-full h-12 bg-accent hover:bg-accent/90"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('method')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cambiar metodo
                </Button>
              </div>
            </Card>
          )}

          {/* Liveness */}
          {step === 'liveness' && (
            <Card className="p-6 space-y-6">
              <div className="aspect-square max-w-xs mx-auto bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                {isLoading ? (
                  <div className="text-center space-y-4">
                    <Scan className="w-20 h-20 text-accent mx-auto animate-pulse" />
                    <p className="text-sm text-muted-foreground">Analizando...</p>
                  </div>
                ) : documents.livenessComplete ? (
                  <CheckCircle className="w-20 h-20 text-accent" />
                ) : (
                  <div className="text-center space-y-3">
                    <User className="w-20 h-20 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground px-4">
                      Seguiras instrucciones para mover tu cabeza y parpadear
                    </p>
                  </div>
                )}
              </div>

              {!documents.livenessComplete && (
                <div className="space-y-3">
                  <Button 
                    onClick={simulateLiveness}
                    disabled={isLoading}
                    className="w-full h-12 bg-accent hover:bg-accent/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Iniciar prueba de vida
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <Card className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Procesando verificacion</h3>
                <p className="text-sm text-muted-foreground">
                  Estamos validando tu informacion. Esto puede tomar unos segundos...
                </p>
              </div>
              {!verificationResult && (
                <Button 
                  onClick={processVerification}
                  className="bg-accent hover:bg-accent/90"
                >
                  Simular resultado
                </Button>
              )}
            </Card>
          )}

          {/* Result */}
          {step === 'result' && (
            <Card className="p-8 text-center space-y-6">
              {verificationResult === 'success' ? (
                <>
                  <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Verificacion exitosa</h3>
                    <p className="text-muted-foreground">
                      Tu identidad ha sido verificada correctamente. Ya puedes acceder a todas las funcionalidades.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/dashboard/trabajador')}
                    className="w-full h-12 bg-accent hover:bg-accent/90"
                  >
                    Ir a mi dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              ) : verificationResult === 'pending' ? (
                <>
                  <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Verificacion en revision</h3>
                    <p className="text-muted-foreground">
                      Tu informacion esta siendo revisada manualmente. Te notificaremos cuando este lista.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Volver al inicio
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                    <X className="w-10 h-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Verificacion fallida</h3>
                    <p className="text-muted-foreground">
                      No pudimos verificar tu identidad. Por favor, intenta nuevamente con documentos mas claros.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setStep('method')
                      setMethod(null)
                      setVerificationResult(null)
                      setDocuments({
                        dniFront: null,
                        dniBack: null,
                        selfie: null,
                        manualDni: '',
                        livenessComplete: false
                      })
                    }}
                    className="w-full h-12 bg-accent hover:bg-accent/90"
                  >
                    Intentar nuevamente
                  </Button>
                </>
              )}
            </Card>
          )}

          {/* Security info */}
          {step === 'method' && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Integracion con Didit KYC - Datos encriptados de extremo a extremo</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
