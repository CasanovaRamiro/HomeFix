import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ClientDashboard from './ClientDashboard'
import { getUserPosts, type UserPost } from '../services/posts'
import { PostStatus } from '../types/post'

vi.mock('../services/posts', () => ({
  getUserPosts: vi.fn(),
}))

vi.mock('../components/dashboard/TelegramLinkCard', () => ({
  default: (): null => null,
}))

const FUTURE = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
const PAST = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

const userPost = (overrides: Partial<UserPost> = {}): UserPost => ({
  id: 'post-1',
  title: 'Publicación',
  description: 'Descripción',
  status: PostStatus.Active,
  createdAt: '2026-10-20T12:00:00.000Z',
  address: 'Calle 123',
  startDate: '2026-10-24',
  endDate: '2026-10-25',
  categories: [{ id: 'cat-1', name: 'Plomería' }],
  worker: null,
  applicantCount: 0,
  hasReview: false,
  isEmergency: false,
  emergencyExpiresAt: null,
  isBidding: false,
  ...overrides,
})

const posts: UserPost[] = [
  userPost({ id: 'normal-active', title: 'Normal activa' }),
  userPost({
    id: 'current-emergency',
    title: 'Urgencia vigente',
    isEmergency: true,
    emergencyExpiresAt: FUTURE,
  }),
  userPost({
    id: 'expired-active',
    title: 'Urgencia activa vencida',
    isEmergency: true,
    emergencyExpiresAt: PAST,
  }),
  userPost({
    id: 'expired-progress',
    title: 'Urgencia en curso vencida',
    status: PostStatus.InProgress,
    isEmergency: true,
    emergencyExpiresAt: PAST,
    worker: { id: 'worker-1', name: 'Trabajador' },
  }),
  userPost({
    id: 'expired-completed',
    title: 'Urgencia completada vencida',
    status: PostStatus.Completed,
    isEmergency: true,
    emergencyExpiresAt: PAST,
    worker: { id: 'worker-1', name: 'Trabajador' },
  }),
]

describe('ClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserPosts).mockResolvedValue(posts)
  })

  it('excluye urgencias vencidas de los contadores y las conserva en el historial', async () => {
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Normal activa')).toBeInTheDocument()
    expect(screen.getByText('Urgencia activa vencida')).toBeInTheDocument()
    expect(screen.getByText('Urgencia en curso vencida')).toBeInTheDocument()
    expect(screen.getByText('Urgencia completada vencida')).toBeInTheDocument()
    expect(screen.getAllByText('Urgencia vencida')).toHaveLength(3)
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText('Completado')).toBeInTheDocument()

    const activeStat = screen.getByText('Publicaciones activas').parentElement
    expect(activeStat).not.toBeNull()
    expect(within(activeStat!).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Urgentes \(1\)/ })).toBeInTheDocument()
  })

  it('filtra solo urgencias vigentes sin perder el historial al desactivar el filtro', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Normal activa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Urgentes \(1\)/ }))

    expect(screen.getByText('Urgencia vigente')).toBeInTheDocument()
    expect(screen.queryByText('Normal activa')).not.toBeInTheDocument()
    expect(screen.queryByText('Urgencia activa vencida')).not.toBeInTheDocument()
    expect(screen.queryByText('Urgencia en curso vencida')).not.toBeInTheDocument()
    expect(screen.queryByText('Urgencia vencida')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Urgentes \(1\)/ }))

    expect(await screen.findByText('Normal activa')).toBeInTheDocument()
    expect(screen.getByText('Urgencia activa vencida')).toBeInTheDocument()
    expect(screen.getByText('Urgencia en curso vencida')).toBeInTheDocument()
  })
})
