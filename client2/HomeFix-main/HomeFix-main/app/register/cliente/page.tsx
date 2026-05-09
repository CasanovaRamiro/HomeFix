'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building,
  AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Shield
} from 'lucide-react'

export default function ClientRegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    localidad: '',
    password: '',
    confirmPassword: ''
  })

  // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (any non-alphanumeric)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido'
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El telefono es requerido'
    } else if (!/^\d{10,}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'Telefono invalido (min 10 digitos)'
    }

    if (!formData.direccion.trim()) newErrors.direccion = 'La direccion es requerida'
    if (!formData.localidad.trim()) newErrors.localidad = 'La localidad es requerida'

    if (!formData.password) {
      newErrors.password = 'La contrasena es requerida'
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Min 8 caracteres, mayuscula, minuscula, numero y simbolo'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contrasenas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    // Simular registro
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock: verificar si email ya existe
    if (formData.email === 'cliente@demo.com') {
      setErrors({ email: 'Este email ya esta registrado' })
      setIsLoading(false)
      return
    }

    // Exito - redirigir a login
    router.push('/login?registered=true')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const passwordStrength = () => {
    const p = formData.password
    let strength = 0
    if (p.length >= 8) strength++
    if (/[a-z]/.test(p)) strength++
    if (/[A-Z]/.test(p)) strength++
    if (/\d/.test(p)) strength++
    if (/[^A-Za-z\d]/.test(p)) strength++
    return strength
  }

  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-yellow-500', 'bg-accent']
  const strengthLabels = ['Muy debil', 'Debil', 'Regular', 'Buena', 'Excelente']

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
        <Link 
          href="/register" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <User className="w-4 h-4" />
              Registro de Cliente
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Crea tu cuenta de cliente
            </h1>
            <p className="text-muted-foreground">
              Completa tus datos para comenzar a contratar profesionales
            </p>
          </div>

          {/* Form */}
          <Card className="p-6 border border-border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className={`pl-10 h-11 ${errors.nombre ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Apellido</label>
                  <Input
                    placeholder="Perez"
                    value={formData.apellido}
                    onChange={(e) => handleChange('apellido', e.target.value)}
                    className={`h-11 ${errors.apellido ? 'border-destructive' : ''}`}
                  />
                  {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`pl-10 h-11 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Telefono */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Telefono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+54 11 1234-5678"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    className={`pl-10 h-11 ${errors.telefono ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
              </div>

              {/* Direccion y Localidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Direccion</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Av. Corrientes 1234"
                      value={formData.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      className={`pl-10 h-11 ${errors.direccion ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.direccion && <p className="text-xs text-destructive">{errors.direccion}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Localidad</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="CABA"
                      value={formData.localidad}
                      onChange={(e) => handleChange('localidad', e.target.value)}
                      className={`pl-10 h-11 ${errors.localidad ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.localidad && <p className="text-xs text-destructive">{errors.localidad}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contrasena</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`pl-10 pr-10 h-11 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
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
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirmar contrasena</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contrasena"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Crear mi cuenta
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </Card>

          {/* Security */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Tus datos estan protegidos con encriptacion SSL</span>
          </div>

          {/* Login Link */}
          <p className="text-center text-muted-foreground text-sm">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-accent hover:text-accent/80 font-semibold">
              Inicia sesion
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
