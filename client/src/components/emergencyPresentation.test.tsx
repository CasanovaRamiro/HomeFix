import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TurnoCard from './dashboard/TurnoCard'
import PostCard from './post/PostCard'
import ApplicantCard from './post/ApplicantCard'
import type { UserPost } from '../services/posts'
import { PostStatus, type Post } from '../types/post'

const FUTURE = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
const PAST = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

const userPost = (overrides: Partial<UserPost> = {}): UserPost => ({
  id: 'post-1',
  title: 'Publicación de prueba',
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

const post = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  userId: 'client-1',
  title: 'Publicación de prueba',
  description: 'Descripción',
  startDate: '2026-10-24',
  endDate: '2026-10-25',
  address: 'Calle 123',
  status: PostStatus.Active,
  createdAt: '2026-10-20T12:00:00.000Z',
  images: [],
  latitude: null,
  longitude: null,
  isEmergency: false,
  emergencyExpiresAt: null,
  allowsSubcontracting: false,
  categories: [{ id: 'cat-1', name: 'Plomería' }],
  user: { id: 'client-1', name: 'Cliente', surname: 'Prueba' },
  clientRating: 0,
  ...overrides,
})

const renderTurno = (fixture: UserPost): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <TurnoCard post={fixture} />
    </MemoryRouter>,
  )

describe('TurnoCard', () => {
  it('muestra una urgencia vigente con su tiempo restante', () => {
    renderTurno(userPost({ isEmergency: true, emergencyExpiresAt: FUTURE }))

    expect(screen.getByText('Urgente')).toBeInTheDocument()
    expect(screen.getByText(/restantes/)).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('no presenta como activa una urgencia vencida sin contratación', () => {
    renderTurno(userPost({ isEmergency: true, emergencyExpiresAt: PAST }))

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('Vencida')).toBeInTheDocument()
    expect(screen.queryByText('Activa')).not.toBeInTheDocument()
    expect(screen.queryByText(/Trabajadores? postulados?/)).not.toBeInTheDocument()
  })

  it('conserva el estado en curso de una urgencia vencida con contrato', () => {
    renderTurno(userPost({
      title: 'Contrato en curso',
      status: PostStatus.InProgress,
      isEmergency: true,
      emergencyExpiresAt: PAST,
      worker: { id: 'worker-1', name: 'Trabajador' },
    }))

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
  })

  it('conserva el estado completado de una urgencia vencida', () => {
    renderTurno(userPost({
      title: 'Contrato completado',
      status: PostStatus.Completed,
      isEmergency: true,
      emergencyExpiresAt: PAST,
      worker: { id: 'worker-1', name: 'Trabajador' },
    }))

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('Completado')).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
  })
})

describe('PostCard', () => {
  it('oculta editar y pausar en una urgencia vencida sin contratación', () => {
    render(<PostCard post={post({ isEmergency: true, emergencyExpiresAt: PAST })} />)

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('No recibe nuevas contrataciones')).toBeInTheDocument()
    expect(screen.getByText('Vencida')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
  })

  it('mantiene las acciones contractuales de una urgencia vencida en curso', () => {
    render(
      <PostCard
        post={post({
          status: PostStatus.InProgress,
          isEmergency: true,
          emergencyExpiresAt: PAST,
        })}
        hasAcceptedWorker
      />,
    )

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar trabajo finalizado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar contratación' })).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
  })

  it('conserva el estado completado de una urgencia vencida', () => {
    render(
      <PostCard
        post={post({
          status: PostStatus.Completed,
          isEmergency: true,
          emergencyExpiresAt: PAST,
        })}
        hasAcceptedWorker
      />,
    )

    expect(screen.getByText('Urgencia vencida')).toBeInTheDocument()
    expect(screen.getByText('Completada')).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
  })
})

describe('ApplicantCard', () => {
  const applicant = {
    id: 'worker-1',
    name: 'Trabajador Prueba',
    photo: null,
    category: 'Plomería',
    address: 'Calle 123',
    rating: 4.5,
    reviewCount: 2,
    jobCount: 5,
    message: null,
    availableDays: [],
    availableTimeFrom: null,
    availableTimeTo: null,
    chargesVisit: false,
    visitCost: null,
    phone: null,
    hasReview: false,
  }

  const renderApplicant = (isEmergencyExpired: boolean): ReturnType<typeof render> =>
    render(
      <MemoryRouter>
        <ApplicantCard
          applicant={applicant}
          applicationId="application-1"
          applicationStatus="Pending"
          postStatus="Active"
          postTitle="Urgencia"
          isEmergency
          isEmergencyExpired={isEmergencyExpired}
        />
      </MemoryRouter>,
    )

  it('deshabilita la contratación de una urgencia vencida', () => {
    renderApplicant(true)

    expect(screen.getByRole('button', { name: 'Urgencia vencida' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument()
  })

  it('mantiene habilitada la contratación de una urgencia vigente', () => {
    renderApplicant(false)

    expect(screen.getByRole('button', { name: 'Contratar' })).toBeEnabled()
  })
})
