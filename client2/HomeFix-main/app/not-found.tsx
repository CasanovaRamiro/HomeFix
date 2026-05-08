'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold text-foreground">
            Página No Encontrada
          </h2>
        </div>

        <p className="text-lg text-muted-foreground">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white">
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/search" className="block">
            <Button size="lg" variant="outline" className="w-full">
              Buscar Profesionales
            </Button>
          </Link>
        </div>

        <div className="text-5xl">🔧</div>
      </div>
    </main>
  )
}
