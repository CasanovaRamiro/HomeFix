import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Post } from '../types/post'

const fetchAvailablePostsMock = jest.fn<(category?: string) => Promise<{ data: Post[] }>>()

jest.unstable_mockModule('../services/posts', () => ({
  fetchAvailablePosts: fetchAvailablePostsMock,
}))

const { default: Trabajos } = await import('../views/Trabajos')

const posts: Post[] = [
  {
    id: 1,
    userId: 2,
    title: 'Cambiar canilla',
    description: 'Pierde agua en la cocina',
    startDate: '2026-05-25T10:00:00.000Z',
    endDate: '2026-05-25T12:00:00.000Z',
    address: 'Calle 123',
    status: 'Active',
    createdAt: '2026-05-20T10:00:00.000Z',
    image: 'canilla.jpg',
    categories: [{ category: { id: 1, name: 'Plomero' } }],
  },
  {
    id: 2,
    userId: 3,
    title: 'Instalar termica',
    description: 'Tablero nuevo para departamento',
    startDate: '2026-05-24T10:00:00.000Z',
    endDate: '2026-05-24T12:00:00.000Z',
    address: 'Avenida 456',
    status: 'Active',
    createdAt: '2026-05-18T10:00:00.000Z',
    image: '',
    categories: [{ category: { id: 2, name: 'Electricista' } }],
  },
]

const renderTrabajos = (initialRoute = '/trabajador/trabajos'): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/trabajador/trabajos" element={<Trabajos />} />
        <Route path="/login" element={<h1>Login</h1>} />
      </Routes>
    </MemoryRouter>,
  )

describe('Trabajos', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    fetchAvailablePostsMock.mockResolvedValue({ data: posts })
  })

  it('loads and renders available jobs', async () => {
    renderTrabajos()

    expect(await screen.findByText('Cambiar canilla')).toBeTruthy()
    expect(screen.getByText('Instalar termica')).toBeTruthy()
    expect(fetchAvailablePostsMock).toHaveBeenCalledWith('')
  })

  it('filters rendered jobs by search text', async () => {
    const user = userEvent.setup()
    renderTrabajos()

    await screen.findByText('Cambiar canilla')
    await user.type(screen.getByRole('searchbox'), 'termica')

    expect(screen.queryByText('Cambiar canilla')).toBeNull()
    expect(screen.getByText('Instalar termica')).toBeTruthy()
  })

  it('reloads jobs when a category chip is selected', async () => {
    const user = userEvent.setup()
    renderTrabajos()

    await screen.findByText('Cambiar canilla')
    await user.click(screen.getByRole('button', { name: 'Plomero' }))

    await waitFor(() => {
      expect(fetchAvailablePostsMock).toHaveBeenLastCalledWith('Plomero')
    })
    expect(localStorage.getItem('workerCategory')).toBe('Plomero')
  })

  it('stores an application in localStorage from the detail modal', async () => {
    const user = userEvent.setup()
    renderTrabajos()

    await user.click(await screen.findByText('Cambiar canilla'))
    await user.click(screen.getByRole('button', { name: 'Postularme' }))
    await user.type(screen.getByLabelText(/Mensaje para el cliente/i), 'Tengo experiencia.')
    await user.click(screen.getByRole('button', { name: 'Enviar postulacion' }))

    const stored = JSON.parse(localStorage.getItem('homefix_postulaciones_trabajador') ?? '[]') as [
      { trabajoId: number; mensaje: string },
    ]
    expect(stored[0]).toEqual(
      expect.objectContaining({
        trabajoId: 1,
        mensaje: 'Tengo experiencia.',
      }),
    )
    expect(screen.getByText('Postulacion enviada')).toBeTruthy()
  })

  it('redirects to login when the backend responds with 401', async () => {
    fetchAvailablePostsMock.mockRejectedValue({ response: { status: 401 } })

    renderTrabajos()

    expect(await screen.findByText('Login')).toBeTruthy()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
