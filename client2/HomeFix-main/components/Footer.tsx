'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Shield, CheckCircle2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex items-center">
              <Image
                src="/homefix-logo-negative.png"
                alt="HomeFix"
                width={200}
                height={56}
                className="h-14 w-auto"
                priority
              />
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-sm">
              Plataforma de confianza que conecta hogares con profesionales verificados. 
              Seguridad, transparencia y calidad garantizada en cada servicio.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verificacion Triple
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Seguridad Garantizada
              </div>
            </div>
          </div>

          {/* Plataforma */}
          <div className="space-y-4">
            <h4 className="font-bold text-primary-foreground text-sm">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/search" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Buscar Profesionales
                </Link>
              </li>
              <li>
                <Link href="/diagnostico" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Diagnostico Asistido
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Mi Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Para Profesionales
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h4 className="font-bold text-primary-foreground text-sm">Empresa</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-bold text-primary-foreground text-sm">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Terminos de Servicio
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-primary-foreground/60">
            <p>&copy; 2026 HomeFix. Todos los derechos reservados.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-accent transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-accent transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-accent transition-colors">Instagram</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
