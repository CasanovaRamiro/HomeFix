import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockeamos el data layer — el service no debe tocar la BD
vi.mock('../../src/data/publication.data.js', () => ({
  findAvailableByCategory: vi.fn(),
  findAllAvailable: vi.fn(),
}))

import * as publicationData from '../../src/data/publication.data.js'
import { listAvailableByCategory, listAllAvailable } from '../../src/services/publication.service.js'


// Datos de prueba que simulan lo que devolvería la BD
const mockPublications: any[] = [
  {
    id: 1,
    description: 'Necesito instalar 6 spots LED en la cocina',
    date: new Date('2026-05-08'),
    status: 'disponible',
    fromStartJob: new Date('2026-05-15'),
    untilFinishJob: new Date('2026-05-15'),
    typePublication: 'Electricista',
    userId: 10,
    photo: 'https://res.cloudinary.com/dzj6dhn9e/image/upload/v1702054417/spot-led-1_ajlq8h.jpg'
  },
  {
    id: 2,
    description: 'El tablero salta cada vez que prendo el aire',
    date: new Date('2026-05-09'),
    status: 'disponible',
    fromStartJob: new Date('2026-05-10'),
    untilFinishJob: new Date('2026-05-10'),
    typePublication: 'Electricista',
    userId: 11,
    photo: 'https://res.cloudinary.com/dzj6dhn9e/image/upload/v1702054417/spot-led-2_ajlq8h.jpg'
    
  },
    {
    id: 3,
    description: 'Se tapo el inodoro',
    date: new Date('2026-07-12'),
    status: 'disponible',
    fromStartJob: new Date('2026-07-13'),
    untilFinishJob: new Date('2026-07-15'),
    typePublication: 'Plomero',
    userId: 11,
    photo: 'https://res.cloudinary.com/dzj6dhn9e/image/upload/v1702054417/spot-led-2_ajlq8h.jpg'
  },
   {
    id: 4,
    description: 'Se me quemo el motor del extractor de la cocina',
    date: new Date('2026-07-12'),
    status: 'pendiente',
    fromStartJob: new Date('2026-07-13'),
    untilFinishJob: new Date('2026-07-15'),
    typePublication: 'Electricista',
    userId: 11,
    photo: 'https://res.cloudinary.com/dzj6dhn9e/image/upload/v1702054417/spot-led-2_ajlq8h.jpg'
  },
]

describe('publication.service - listAvailableByCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns publications when the category has results', async () => {
   const mockElectricistas = mockPublications.filter(p => p.status === 'disponible' && p.typePublication === 'Electricista' )
    vi.mocked(publicationData.findAvailableByCategory).mockResolvedValue(mockElectricistas)

    const result = await listAvailableByCategory('Electricista')

    expect(result).toEqual(mockElectricistas)
    expect(result).toHaveLength(2) 
    expect(result[0].typePublication).toBe('Electricista')
  })



  it('returns an empty array when the category has no matches', async () => {
    vi.mocked(publicationData.findAvailableByCategory).mockResolvedValue([])

    const result = await listAvailableByCategory('Jardinero')

    expect(result).toHaveLength(0)
  })



  it('calls the data layer with the correct category', async () => {
    vi.mocked(publicationData.findAvailableByCategory).mockResolvedValue(mockPublications)

    await listAvailableByCategory('Plomero')

    expect(publicationData.findAvailableByCategory).toHaveBeenCalledWith('Plomero')
  })

  it('returns an empty array when no publications match the category', async () => {
    vi.mocked(publicationData.findAvailableByCategory).mockResolvedValue([])

    const result = await listAvailableByCategory('Carpintero')

    expect(result).toHaveLength(0)
  })

  it('throws if the category is empty', async () => {
    await expect(
      listAvailableByCategory('')
    ).rejects.toThrow('Category is required')
  })

})


describe('publication.service - listAllAvailable', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns all available publications', async () => {
    vi.mocked(publicationData.findAllAvailable).mockResolvedValue(mockPublications)
    const result = await listAllAvailable()
    expect(result).toEqual(mockPublications)
  })

})