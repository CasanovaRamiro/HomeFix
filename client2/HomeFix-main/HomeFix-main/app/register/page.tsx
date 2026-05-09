'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Briefcase, User, Shield, CheckCircle, ArrowRight, Star, Zap } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const roles = [
    {
      id: 'cliente',
      title: 'Soy Cliente',
      subtitle: 'Busco profesionales',
      description: 'Necesito reparaciones o servicios de mantenimiento para mi hogar',
      icon: User,
      features: [
        'Publica trabajos',
        'Accede a profesionales',
        'Sistema de pagos seguro',
        'Califica y deja resenas'
      ],
      href: '/register/cliente',
      gradient: 'from-accent/10 to-accent/5',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      borderHover: 'hover:border-accent'
    },
    {
      id: 'trabajador',
      title: 'Soy Profesional',
      subtitle: 'Ofrezco mis servicios',
      description: 'Quiero ofrecer mis servicios de reparacion y mantenimiento',
      icon: Briefcase,
      features: [
        'Recibe solicitudes de trabajo',
        'Construye tu reputacion',
        'Verificacion de identidad',
        'Cobranza simplificada'
      ],
      href: '/register/trabajador',
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      borderHover: 'hover:border-primary'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="max-w-4xl w-full">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-6">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">Registro rapido en 2 minutos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-4">
              Crea tu cuenta en HomeFix
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <Card
                  key={role.id}
                  onClick={() => router.push(role.href)}
                  className={`relative p-6 sm:p-8 cursor-pointer transition-all duration-300 border-2 border-border ${role.borderHover} hover:shadow-2xl group overflow-hidden`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 ${role.iconColor}`} />
                    </div>

                    {/* Title & Description */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{role.subtitle}</p>
                      <h2 className="text-2xl font-bold text-primary mb-2">
                        {role.title}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 ${role.iconColor} font-semibold group-hover:gap-3 transition-all`}>
                      <span>Continuar</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Datos encriptados</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <span>+15,000 usuarios</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Verificacion segura</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
