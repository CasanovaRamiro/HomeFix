import { describe, expect, it } from 'vitest'
import { postServiceValidator, type PostInput } from '../../src/middleware/postServiceValidator.js'

const validInput: PostInput = {
  startDate: '2026-06-01T10:00:00Z',
  endDate: '2026-06-01T12:00:00Z',
  categoryId: 1,
  title: 'Arreglar canilla',
  description: 'Cambiar junta de la canilla de la cocina',
  address: 'Calle Falsa 123',
}

describe('postServiceValidator', () => {
  it('passes with valid input', () => {
    expect(() => postServiceValidator(validInput)).not.toThrow()
  })

  it('throws when categoryId is missing', () => {
    expect(() => postServiceValidator({ ...validInput, categoryId: 0 })).toThrow('At least one category must be selected')
  })

  it('throws when title is empty', () => {
    expect(() => postServiceValidator({ ...validInput, title: '' })).toThrow('title is required')
  })

  it('throws when title is only whitespace', () => {
    expect(() => postServiceValidator({ ...validInput, title: '   ' })).toThrow('title is required')
  })

  it('throws when description is empty', () => {
    expect(() => postServiceValidator({ ...validInput, description: '' })).toThrow('description is required')
  })

  it('throws when description is only whitespace', () => {
    expect(() => postServiceValidator({ ...validInput, description: '   ' })).toThrow('description is required')
  })

  it('throws when address is empty', () => {
    expect(() => postServiceValidator({ ...validInput, address: '' })).toThrow('address is required')
  })

  it('throws when address is only whitespace', () => {
    expect(() => postServiceValidator({ ...validInput, address: '   ' })).toThrow('address is required')
  })

  it('throws when endDate equals startDate', () => {
    expect(() => postServiceValidator({ ...validInput, startDate: '2026-06-01T10:00:00Z', endDate: '2026-06-01T10:00:00Z' })).toThrow('endDate must be after startDate')
  })

  it('throws when endDate is before startDate', () => {
    expect(() => postServiceValidator({ ...validInput, startDate: '2026-06-01T12:00:00Z', endDate: '2026-06-01T10:00:00Z' })).toThrow('endDate must be after startDate')
  })
})
