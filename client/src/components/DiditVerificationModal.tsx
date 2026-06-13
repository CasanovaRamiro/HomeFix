import { useEffect, useRef, useCallback } from 'react'
import { DiditSdk } from '@didit-protocol/sdk-web'
import { X, Loader2 } from 'lucide-react'
import type { DiditSdkState, VerificationError } from '@didit-protocol/sdk-web'

interface DiditVerificationModalProps {
  sessionUrl: string
  isOpen: boolean
  onClose: () => void
  onComplete: (sessionId: string, status: string) => void
  onCancelled: () => void
  onFailed: (error: VerificationError) => void
}

export default function DiditVerificationModal({
  sessionUrl,
  isOpen,
  onClose,
  onComplete,
  onCancelled,
  onFailed,
}: DiditVerificationModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sdkStateRef = useRef<DiditSdkState>('idle')

  const handleClose = useCallback(() => {
    DiditSdk.shared.close()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    DiditSdk.shared.onComplete = (result) => {
      switch (result.type) {
        case 'completed':
          if (result.session) {
            onComplete(result.session.sessionId, result.session.status)
          }
          break
        case 'cancelled':
          onCancelled()
          break
        case 'failed':
          if (result.error) {
            onFailed(result.error)
          }
          break
      }
    }

    DiditSdk.shared.onStateChange = (state) => {
      sdkStateRef.current = state
    }

    DiditSdk.shared.startVerification({
      url: sessionUrl,
      configuration: {
        embedded: true,
        embeddedContainerId: 'didit-embedded-container',
        loggingEnabled: import.meta.env.DEV,
        showCloseButton: false,
        showExitConfirmation: true,
        closeModalOnComplete: false,
      },
    })

    return () => {
      DiditSdk.shared.close()
      DiditSdk.shared.onComplete = undefined
      DiditSdk.shared.onStateChange = undefined
    }
  }, [isOpen, sessionUrl, onComplete, onCancelled, onFailed])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="relative w-[90%] max-w-[480px] h-[85vh] max-h-[750px] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
          aria-label="Cerrar verificación"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        <div className="w-full h-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Cargando verificación…</span>
          </div>
        </div>

        <div
          ref={containerRef}
          id="didit-embedded-container"
          className="absolute inset-0"
        />
      </div>
    </div>
  )
}
