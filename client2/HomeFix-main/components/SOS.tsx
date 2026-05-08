'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, Zap, Droplets, Flame, Snowflake, X, CheckCircle2, Phone } from 'lucide-react'

export function SOS() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)

  const handleEmergency = () => {
    setIsEmergency(true)
    setTimeout(() => {
      setIsEmergency(false)
      setIsOpen(false)
    }, 4000)
  }

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="Emergencia"
      >
        <AlertTriangle className="w-7 h-7 group-hover:animate-pulse" />
      </button>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border-border p-6">
            {isEmergency ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Ayuda en camino</h2>
                <p className="text-muted-foreground">
                  Hemos notificado a tecnicos de emergencia en tu area. Te contactaran en los proximos minutos.
                </p>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">
                    Codigo de referencia: <span className="font-bold text-primary">EM2024041845</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Solicitud de Emergencia
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Conectamos contigo con tecnicos de emergencia verificados.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Tipo de emergencia</h3>
                  {[
                    { icon: Zap, label: 'Problema Electrico', desc: 'Apagones, cortocircuitos', color: 'text-yellow-500' },
                    { icon: Droplets, label: 'Fuga de Agua', desc: 'Tuberias rotas, inundaciones', color: 'text-blue-500' },
                    { icon: Flame, label: 'Emergencia Gas', desc: 'Fugas de gas, olor a gas', color: 'text-orange-500' },
                    { icon: Snowflake, label: 'HVAC Critico', desc: 'Sin calefaccion o aire', color: 'text-cyan-500' }
                  ].map((emergency, idx) => (
                    <button
                      key={idx}
                      onClick={handleEmergency}
                      className="w-full p-4 text-left border border-border rounded-xl hover:border-destructive/50 hover:bg-destructive/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${emergency.color}`}>
                          <emergency.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{emergency.label}</p>
                          <p className="text-xs text-muted-foreground">{emergency.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                  <Button
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12"
                    onClick={handleEmergency}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Solicitar Ayuda Inmediata
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Tecnicos certificados. Tiempo de respuesta: 15-30 min
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
