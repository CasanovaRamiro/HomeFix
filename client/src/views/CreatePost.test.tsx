import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CreatePost from './CreatePost'
import { fetchCategories, type Category } from '../services/categories'
import api from '../services/api'

vi.mock('../services/categories', () => ({ fetchCategories: vi.fn() }))
vi.mock('../services/api', () => ({ default: { post: vi.fn() } }))
vi.mock('../components/ui/AddressAutocomplete', () => ({ default: (): null => null }))

const response = (data: Category[]): Awaited<ReturnType<typeof fetchCategories>> =>
  ({ data }) as Awaited<ReturnType<typeof fetchCategories>>
const renderForm = (): ReturnType<typeof render> => render(<MemoryRouter><CreatePost /></MemoryRouter>)

beforeEach(() => vi.resetAllMocks())
afterEach(() => cleanup())

describe('CreatePost category availability', () => {
  it('explains an empty catalog and prevents publishing without categories', async () => {
    vi.mocked(fetchCategories).mockResolvedValue(response([]))
    renderForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay categorías disponibles')
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Publicar solicitud' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('explains a failed request and offers a retry', async () => {
    vi.mocked(fetchCategories).mockRejectedValue(new Error('Network error'))
    renderForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar')
    expect(screen.getByRole('button', { name: 'Publicar solicitud' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
  })

  it('loads real category IDs on retry without losing the entered title', async () => {
    vi.mocked(fetchCategories).mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([
      { id: 'electricity-id', name: 'Electricidad' },
      { id: 'plumbing-id', name: 'Plomería' },
    ]))
    const user = userEvent.setup()
    renderForm()
    await screen.findByRole('alert')
    const title = screen.getByPlaceholderText('Ej: Se rompió la canilla de la cocina')
    await user.type(title, 'Reparar instalación')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('option', { name: 'Plomería' })).toHaveValue('plumbing-id')
    const select = screen.getByRole('combobox', { name: 'Categoría' })
    await user.selectOptions(select, 'plumbing-id')
    expect(select).toHaveValue('plumbing-id')
    expect(title).toHaveValue('Reparar instalación')
    expect(screen.getByRole('button', { name: 'Publicar solicitud' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('disables the category select and publishing while loading', () => {
    vi.mocked(fetchCategories).mockReturnValue(new Promise(() => undefined))
    renderForm()

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Publicar solicitud' })).toBeDisabled()
  })
})
