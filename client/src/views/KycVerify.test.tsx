import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserRole } from '../types/user'
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import KycVerify from './KycVerify'
import * as kycService from '../services/kyc'
import type { KycStatus, KycStatusResponse } from '../services/kyc'

vi.mock('../services/kyc', () => ({
  startKycVerification: vi.fn(),
  confirmKycSession: vi.fn(),
  fetchKycStatus: vi.fn(),
}))

vi.mock('../components/DiditVerificationModal', () => ({
  default: ({
    isOpen,
    onComplete,
  }: {
    isOpen: boolean
    onComplete: (sessionId: string, status: string) => void
  }): ReactNode => isOpen ? (
    <div data-testid="didit-modal">
      <button type="button" onClick={() => onComplete('sess-modal', 'Approved')}>
        Completar verificación
      </button>
    </div>
  ) : null,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: (): {
    user: { id: string; name: string; email: string; role: UserRole }
    isLoggedIn: boolean
  } => ({
    user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: UserRole.Worker },
    isLoggedIn: true,
  }),
}))

const defaultStatus: KycStatusResponse = {
  kycStatus: 'NOT_STARTED',
  kycVerifiedAt: null,
  diditVerificationId: null,
}

function statusResponse(kycStatus: KycStatus): KycStatusResponse {
  return { ...defaultStatus, kycStatus }
}

