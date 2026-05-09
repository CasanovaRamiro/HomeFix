'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const mockUsers = [
    { email: 'cliente@demo.com', password: 'Demo123!', role: 'CLIENT', name: 'Juan Cliente', verified: true },
    { email: 'trabajador@demo.com', password: 'Demo123!', role: 'WORKER', name: 'Carlos Electricista', verified: true, kycStatus: 'VERIFIED' },
    { email: 'pendiente@demo.com', password: 'Demo123!', role: 'WORKER', name: 'Maria Plomera', verified: true, kycStatus: 'PENDING_KYC' },
  ]

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Por favor ingresa un email valido')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = mockUsers.find(u => u.email === formData.email)

    if (!user) {
      setError('El email no esta registrado')
      setIsLoading(false)
      return
    }

    if (user.password !== formData.password) {
      setError('Contrasena incorrecta')
      setIsLoading(false)
      return
    }

    // Guardar sesion en sessionStorage para el Navbar
    const sessionRole = user.role === 'WORKER' ? 'trabajador' : 'cliente'
    sessionStorage.setItem('homefix_session', JSON.stringify({
      role: sessionRole,
      name: user.name,
      email: user.email
    }))

    if (user.role === 'WORKER') {
      if (user.kycStatus === 'PENDING_KYC') {
        router.push('/verificacion')
      } else if (user.kycStatus === 'REJECTED') {
        setError('Tu cuenta ha sido rechazada. Contacta soporte.')
        setIsLoading(false)
        return
      } else {
        router.push('/dashboard/trabajador')
      }
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-block mb-12">
            <Image
              src="/homefix-logo.png"
              alt="HomeFix"
              width={180}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="mt-3 text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-14 text-base bg-secondary/30 border-border/50 focus:border-accent focus:ring-accent/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Contrasena
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contrasena"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 pr-12 h-14 text-base bg-secondary/30 border-border/50 focus:border-accent focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold text-base shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar Sesion
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">o</span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-muted-foreground">
            No tienes una cuenta?{' '}
            <Link href="/register" className="text-accent hover:text-accent/80 font-semibold transition-colors">
              Registrate gratis
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-secondary/30 border border-dashed border-border/50 rounded-xl">
            <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider">Credenciales de prueba</p>
            <div className="space-y-2 text-xs text-muted-foreground font-mono">
              <p><span className="text-foreground">Cliente:</span> cliente@demo.com / Demo123!</p>
              <p><span className="text-foreground">Trabajador:</span> trabajador@demo.com / Demo123!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary">
        {/* Background Image */}
        <Image
          src="/hero-bg.jpg"
          alt="HomeFix Professional"
          fill
          className="object-cover opacity-30"
          priority
        />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full w-fit border border-white/10">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white">Plataforma 100% Segura</span>
          </div>

          {/* Center Content */}
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Tu hogar merece las mejores manos
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-10">
              Conectamos a mas de 15,000 profesionales verificados con familias que buscan soluciones confiables para su hogar.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '15K+', label: 'Profesionales' },
                { value: '50K+', label: 'Trabajos' },
                { value: '4.9', label: 'Calificacion' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-3xl xl:text-4xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/90 italic mb-4">
              &quot;Encontre un electricista verificado en minutos. El proceso fue simple y el trabajo impecable.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Maria Gonzalez</p>
                <p className="text-xs text-white/60">Cliente verificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
