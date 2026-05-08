'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Mail, ArrowLeft, ArrowRight, CheckCircle, Lock, 
  Eye, EyeOff, Shield, AlertCircle 
} from 'lucide-react'

type Step = 'email' | 'sent' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  })

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email valido')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep('sent')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwords.password) {
      setError('Por favor ingresa una contrasena')
      return
    }

    if (!passwordRegex.test(passwords.password)) {
      setError('La contrasena debe tener min 8 caracteres, mayuscula, minuscula, numero y simbolo')
      return
    }

    if (passwords.password !== passwords.confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep('success')
  }

  const passwordStrength = () => {
    const p = passwords.password
    let strength = 0
    if (p.length >= 8) strength++
    if (/[a-z]/.test(p)) strength++
    if (/[A-Z]/.test(p)) strength++
    if (/\d/.test(p)) strength++
    if (/[@$!%*?&]/.test(p)) strength++
    return strength
  }

  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-yellow-500', 'bg-accent']
  const strengthLabels = ['Muy debil', 'Debil', 'Regular', 'Buena', 'Excelente']

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border py-4 px-6">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          
          {/* Email Step */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Recupera tu contrasena
                </h1>
                <p className="text-muted-foreground">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena
                </p>
              </div>

              <Card className="p-6">
                <form onSubmit={handleSendEmail} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-accent hover:bg-accent/90 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Enviar enlace
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </Card>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al login</span>
              </Link>
            </>
          )}

          {/* Email Sent Step */}
          {step === 'sent' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Revisa tu email
                </h1>
                <p className="text-muted-foreground">
                  Hemos enviado un enlace de recuperacion a <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <Card className="p-6 space-y-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>El enlace expirara en <strong className="text-foreground">10 minutos</strong>.</p>
                  <p>Si no ves el email, revisa tu carpeta de spam.</p>
                </div>

                {/* Mock button to simulate clicking the link */}
                <Button 
                  onClick={() => setStep('reset')}
                  className="w-full h-12 bg-accent hover:bg-accent/90 font-semibold"
                >
                  Simular click en enlace
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => setStep('email')}
                  className="w-full"
                >
                  Enviar de nuevo
                </Button>
              </Card>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al login</span>
              </Link>
            </>
          )}

          {/* Reset Password Step */}
          {step === 'reset' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Crea tu nueva contrasena
                </h1>
                <p className="text-muted-foreground">
                  Ingresa una contrasena segura para tu cuenta
                </p>
              </div>

              <Card className="p-6">
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nueva contrasena</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 caracteres"
                        value={passwords.password}
                        onChange={(e) => setPasswords(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-11 pr-11 h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwords.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${
                                i < passwordStrength() ? strengthColors[passwordStrength() - 1] : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fortaleza: {strengthLabels[passwordStrength() - 1] || 'Muy debil'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirmar contrasena</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite tu contrasena"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pl-11 pr-11 h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-accent hover:bg-accent/90 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      'Guardar nueva contrasena'
                    )}
                  </Button>
                </form>
              </Card>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Todas las sesiones activas seran cerradas</span>
              </div>
            </>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Contrasena actualizada
                </h1>
                <p className="text-muted-foreground">
                  Tu contrasena ha sido cambiada exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.
                </p>
              </div>

              <Card className="p-6">
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-accent hover:bg-accent/90 font-semibold"
                >
                  Ir al login
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
