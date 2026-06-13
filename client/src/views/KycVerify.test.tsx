import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import KycVerify from './KycVerify'
import * as kycService from '../services/kyc'

vi.mock('../services/kyc', () => ({
  startKycVerification: vi.fn(),
  confirmKycSession: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'worker' },
    isLoggedIn: true,
  }),
}))

vi.mock('../lib/envConfig', () => ({
  env: { VITE_API_URL: 'http://localhost:3000' },
}))

const originalLocation = window.location

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, href: '' },
    writable: true,
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  })
})

function renderAt(path: string) {
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
  })

  describe('vista inicial (sin query params)', () => {
    it('muestra el título y el botón de iniciar', () => {
      renderAt('/kyc')
      expect(screen.getByText('Verificá tu identidad')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /iniciar verificación/i }),
      ).toBeInTheDocument()
    })

    it('muestra el link para volver al panel', () => {
      renderAt('/kyc')
      expect(
        screen.getByRole('link', { name: /volver a mi panel/i }),
      ).toBeInTheDocument()
    })

    it('llama al servicio y redirige a la URL de Didit al click', async () => {
      vi.mocked(kycService.startKycVerification).mockResolvedValue({
        sessionUrl: 'https://verify.didit.me/session/sess-1',
        sessionId: 'sess-1',
      })

      const user = userEvent.setup()
      renderAt('/kyc')

      await user.click(
        screen.getByRole('button', { name: /iniciar verificación/i }),
      )

      await waitFor(() => {
        expect(window.location.href).toBe('https://verify.didit.me/session/sess-1')
      })
      expect(kycService.startKycVerification).toHaveBeenCalledTimes(1)
    })

    it('muestra mensaje de error cuando la API falla', async () => {
      vi.mocked(kycService.startKycVerification).mockRejectedValue({
        response: { data: { error: 'Sin créditos disponibles' } },
      })

      const user = userEvent.setup()
      renderAt('/kyc')

      await user.click(
        screen.getByRole('button', { name: /iniciar verificación/i }),
      )

      expect(await screen.findByText('Sin créditos disponibles')).toBeInTheDocument()
    })

    it('usa mensaje genérico cuando el error no tiene response.data.error', async () => {
      vi.mocked(kycService.startKycVerification).mockRejectedValue(new Error('boom'))

      const user = userEvent.setup()
      renderAt('/kyc')

      await user.click(
        screen.getByRole('button', { name: /iniciar verificación/i }),
      )

      expect(
        await screen.findByText('No se pudo iniciar la verificación'),
      ).toBeInTheDocument()
    })
  })

  describe('vista de resultado (volviendo de Didit)', () => {
    it('muestra pantalla de carga mientras confirma con el backend', async () => {
      vi.mocked(kycService.confirmKycSession).mockImplementation(
        () => new Promise(() => {}),
      )

      renderAt('/kyc?status=Approved&verificationSessionId=sess-1')

      expect(await screen.findByText('Confirmando tu verificación…')).toBeInTheDocument()
    })

    it('confirma con el backend y muestra el resultado', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'APPROVED',
        sessionId: 'sess-abc',
      })

      renderAt('/kyc?status=Approved&verificationSessionId=sess-abc')

      expect(await screen.findByText('Identidad validada')).toBeInTheDocument()
      expect(await screen.findByText('Aprobada')).toBeInTheDocument()
      expect(kycService.confirmKycSession).toHaveBeenCalledWith('sess-abc', 'test@test.com')
    })

    it('muestra el status mapeado desde el backend', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'APPROVED',
        sessionId: 'sess-abc',
      })

      renderAt('/kyc?status=In%20Review&verificationSessionId=sess-abc')

      expect(await screen.findByText('Identidad validada')).toBeInTheDocument()
    })

    it('muestra rechazo cuando el backend devuelve DECLINED', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'DECLINED',
        sessionId: 'sess-1',
      })

      renderAt('/kyc?status=Declined&verificationSessionId=sess-1')

      expect(await screen.findByText('No pudimos validar tu identidad')).toBeInTheDocument()
      expect(await screen.findByText('Rechazada')).toBeInTheDocument()
    })

    it('muestra expiración cuando el backend devuelve EXPIRED', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'EXPIRED',
        sessionId: 'sess-1',
      })

      renderAt('/kyc?status=Expired&verificationSessionId=sess-1')

      expect(await screen.findByText('La verificación expiró')).toBeInTheDocument()
    })

    it('muestra incompleto cuando el backend devuelve EXPIRED (antes Abandoned)', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'EXPIRED',
        sessionId: 'sess-1',
      })

      renderAt('/kyc?status=Abandoned&verificationSessionId=sess-1')

      expect(await screen.findByText('La verificación expiró')).toBeInTheDocument()
    })

    it('cae al copy default cuando el backend devuelve un status no mapeado', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'UNKNOWN',
        sessionId: 'sess-1',
      })

      renderAt('/kyc?status=Something&verificationSessionId=sess-1')

      expect(await screen.findByText('Verificación recibida')).toBeInTheDocument()
    })

    it('muestra el sessionId del query param', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'APPROVED',
        sessionId: 'sess-abc',
      })

      renderAt('/kyc?status=Approved&verificationSessionId=sess-xyz-999')

      expect(await screen.findByText(/sess-xyz-999/)).toBeInTheDocument()
    })

    it('muestra mensaje de error cuando falla la confirmación', async () => {
      vi.mocked(kycService.confirmKycSession).mockRejectedValue({
        response: { data: { error: 'Sesión no encontrada' } },
      })

      renderAt('/kyc?status=Approved&verificationSessionId=sess-1')

      expect(await screen.findByText('Sesión no encontrada')).toBeInTheDocument()
    })

    it('muestra el link para volver al panel', async () => {
      vi.mocked(kycService.confirmKycSession).mockResolvedValue({
        status: 'APPROVED',
        sessionId: 'sess-1',
      })

      renderAt('/kyc?status=Approved&verificationSessionId=sess-1')

      expect(
        await screen.findByRole('link', { name: /volver a mi panel/i }),
      ).toBeInTheDocument()
    })
  })
})
