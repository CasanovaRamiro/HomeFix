import { useEffect, useRef, useCallback } from 'react'
import { DiditSdk } from '@didit-protocol/sdk-web'
import { X, Loader2 } from 'lucide-react'
import type { DiditSdkState, VerificationError } from '@didit-protocol/sdk-web'
import logo from '../assets/homefix-logo.png'

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(248, 250, 252, 0.85)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: '94vw',
          maxWidth: '520px',
          height: '90vh',
          maxHeight: '780px',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderBottom: '2px solid #10B981',
          }}
        >
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="HomeFix" style={{ height: '28px', width: 'auto' }} />
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-tight">Verificación de identidad</span>
              <span className="text-slate-400 text-[11px] leading-tight">Proceso seguro con Didit</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
            aria-label="Cerrar verificación"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Loading placeholder */}
        <div className="w-full h-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Cargando verificación…</span>
          </div>
        </div>

        {/* Didit iframe container */}
        <div
          ref={containerRef}
          id="didit-embedded-container"
          className="absolute"
          style={{ top: 56, left: 0, right: 0, bottom: 0 }}
        />
      </div>
    </div>
  )
}
