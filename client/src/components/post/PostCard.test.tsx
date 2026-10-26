import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostCard from './PostCard'
import type { Post } from '../../types/post'

const post: Post = {
  id: 'post-1',
  userId: 'user-1',
  type: 'post',
  title: 'Trabajo de prueba',
  description: 'Descripción de prueba',
  startDate: '2026-10-25T00:00:00.000Z',
  endDate: '2026-10-26T00:00:00.000Z',
  address: 'Dirección de prueba',
  status: 'Active',
  createdAt: '2026-10-24T00:00:00.000Z',
  images: [],
  latitude: null,
  longitude: null,
  isEmergency: false,
  emergencyExpiresAt: null,
  allowsSubcontracting: false,
  categories: [{ id: 'post-category-1', categoryId: 'category-1', name: 'Electricidad' }],
  user: { id: 'user-1', name: 'Usuario', surname: 'Prueba' },
  clientRating: 0,
}

describe('PostCard subcontract controls', () => {
  it('renders children inside the card', () => {
    render(
      <PostCard post={post}>
        <div>Vacantes visibles</div>
      </PostCard>,
    )

    expect(screen.getByText('Vacantes visibles')).toBeInTheDocument()
  })

  it('shows and invokes the start action once for an active post with an accepted worker', async () => {
    const user = userEvent.setup()
    const onMarkInProgress = vi.fn()

    render(<PostCard post={post} hasAcceptedWorker onMarkInProgress={onMarkInProgress} />)

    await user.click(screen.getByRole('button', { name: 'Iniciar subcontratación' }))

    expect(onMarkInProgress).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['without an accepted worker', { hasAcceptedWorker: false, onMarkInProgress: vi.fn() }],
    ['without a callback', { hasAcceptedWorker: true }],
    ['when already in progress', { hasAcceptedWorker: true, onMarkInProgress: vi.fn(), post: { ...post, status: 'In progress' } }],
  ])('hides the start action %s', (_condition, props) => {
    render(<PostCard post={post} {...props} />)

    expect(screen.queryByRole('button', { name: 'Iniciar subcontratación' })).not.toBeInTheDocument()
  })

  it('keeps a normal card without children or lifecycle callback unchanged', () => {
    render(<PostCard post={post} />)

    expect(screen.getByText('Trabajo de prueba')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar subcontratación' })).not.toBeInTheDocument()
  })
})
