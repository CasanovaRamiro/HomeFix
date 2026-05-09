import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SOS } from '@/components/SOS'
import './globals.css'

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-montserrat'
})

export const metadata: Metadata = {
  title: 'HomeFix - Servicios de Reparacion a Domicilio',
  description: 'Conecta con tecnicos verificados para servicios de reparacion a domicilio. Sistema de confianza con verificacion de identidad, matriculas y antecedentes.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <SOS />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
