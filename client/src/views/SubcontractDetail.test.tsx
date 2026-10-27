import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SubcontractDetail from './SubcontractDetail'

const mocks = vi.hoisted(() => ({
  authUser: { id: 'owner-1' },
  detail: null as ReturnType<typeof createDetail> | null,
  getPostApplicants: vi.fn(),
}))

function createDetail() {
  return {
    id: 'group-1',
    userId: 'owner-1',
    type: 'subcontract',
    title: 'Subcontrato de prueba',
    description: 'Descripción de prueba',
    startDate: '2026-10-25T00:00:00.000Z',
    endDate: '2026-10-26T00:00:00.000Z',
    address: 'Dirección de prueba',
    status: 'Active',
    createdAt: '2026-10-24T00:00:00.000Z',
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      { id: 'position-1', categoryId: 'category-1', name: 'Electricidad', quantity: 2, filledCount: 1, roleDescription: 'Instalación' },
      { id: 'position-2', categoryId: 'category-2', name: 'Pintura', quantity: 1, filledCount: 1, roleDescription: 'Terminaciones' },
    ],
    user: { id: 'owner-1', name: 'Dueño', surname: 'Prueba' },
    clientRating: 0,
    postIds: ['post-1'],
  }
}

vi.mock('../hooks/useSubcontractDetail', () => ({
  useSubcontractDetail: () => ({ subcontract: mocks.detail, loading: false, error: '', refetch: vi.fn() }),
  useSubcontractGroupDetail: () => ({ subcontract: mocks.detail, loading: false, error: '', refetch: vi.fn() }),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.authUser }),
}))

vi.mock('../services/applications', () => ({
  applyToSubcontract: vi.fn(),
  getPostApplicants: mocks.getPostApplicants,
}))

vi.mock('../components/post/PostCard', () => ({
  default: ({ children, onMarkInProgress }: { children?: React.ReactNode; onMarkInProgress?: () => void }) => (
    <div data-testid="post-card" data-can-start={String(Boolean(onMarkInProgress))}>{children}</div>
  ),
}))

vi.mock('../components/post/ApplicantCard', () => ({ default: () => null }))
vi.mock('../components/ui/ConfirmModal', () => ({ default: () => null }))

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/worker/subcontracts/group/group-1']}>
      <Routes>
        <Route path="/worker/subcontracts/group/:id" element={<SubcontractDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SubcontractDetail controls', () => {
  beforeEach(() => {
    mocks.detail = createDetail()
    mocks.authUser = { id: 'owner-1' }
    mocks.getPostApplicants.mockReset()
    mocks.getPostApplicants.mockResolvedValue({ data: [{ applicationId: 'application-1', status: 'Accepted' }] })
  })

  it('shows available and complete vacancy categories', async () => {
    renderDetail()

    expect(screen.getByText('1 disponible')).toBeInTheDocument()
    expect(screen.getByText('1 vacante')).toBeInTheDocument()
    expect(screen.getByText('Completo')).toBeInTheDocument()
  })

  it('passes the start action only to the owner', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('post-card')).toHaveAttribute('data-can-start', 'true'))

    mocks.authUser = { id: 'other-user' }
    renderDetail()
    await waitFor(() => expect(screen.getAllByTestId('post-card').at(-1)).toHaveAttribute('data-can-start', 'false'))
  })
})
