'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { categories } from '@/lib/data/categories'
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, Briefcase,
  AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Shield, Check
} from 'lucide-react'

export default function WorkerRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    categorias: [] as string[]
  })

  // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (any non-alphanumeric)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (formData.categorias.length === 0) {
      newErrors.categorias = 'Debes seleccionar al menos una categoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    setIsLoading(true)

    // Simular registro
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock: verificar si email ya existe
    if (formData.email === 'trabajador@demo.com') {
      setErrors({ email: 'Este email ya esta registrado' })
      setStep(1)
      setIsLoading(false)
      return
    }

    // Exito - redirigir a verificacion KYC
    router.push('/verificacion')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoryId)
        ? prev.categorias.filter(c => c !== categoryId)
        : [...prev.categorias, categoryId]
    }))
    if (errors.categorias) {
      setErrors(prev => ({ ...prev, categorias: '' }))
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
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-accent' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Datos personales</span>
            </div>
            <div className={`w-12 h-0.5 ${step > 1 ? 'bg-accent' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-accent' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Especialidades</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Briefcase className="w-4 h-4" />
              Registro de Profesional
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              {step === 1 ? 'Ingresa tus datos' : 'Selecciona tus especialidades'}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 
                ? 'Completa tu informacion personal para crear tu cuenta'
                : 'Elige las categorias en las que te especializas'
              }
            </p>
          </div>

          {/* Form */}
          <Card className="p-6 border border-border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <>
                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Carlos"
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
                        placeholder="Rodriguez"
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

                  {/* Next Button */}
                  <Button 
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      Continuar
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Categories Selection */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Selecciona una o mas categorias donde ofreces tus servicios:
                    </p>
                    
                    {errors.categorias && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{errors.categorias}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => {
                        const isSelected = formData.categorias.includes(category.id)
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected 
                                ? 'border-accent bg-accent/5' 
                                : 'border-border hover:border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
                                <Image
                                  src={category.image}
                                  alt={category.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{category.name}</p>
                                <p className="text-xs text-muted-foreground">{category.count}+ trabajos</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {formData.categorias.length > 0 && (
                      <p className="text-sm text-accent font-medium">
                        {formData.categorias.length} categoria{formData.categorias.length > 1 ? 's' : ''} seleccionada{formData.categorias.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Atras
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Crear cuenta
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Card>

          {/* Info for step 2 */}
          {step === 2 && (
            <Card className="p-4 bg-primary/5 border-primary/10">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Verificacion requerida</p>
                  <p className="text-muted-foreground mt-1">
                    Despues de crear tu cuenta, deberas verificar tu identidad para comenzar a recibir trabajos.
                  </p>
                </div>
              </div>
            </Card>
          )}

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
