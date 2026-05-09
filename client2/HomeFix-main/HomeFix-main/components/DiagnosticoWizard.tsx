'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DiagnosticoStep {
  step: number
  question: string
  options: { label: string; value: string }[]
  icon: string
}

const diagnosticoSteps: DiagnosticoStep[] = [
  {
    step: 1,
    question: '¿Qué tipo de reparación necesitas?',
    icon: '🔧',
    options: [
      { label: 'Eléctrica', value: 'electrical' },
      { label: 'Plomería', value: 'plumbing' },
      { label: 'HVAC', value: 'hvac' },
      { label: 'Carpintería', value: 'carpentry' },
      { label: 'Electrónica', value: 'electronics' },
      { label: 'Pintura', value: 'painting' },
      { label: 'Otras', value: 'other' }
    ]
  },
  {
    step: 2,
    question: 'Describe más específicamente el problema',
    icon: '📝',
    options: [
      { label: 'No funciona / Está dañado', value: 'broken' },
      { label: 'Fuga o goteo', value: 'leak' },
      { label: 'No enciende', value: 'power' },
      { label: 'Ruido extraño', value: 'noise' },
      { label: 'Instalación nueva', value: 'new' },
      { label: 'Mantenimiento', value: 'maintenance' }
    ]
  },
  {
    step: 3,
    question: '¿Cuándo necesitas que se resuelva?',
    icon: '⏰',
    options: [
      { label: 'Hoy - Urgente', value: 'today' },
      { label: 'Este fin de semana', value: 'weekend' },
      { label: 'Esta semana', value: 'week' },
      { label: 'Cuando sea posible', value: 'anytime' }
    ]
  }
]

interface DiagnosticoWizardProps {
  onComplete?: (diagnosis: {
    category: string
    problem: string
    urgency: string
    location: string
  }) => void
}

export function DiagnosticoWizard({ onComplete }: DiagnosticoWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [location, setLocation] = useState('')
  const [showResults, setShowResults] = useState(false)

  const handleSelectAnswer = (stepIndex: number, value: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [stepIndex]: value
    })
  }

  const handleNext = () => {
    if (currentStep < diagnosticoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else if (location.trim()) {
      setShowResults(true)
      onComplete?.({
        category: selectedAnswers[0] || '',
        problem: selectedAnswers[1] || '',
        urgency: selectedAnswers[2] || '',
        location
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = selectedAnswers[currentStep] || (currentStep === diagnosticoSteps.length && location.trim())

  if (showResults) {
    return (
      <div className="text-center space-y-6">
        <div className="text-5xl">✓</div>
        <h2 className="text-3xl font-bold text-foreground">Diagnóstico Completado</h2>
        <p className="text-lg text-muted-foreground">
          Hemos identificado exactamente qué necesitas. Ahora te mostraremos los mejores profesionales para tu caso.
        </p>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Ver Profesionales Recomendados
        </Button>
      </div>
    )
  }

  const step = diagnosticoSteps[currentStep]
  const progress = ((currentStep + 1) / (diagnosticoSteps.length + 1)) * 100

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            Paso {currentStep + 1} de {diagnosticoSteps.length + 1}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <Card className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="text-5xl mb-4">{step.icon}</div>
          <h2 className="text-3xl font-bold text-foreground">{step.question}</h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {step.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectAnswer(currentStep, option.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left font-medium ${
                selectedAnswers[currentStep] === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Location Input - Show on last step */}
        {currentStep === diagnosticoSteps.length - 1 && (
          <div className="space-y-2 pt-4 border-t border-border">
            <label className="text-sm font-medium text-foreground">
              ¿Dónde estás ubicado?
            </label>
            <input
              type="text"
              placeholder="Tu zona o dirección..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground"
            />
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Atrás
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 ${canProceed ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-muted text-muted-foreground'}`}
        >
          {currentStep === diagnosticoSteps.length - 1 ? (
            <>Ver Resultados</>
          ) : (
            <>Siguiente</>
          )}
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2">
        {[...Array(diagnosticoSteps.length + 1)].map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx <= currentStep ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
