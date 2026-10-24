import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterWorker from './RegisterWorker'
import { fetchCategories, type Category } from '../services/categories'
import { registerWorker } from '../services/auth'

vi.mock('../services/categories', () => ({ fetchCategories: vi.fn() }))
vi.mock('../services/auth', () => ({ registerWorker: vi.fn(), login: vi.fn() }))
vi.mock('../services/kyc', () => ({ startKycVerification: vi.fn(), confirmKycSession: vi.fn() }))
vi.mock('../components/DiditVerificationModal', () => ({ default: (): null => null }))

const catalog = [{ id: 'category-1', name: 'Electricidad' }]

function response(data: Category[]): Awaited<ReturnType<typeof fetchCategories>> {
  return { data } as Awaited<ReturnType<typeof fetchCategories>>
}

async function openSpecialties(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup()
  render(<MemoryRouter><RegisterWorker /></MemoryRouter>)
  await user.type(screen.getByPlaceholderText('Carlos'), 'Ana')
  await user.type(screen.getByPlaceholderText('Rodríguez'), 'Pérez')
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com')
  await user.type(screen.getByPlaceholderText('+54 11 1234-5678'), '1112345678')
  await user.type(screen.getByPlaceholderText('Mín 8 caracteres'), 'Secure123!')
  await user.type(screen.getByPlaceholderText('Repite tu contraseña'), 'Secure123!')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(screen.getByRole('heading', { name: 'Selecciona tus especialidades' })).toBeInTheDocument()
  return user
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => cleanup())

describe('RegisterWorker category catalog', () => {
  it('explains an empty catalog and disables progression', async () => {
    vi.mocked(fetchCategories).mockResolvedValue(response([]))
    await openSpecialties()

    expect(screen.getByRole('alert')).toHaveTextContent('Todavía no hay especialidades disponibles')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    expect(registerWorker).not.toHaveBeenCalled()
  })

  it('explains a failed request and lets the user retry without losing their form', async () => {
    vi.mocked(fetchCategories).mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(response(catalog))
    const user = await openSpecialties()

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar las especialidades')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await user.click(await screen.findByRole('button', { name: /Electricidad/ }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetchCategories).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByPlaceholderText('tu@email.com')).toHaveValue('ana@example.com')
    expect(screen.getByPlaceholderText('Carlos')).toHaveValue('Ana')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Elige tu método de verificación' })).toBeInTheDocument()
  })

  it('recovers from an empty catalog when categories become available', async () => {
    vi.mocked(fetchCategories).mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(catalog))
    const user = await openSpecialties()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await user.click(await screen.findByRole('button', { name: /Electricidad/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Elige tu método de verificación' })).toBeInTheDocument()
    expect(registerWorker).not.toHaveBeenCalled()
  })

  it('shows loading and prevents progression while the catalog is pending', async () => {
    vi.mocked(fetchCategories).mockImplementation(() => new Promise(() => undefined))
    await openSpecialties()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando categorías')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks for a selection and allows progression after selecting a category', async () => {
    vi.mocked(fetchCategories).mockResolvedValue(response(catalog))
    const user = await openSpecialties()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Seleccioná al menos una especialidad')
    await user.click(screen.getByRole('button', { name: /Electricidad/ }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Elige tu método de verificación' })).toBeInTheDocument()
  })
})
