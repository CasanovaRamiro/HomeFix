'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/homefix-logo.png"
              alt="HomeFix"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Buscar Profesionales
            </Link>
            <Link href="/diagnostico" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Diagnostico
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Trabajá con nosotros
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
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
              <Link
                href="/"
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/search"
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Buscar Profesionales
              </Link>
              <Link
                href="/diagnostico"
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Diagnostico
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-3 px-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-primary text-primary">Iniciar Sesion</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Registrarse</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
