'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { DiagnosticoWizard } from '@/components/DiagnosticoWizard'
import { Card } from '@/components/ui/card'
import { Zap, Target, Sparkles, HelpCircle, ChevronDown } from 'lucide-react'

export default function DiagnosticoPage() {
  const router = useRouter()
  const [diagnosis, setDiagnosis] = useState<any>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleDiagnosisComplete = (result: any) => {
    setDiagnosis(result)
    setTimeout(() => {
      router.push(`/search?category=${result.category}&location=${result.location}`)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Asistido por Inteligencia Artificial</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground text-balance">
            Diagnostico Inteligente
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Responde algunas preguntas simples y nuestro sistema te conectara con el profesional perfecto para tu problema.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              title: 'Rapido',
              description: 'Solo 2 minutos para completar el diagnostico completo',
              icon: Zap,
            },
            {
              title: 'Preciso',
              description: 'Tecnologia IA para identificar exactamente que necesitas',
              icon: Target,
            },
            {
              title: 'Personalizado',
              description: 'Recomendaciones basadas en tu ubicacion y urgencia',
              icon: Sparkles,
            }
          ].map((card, idx) => (
            <Card key={idx} className="p-8 bg-card border-border text-center space-y-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <card.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </Card>
          ))}
        </div>

        {/* Wizard */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 mb-20">
          <DiagnosticoWizard onComplete={handleDiagnosisComplete} />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">FAQ</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Como funciona el diagnostico de IA?',
                a: 'Nuestro sistema analiza tus respuestas para identificar exactamente que tipo de profesional necesitas. Usa machine learning para conectarte con los mejores especialistas.'
              },
              {
                q: 'Es realmente gratis?',
                a: 'Si, el diagnostico es completamente gratis. Solo pagas cuando contratas a un profesional.'
              },
              {
                q: 'Cuanto tarda en responder un profesional?',
                a: 'El tiempo promedio de respuesta es de 2 horas. Algunos profesionales responden en minutos, especialmente si la solicitud es urgente.'
              },
              {
                q: 'Que pasa si no estoy satisfecho?',
                a: 'Tenemos un proceso completo de resolucion de disputas. Si el trabajo no cumple con tus expectativas, podemos ayudarte a resolverlo.'
              }
            ].map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <Card className={`p-5 transition-all ${openFaq === idx ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-border/80'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium text-foreground">{item.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </div>
                  {openFaq === idx && (
                    <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                  )}
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
