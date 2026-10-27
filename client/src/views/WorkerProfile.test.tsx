import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { getWorker, getWorkerReviews, type Worker } from '../services/workers'
import WorkerProfile from './WorkerProfile'

vi.mock('../services/workers', () => ({ getWorker: vi.fn(), getWorkerReviews: vi.fn(), updateWorkerProfile: vi.fn() }))
vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn(), emitAuthChange: vi.fn() }))
vi.mock('../hooks/useCategories', () => ({ useCategories: (): { categories: { id: string; name: string }[] } => ({ categories: [{ id: 'cat-1', name: 'Electricidad' }] }) }))
vi.mock('../components/dashboard/TelegramLinkCard', () => ({ default: (): ReactElement => <div>Telegram</div> }))
vi.mock('../components/worker/WorkerActions', () => ({ default: (): null => null }))

const worker: Worker = {
  id: 'worker-1', name: 'Profesional Expo', email: 'expo@test.com', phone: null,
  bio: null, role: 'worker', photo: null, matriculaUrl: null, availability: [],
  createdAt: '2026-01-01T00:00:00.000Z', categories: [{ id: 'cat-1', name: 'Electricidad' }],
  emergenciesEnabled: false, certificates: [], gallery: [], location: null, isVerified: false,
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ user: { id: worker.id, name: worker.name, email: worker.email, role: 'worker' }, isLoggedIn: true } as ReturnType<typeof useAuth>)
  vi.mocked(getWorker).mockResolvedValue(worker)
  vi.mocked(getWorkerReviews).mockResolvedValue([])
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('WorkerProfile document actions', () => {
  it('keeps document labels and working profile, certificate and matrícula controls without dead buttons', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/worker/worker-1']}>
      <Routes><Route path="/worker/:id" element={<WorkerProfile />} /></Routes>
    </MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Documentos y Validaciones' })).toBeInTheDocument()
    expect(screen.getByText('Domicilio')).toBeInTheDocument()
    expect(screen.getByText('Antecedentes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar', exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cargar Antecedentes' })).not.toBeInTheDocument()
    expect(screen.getByText('Cargar Matrícula')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar Perfil' }))
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Título del certificado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir 0 certificado' })).toBeDisabled()
    expect(screen.getByText('Cargar Matrícula')).toBeInTheDocument()
  })
})
