import { describe, expect, it } from 'vitest'
import {
  assertScheduledDateOffered,
  assertScheduledDateWithinPost,
  parseScheduledDate,
  validateAvailabilityWindow,
  validateAvailableDays,
} from '../../src/domain/validation/applicationSchedule.validation.js'

const postStart = new Date('2030-01-01T00:00:00.000Z')
const postEnd = new Date('2030-02-01T00:00:00.000Z')

describe('validateAvailabilityWindow', () => {
  it('rechaza horarios con formato inválido', () => {
    for (const invalid of ['9:00', '24:00', '09:60', 'abc', ' 09:00']) {
      expect(() => validateAvailabilityWindow(invalid, '18:00', true)).toThrowError(
        expect.objectContaining({ status: 400 }),
      )
    }
  })

  it('rechaza que se envíe solo uno de los extremos', () => {
    expect(() => validateAvailabilityWindow('09:00', undefined, true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })

  it('rechaza horarios invertidos o de duración cero', () => {
    expect(() => validateAvailabilityWindow('18:00', '09:00', true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
    expect(() => validateAvailabilityWindow('09:00', '09:00', true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })

  it('rechaza horarios fuera de la ventana 08:00-22:00', () => {
    expect(() => validateAvailabilityWindow('07:59', '18:00', true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
    expect(() => validateAvailabilityWindow('09:00', '22:01', true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })

  it('acepta los límites exactos de la ventana', () => {
    expect(validateAvailabilityWindow('08:00', '22:00', true)).toEqual({
      availableTimeFrom: '08:00',
      availableTimeTo: '22:00',
    })
  })

  it('permite omitir la ventana cuando no es obligatoria', () => {
    expect(validateAvailabilityWindow(undefined, undefined)).toEqual({
      availableTimeFrom: null,
      availableTimeTo: null,
    })
  })

  it('exige la ventana cuando es obligatoria', () => {
    expect(() => validateAvailabilityWindow(undefined, undefined, true)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })
})

describe('validateAvailableDays', () => {
  it('acepta fechas ISO dentro del rango y etiquetas legadas', () => {
    expect(() => validateAvailableDays(['2030-01-01', '2030-02-01', 'Lunes'], postStart, postEnd)).not.toThrow()
  })

  it('rechaza fechas ISO imposibles', () => {
    expect(() => validateAvailableDays(['2030-02-30'], postStart, postEnd)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })

  it('rechaza fechas ISO fuera del rango de la publicación', () => {
    expect(() => validateAvailableDays(['2029-12-31'], postStart, postEnd)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
    expect(() => validateAvailableDays(['2030-02-02'], postStart, postEnd)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })

  it('rechaza entradas vacías', () => {
    expect(() => validateAvailableDays([''], postStart, postEnd)).toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })
})

describe('parseScheduledDate', () => {
  it('devuelve null cuando la fecha no se envía', () => {
    expect(parseScheduledDate(undefined)).toBeNull()
    expect(parseScheduledDate(null)).toBeNull()
    expect(parseScheduledDate('')).toBeNull()
  })

  it('rechaza formatos distintos de YYYY-MM-DD', () => {
    for (const invalid of ['31/12/2030', '2030-1-2', '2030-01-02T00:00:00.000Z', 20300102]) {
      expect(() => parseScheduledDate(invalid)).toThrowError(expect.objectContaining({ status: 400 }))
    }
  })

  it('rechaza fechas ISO imposibles', () => {
    expect(() => parseScheduledDate('2030-02-30')).toThrowError(expect.objectContaining({ status: 400 }))
  })

  it('normaliza una fecha válida a medianoche UTC', () => {
    expect(parseScheduledDate('2030-01-02')?.toISOString()).toBe('2030-01-02T00:00:00.000Z')
  })
})

describe('assertScheduledDateWithinPost', () => {
  it('acepta los límites del rango', () => {
    expect(() => assertScheduledDateWithinPost(new Date('2030-01-01T00:00:00.000Z'), postStart, postEnd)).not.toThrow()
    expect(() => assertScheduledDateWithinPost(new Date('2030-02-01T00:00:00.000Z'), postStart, postEnd)).not.toThrow()
  })

  it('rechaza una fecha fuera del rango', () => {
    expect(() =>
      assertScheduledDateWithinPost(new Date('2040-12-31T00:00:00.000Z'), postStart, postEnd),
    ).toThrowError(expect.objectContaining({ status: 400 }))
  })
})

describe('assertScheduledDateOffered', () => {
  it('exige que la fecha esté entre los días ISO ofrecidos', () => {
    const offered = JSON.stringify(['2030-01-02', '2030-01-03'])

    expect(() =>
      assertScheduledDateOffered(new Date('2030-01-02T00:00:00.000Z'), offered),
    ).not.toThrow()

    expect(() =>
      assertScheduledDateOffered(new Date('2030-01-04T00:00:00.000Z'), offered),
    ).toThrowError(expect.objectContaining({ status: 400 }))
  })

  it('no restringe cuando no hay fechas ISO ofrecidas', () => {
    expect(() =>
      assertScheduledDateOffered(new Date('2030-01-04T00:00:00.000Z'), JSON.stringify(['Lunes'])),
    ).not.toThrow()
    expect(() =>
      assertScheduledDateOffered(new Date('2030-01-04T00:00:00.000Z'), null),
    ).not.toThrow()
  })
})
