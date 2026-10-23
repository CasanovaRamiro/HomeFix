import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UserRole } from '../types/user'
import KycVerify from './KycVerify'
import * as kycService from '../services/kyc'

vi.mock('../services/kyc', () => ({
  startKycVerification: vi.fn(),
  confirmKycSession: vi.fn(),
  fetchKycStatus: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com', role: UserRole.Worker },
    isLoggedIn: true,
  }),
}))

vi.mock('../components/DiditVerificationModal', () => ({
  default: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: (id: string, status: string) => void }) =>
    isOpen ? <button type="button" onClick={() => onComplete('sess-1', 'Approved')}>Completar Didit</button> : null,
}))

function renderKyc() {
  return render(<MemoryRouter><KycVerify /></MemoryRouter>)
}

describe('KycVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(kycService.fetchKycStatus).mockResolvedValue({
      kycStatus: 'NOT_STARTED', kycVerifiedAt: null, diditVerificationId: null,
    })
    vi.mocked(kycService.startKycVerification).mockResolvedValue({
      sessionId: 'sess-1', sessionUrl: 'https://verify.didit.me/session/sess-1',
    })
  })

  it('muestra el inicio tras consultar el estado', async () => {
    renderKyc()
    expect(await screen.findByRole('button', { name: /iniciar verificación/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a mi panel/i })).toBeInTheDocument()
  })

  it('confirma solo la sesión del modal y muestra el resultado del backend', async () => {
    vi.mocked(kycService.confirmKycSession).mockResolvedValue({ status: 'APPROVED', sessionId: 'sess-1' })
    const user = userEvent.setup()
    renderKyc()

    await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))
    await user.click(await screen.findByRole('button', { name: 'Completar Didit' }))

    expect(kycService.confirmKycSession).toHaveBeenCalledWith('sess-1')
    expect(await screen.findByText('Identidad validada')).toBeInTheDocument()
  })

  it('muestra el error de confirmación', async () => {
    vi.mocked(kycService.confirmKycSession).mockRejectedValue({ response: { data: { error: 'Sesión no encontrada' } } })
    const user = userEvent.setup()
    renderKyc()

    await user.click(await screen.findByRole('button', { name: /iniciar verificación/i }))
    await user.click(await screen.findByRole('button', { name: 'Completar Didit' }))

    expect(await screen.findByText('Sesión no encontrada')).toBeInTheDocument()
  })
})
