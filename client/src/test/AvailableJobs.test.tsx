import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Post } from '../types/post'

const { fetchAvailablePostsMock, searchPostsByLocationMock, applyToPostMock } = vi.hoisted(() => ({
  fetchAvailablePostsMock: vi.fn<(category?: string) => Promise<{ data: Post[] }>>(),
  searchPostsByLocationMock: vi.fn<() => Promise<{ data: Post[] }>>(),
  applyToPostMock: vi.fn<(postId: string) => Promise<{ data: { id: string; status: string; message: string } }>>(),
}))

const mockMap = {
  setView: vi.fn(),
  getZoom: vi.fn(() => 12),
  on: vi.fn(() => mockMap),
  off: vi.fn(() => mockMap),
}

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Circle: () => null,
  useMap: () => mockMap,
  useMapEvents: () => ({}),
}))

vi.mock('../services/posts', () => ({
  fetchAvailablePosts: fetchAvailablePostsMock,
  searchPostsByLocation: searchPostsByLocationMock,
}))

vi.mock('../services/applications', () => ({
  applyToPost: applyToPostMock,
}))

const { default: AvailableJobs } = await import('../views/AvailableJobs')

const posts: Post[] = [
  {
    id: '1',
    userId: '2',
    title: 'Cambiar canilla',
    description: 'Pierde agua en la cocina',
    startDate: '2026-05-25T10:00:00.000Z',
    endDate: '2026-05-25T12:00:00.000Z',
    address: 'Calle 123',
    status: 'Active',
    createdAt: '2026-05-20T10:00:00.000Z',
    images: [{ url: 'canilla.jpg' }],
    latitude: null,
    longitude: null,
    categories: [{ id: '1', name: 'Plomero' }],
    user: { id: '2', name: 'Cliente', surname: 'Apellido' },
  },
  {
    id: '2',
    userId: '3',
    title: 'Instalar termica',
    description: 'Tablero nuevo para departamento',
    startDate: '2026-05-24T10:00:00.000Z',
    endDate: '2026-05-24T12:00:00.000Z',
    address: 'Avenida 456',
    status: 'Active',
    createdAt: '2026-05-18T10:00:00.000Z',
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: '2', name: 'Electricista' }],
    user: { id: '3', name: 'Otro', surname: 'Cliente' },
  },
]

const renderAvailableJobs = (initialRoute = '/trabajador/trabajos'): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/trabajador/trabajos" element={<AvailableJobs />} />
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/worker/my-applications" element={<h1>Mis Postulaciones</h1>} />
      </Routes>
    </MemoryRouter>,
  )

describe('AvailableJobs', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    fetchAvailablePostsMock.mockResolvedValue({ data: posts })
    applyToPostMock.mockResolvedValue({ data: { id: 'app-1', status: 'Pending', message: 'OK' } })
  })

  it('loads and renders available jobs', async () => {
    renderAvailableJobs()

    expect(await screen.findByText('Cambiar canilla')).toBeTruthy()
    expect(screen.getByText('Instalar termica')).toBeTruthy()
    expect(fetchAvailablePostsMock).toHaveBeenCalledWith('')
  })

  it('filters rendered jobs by search text', async () => {
    const user = userEvent.setup()
    renderAvailableJobs()

    await screen.findByText('Cambiar canilla')
    await user.type(screen.getByRole('searchbox'), 'termica')

    expect(screen.queryByText('Cambiar canilla')).toBeNull()
    expect(screen.getByText('Instalar termica')).toBeTruthy()
  })

  it('reloads jobs when a category is selected', async () => {
    const user = userEvent.setup()
    renderAvailableJobs()

    await screen.findByText('Cambiar canilla')
    await user.selectOptions(screen.getByLabelText('Rubro'), 'Plomero')

    await waitFor(() => {
      expect(fetchAvailablePostsMock).toHaveBeenLastCalledWith('Plomero')
    })
    expect(localStorage.getItem('workerCategory')).toBe('Plomero')
  })

  it('calls the API and navigates to my-applications on submit', async () => {
    const user = userEvent.setup()
    renderAvailableJobs()

    await user.click(await screen.findByText('Cambiar canilla'))
    await user.click(screen.getByRole('button', { name: 'Postularme' }))
    await user.type(screen.getByLabelText(/Mensaje para el cliente/i), 'Tengo experiencia.')
    await user.click(screen.getByRole('button', { name: 'Enviar postulacion' }))

    expect(applyToPostMock).toHaveBeenCalledWith('1')
  })

  it('shows location filter button and opens modal on click', async () => {
    const user = userEvent.setup()
    renderAvailableJobs()

    await screen.findByText('Cambiar canilla')
    const btn = screen.getByRole('button', { name: /ubicación/i })
    expect(btn).toBeTruthy()

    await user.click(btn)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('redirects to login when the backend responds with 401', async () => {
    fetchAvailablePostsMock.mockRejectedValue({ response: { status: 401 } })

    renderAvailableJobs()

    expect(await screen.findByText('Login')).toBeTruthy()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