function renderAt(path = '/kyc'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/kyc" element={<KycVerify />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('KycVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(kycService.fetchKycStatus).mockResolvedValue(defaultStatus)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('carga inicial', () => {
    it('muestra una pantalla de carga mientras consulta el estado', () => {
      vi.mocked(kycService.fetchKycStatus).mockImplementation(
        () => new Promise(() => {}),
      )

      renderAt()

      expect(screen.getByText('Cargando…')).toBeInTheDocument()
      expect(kycService.fetchKycStatus).toHaveBeenCalledTimes(1)
    })

    it('consulta el estado y muestra la vista inicial para NOT_STARTED', async () => {
      renderAt()

      expect(await screen.findByText('Verificá tu identidad')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar verificación/i })).toBeInTheDocument()
      expect(kycService.fetchKycStatus).toHaveBeenCalledTimes(1)
    })

    it('vuelve a la vista inicial cuando falla la consulta del estado', async () => {
      vi.mocked(kycService.fetchKycStatus).mockRejectedValue(new Error('network error'))

      renderAt()

      expect(await screen.findByText('Verificá tu identidad')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /volver a mi panel/i })).toBeInTheDocument()
    })
  })

  describe('inicio de verificación', () => {
    it('muestra el modal después de iniciar una verificación', async () => {
      vi.mocked(kycService.startKycVerification).mockResolvedValue({
        sessionUrl: 'https://verify.didit.me/session/sess-1',
        sessionId: 'sess-1',
      })

      const user = userEvent.setup()
      renderAt()
      await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))

      expect(await screen.findByTestId('didit-modal')).toBeInTheDocument()
      expect(kycService.startKycVerification).toHaveBeenCalledTimes(1)
      expect(window.location.href).not.toContain('verify.didit.me')
    })

    it('muestra el error de la API cuando falla el inicio', async () => {
      vi.mocked(kycService.startKycVerification).mockRejectedValue({
        response: { data: { error: 'Sin créditos disponibles' } },
      })

      const user = userEvent.setup()
      renderAt()
      await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))

      expect(await screen.findByText('Sin créditos disponibles')).toBeInTheDocument()
    })

    it('usa un error genérico cuando el inicio falla sin mensaje de API', async () => {
      vi.mocked(kycService.startKycVerification).mockRejectedValue(new Error('boom'))

      const user = userEvent.setup()
      renderAt()
      await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))

      expect(await screen.findByText('No se pudo iniciar la verificación')).toBeInTheDocument()
    })
  })

  describe('resultados', () => {
    it.each([
      ['APPROVED', 'Identidad validada', 'Aprobada'],
      ['DECLINED', 'No pudimos validar tu identidad', 'Rechazada'],
      ['EXPIRED', 'La verificación expiró', 'Recibida'],
      ['IN_REVIEW', 'Verificación en revisión', 'En revisión'],
    ] as const)('muestra el resultado %s', async (status, title, badge) => {
      vi.mocked(kycService.fetchKycStatus).mockResolvedValue(statusResponse(status))

      renderAt()

      expect(await screen.findByText(title)).toBeInTheDocument()
      expect(screen.getByText(badge)).toBeInTheDocument()
    })

    it('usa el copy y badge por defecto para un estado desconocido', async () => {
      vi.mocked(kycService.fetchKycStatus).mockResolvedValue(
        statusResponse('UNKNOWN' as KycStatus),
      )

      renderAt()

      expect(await screen.findByText('Verificación recibida')).toBeInTheDocument()
      expect(screen.getByText('Recibida')).toBeInTheDocument()
    })

    it('muestra un botón de reintento para DECLINED', async () => {
      vi.mocked(kycService.fetchKycStatus).mockResolvedValue(statusResponse('DECLINED'))

      renderAt()

      expect(await screen.findByRole('button', { name: /iniciar nueva verificación/i })).toBeInTheDocument()
    })

    it('muestra un botón de reintento para EXPIRED', async () => {
      vi.mocked(kycService.fetchKycStatus).mockResolvedValue(statusResponse('EXPIRED'))

      renderAt()

      expect(await screen.findByRole('button', { name: /iniciar nueva verificación/i })).toBeInTheDocument()
    })
  })

  describe('confirmación desde el modal', () => {
    it('confirma únicamente con sessionId y muestra el resultado', async () => {
      vi.mocked(kycService.startKycVerification).mockResolvedValue({
        sessionUrl: 'https://verify.didit.me/session/sess-modal',
        sessionId: 'sess-modal',
      })
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'APPROVED',
        sessionId: 'sess-modal',
      })

      const user = userEvent.setup()
      renderAt()
      await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))
      await user.click(screen.getByRole('button', { name: /completar verificación/i }))

      expect(kycService.confirmKycSession).toHaveBeenCalledWith('sess-modal')
      expect(await screen.findByText('Identidad validada')).toBeInTheDocument()
    })

    it('muestra el error cuando falla la confirmación', async () => {
      vi.mocked(kycService.startKycVerification).mockResolvedValue({
        sessionUrl: 'https://verify.didit.me/session/sess-modal',
        sessionId: 'sess-modal',
      })
      vi.mocked(kycService.confirmKycSession).mockRejectedValue({
        response: { data: { error: 'Sesión no encontrada' } },
      })

      const user = userEvent.setup()
      renderAt()
      await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))
      await user.click(screen.getByRole('button', { name: /completar verificación/i }))

      expect(await screen.findByText('Sesión no encontrada')).toBeInTheDocument()
    })
  })

  describe('polling', () => {
    it('consulta periódicamente un estado pendiente y se detiene al volver a NOT_STARTED', async () => {
      vi.useFakeTimers()
      vi.mocked(kycService.fetchKycStatus)
        .mockResolvedValueOnce(statusResponse('IN_REVIEW'))
        .mockResolvedValueOnce(statusResponse('NOT_STARTED'))

      renderAt()
      await act(async () => { await Promise.resolve() })
      expect(kycService.fetchKycStatus).toHaveBeenCalledTimes(1)

      await act(async () => {
        vi.advanceTimersByTime(10_000)
        await Promise.resolve()
      })
      expect(kycService.fetchKycStatus).toHaveBeenCalledTimes(2)
      expect(screen.getByText('Verificá tu identidad')).toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(10_000)
        await Promise.resolve()
      })
      expect(kycService.fetchKycStatus).toHaveBeenCalledTimes(2)
    })
  })
})
