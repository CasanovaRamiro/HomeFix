import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../components/Navbar'
import { emitAuthChange, useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Users from './Users'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))

const storedUser = { id: 'client-1', name: 'Cliente Expo', email: 'cliente@demo.test', role: 'client' }

function AuthStatus() {
  const { user, isLoggedIn } = useAuth()
  return <p>Sesión: {isLoggedIn ? user?.name : 'invitado'}</p>
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(api.get).mockResolvedValue({ data: [] })
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify(storedUser))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('Users logout', () => {
  it('clears the shared session, hides authenticated navigation, and keeps login state updates working', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/users']}>
        <Navbar />
        <Routes>
          <Route path="/users" element={<><Users /><AuthStatus /></>} />
          <Route path="/login" element={<><p>Inicio de sesión</p><AuthStatus /><Link to="/">Ir al inicio</Link></>} />
          <Route path="/" element={<AuthStatus />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Sesión: Cliente Expo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cliente Expo/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(screen.getByText('Inicio de sesión')).toBeInTheDocument()
    expect(screen.getByText('Sesión: invitado')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()

    await user.click(screen.getByRole('link', { name: 'Ir al inicio' }))
    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cliente Expo/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mi Perfil' })).not.toBeInTheDocument()

    localStorage.setItem('token', 'new-test-token')
    localStorage.setItem('user', JSON.stringify(storedUser))
    act(() => emitAuthChange())
    expect(screen.getByText('Sesión: Cliente Expo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cliente Expo/ })).toBeInTheDocument()
  })
})
