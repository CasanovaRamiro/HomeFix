'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Menu, X, Home, Search, FileText, Calendar, User,
  Briefcase, ShieldCheck, ClipboardList, LogOut, ChevronDown
} from 'lucide-react'

type UserRole = 'guest' | 'cliente' | 'trabajador'

// Simple session simulation based on the current path / sessionStorage
function useSession(): { role: UserRole; name: string; logout: () => void } {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('guest')
  const [name, setName] = useState('')

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem('homefix_session') || 'null')
      if (session?.role) {
        setRole(session.role)
        setName(session.name || '')
      }
    } catch {
      setRole('guest')
    }
  }, [])

  const logout = () => {
    sessionStorage.removeItem('homefix_session')
    setRole('guest')
    router.push('/')
  }

  return { role, name, logout }
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { role, name, logout } = useSession()

  const clienteLinks = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/search', label: 'Buscar Profesionales', icon: Search },
    { href: '/publicacion/nueva', label: 'Nueva Solicitud', icon: FileText },
    { href: '/mis-publicaciones', label: 'Mis Publicaciones', icon: ClipboardList },
  ]

  const trabajadorLinks = [
    { href: '/dashboard/trabajador', label: 'Inicio', icon: Home },
    { href: '/trabajador/trabajos', label: 'Trabajos Disponibles', icon: Briefcase },
    { href: '/trabajador/mis-postulaciones', label: 'Mis Postulaciones', icon: ClipboardList },
    { href: '/trabajador/validaciones', label: 'Validaciones', icon: ShieldCheck },
  ]

  const guestLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/search', label: 'Buscar Profesionales' },
    { href: '/trabajadores', label: 'Soy Profesional' },
  ]

  const navLinks = role === 'cliente' ? clienteLinks : role === 'trabajador' ? trabajadorLinks : guestLinks

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">

          {/* Logo */}
          <Link href={role === 'cliente' ? '/dashboard' : role === 'trabajador' ? '/dashboard/trabajador' : '/'} className="flex items-center flex-shrink-0">
            <Image
              src="/homefix-logo.png"
              alt="HomeFix"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {(navLinks as { href: string; label: string; icon?: React.ComponentType<{ className?: string }> }[]).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-secondary/60'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {role === 'guest' ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary font-medium">
                    Iniciar Sesion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    Registrarse
                  </Button>
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {name ? name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{name || 'Mi cuenta'}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-background border border-border rounded-xl shadow-xl py-1 z-50">
                    <Link
                      href={role === 'trabajador' ? '/trabajador/perfil' : '/dashboard'}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Mi Perfil
                    </Link>
                    {role === 'trabajador' && (
                      <Link
                        href="/trabajador/validaciones"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        Mis Validaciones
                      </Link>
                    )}
                    {role === 'cliente' && (
                      <Link
                        href="/agendar"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Mis Citas
                      </Link>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout() }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesion
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-1">
              {(navLinks as { href: string; label: string; icon?: React.ComponentType<{ className?: string }> }[]).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary/8 text-primary'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-3 px-4">
              {role === 'guest' ? (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-primary text-primary">Iniciar Sesion</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Registrarse</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={role === 'trabajador' ? '/trabajador/perfil' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full border-border flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Mi Perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/5 flex items-center gap-2"
                    onClick={() => { setMobileMenuOpen(false); logout() }}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesion
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
