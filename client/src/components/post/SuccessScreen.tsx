import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'

interface Props {
  onGoHome: () => void
  children?: ReactNode
}

export default function SuccessScreen({ onGoHome, children }: Props) {
  return (
    <div className="text-center py-10">
      <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-secondary" />
      </div>
      <h2 className="text-2xl font-bold text-primary-dark mb-2">
        {children || '¡Solicitud publicada con éxito!'}
      </h2>
      <p className="text-muted mb-6">
        Pronto recibirás respuestas de profesionales cercanos.
      </p>
      <button
        onClick={onGoHome}
        className="w-full py-4 px-4 rounded-xl font-semibold text-base border-none cursor-pointer
          bg-secondary text-white hover:bg-secondary-hover hover:scale-105 transition-all duration-300"
      >
        Volver al inicio
      </button>
    </div>
  )
}
