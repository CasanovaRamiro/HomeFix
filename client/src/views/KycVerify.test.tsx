import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import KycVerify from './KycVerify'
import * as kycService from '../services/kyc'

vi.mock('../services/kyc', () => ({
  startKycVerification: vi.fn(),
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
    it('muestra mensaje de éxito cuando status es Approved', () => {
      renderAt('/kyc?status=Approved&verificationSessionId=sess-1')
      expect(screen.getByText('Identidad validada')).toBeInTheDocument()
      expect(screen.getByText('Aprobada')).toBeInTheDocument()
    })

    it('muestra mensaje de revisión cuando status es In Review', () => {
      renderAt('/kyc?status=In%20Review&verificationSessionId=sess-1')
      expect(screen.getByText('Verificación en revisión')).toBeInTheDocument()
      expect(screen.getByText('En revisión')).toBeInTheDocument()
    })

    it('muestra mensaje de rechazo cuando status es Declined', () => {
      renderAt('/kyc?status=Declined&verificationSessionId=sess-1')
      expect(screen.getByText('No pudimos validar tu identidad')).toBeInTheDocument()
      expect(screen.getByText('Rechazada')).toBeInTheDocument()
    })

    it('muestra mensaje de expiración cuando status es Expired', () => {
      renderAt('/kyc?status=Expired&verificationSessionId=sess-1')
      expect(screen.getByText('La verificación expiró')).toBeInTheDocument()
    })

    it('muestra mensaje de incompleto cuando status es Abandoned', () => {
      renderAt('/kyc?status=Abandoned&verificationSessionId=sess-1')
      expect(screen.getByText('Verificación incompleta')).toBeInTheDocument()
    })

    it('cae al copy default cuando el status es desconocido', () => {
      renderAt('/kyc?status=Something%20Random&verificationSessionId=sess-1')
      expect(screen.getByText('Verificación recibida')).toBeInTheDocument()
      expect(screen.getByText('Recibida')).toBeInTheDocument()
    })

    it('cae al copy default cuando no hay status', () => {
      renderAt('/kyc?verificationSessionId=sess-1')
      expect(screen.getByText('Verificación recibida')).toBeInTheDocument()
    })

    it('renderiza el sessionId cuando está presente', () => {
      renderAt('/kyc?status=Approved&verificationSessionId=sess-abc-123')
      expect(screen.getByText(/sess-abc-123/)).toBeInTheDocument()
    })

    it('muestra el link para volver al panel', () => {
      renderAt('/kyc?status=Approved&verificationSessionId=sess-1')
      expect(
        screen.getByRole('link', { name: /volver a mi panel/i }),
      ).toBeInTheDocument()
    })
  })
})
