import { createHttpError } from '../../lib/errors.js'

export const BUSINESS_HOURS_START = '08:00'
export const BUSINESS_HOURS_END = '22:00'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isAbsent = (value: unknown): boolean => value === undefined || value === null || value === ''

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10)

const parseTime = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw createHttpError(400, `${field} debe tener formato HH:mm`)
  }
  return value
}

const parseIsoDate = (value: string, field: string): Date => {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || toDateKey(date) !== value) {
    throw createHttpError(400, `${field} no es una fecha válida`)
  }
  return date
}

const assertDateWithinPostRange = (day: string, postStart: Date, postEnd: Date, field: string): void => {
  if (day < toDateKey(postStart) || day > toDateKey(postEnd)) {
    throw createHttpError(400, `${field} debe estar dentro del rango de la publicación`)
  }
}

export const validateAvailabilityWindow = (
  from: unknown,
  to: unknown,
  required = false,
): { availableTimeFrom: string | null; availableTimeTo: string | null } => {
  const hasFrom = !isAbsent(from)
  const hasTo = !isAbsent(to)

  if (!hasFrom && !hasTo) {
    if (required) throw createHttpError(400, 'El horario desde y hasta es obligatorio')
    return { availableTimeFrom: null, availableTimeTo: null }
  }

  if (hasFrom !== hasTo) {
    throw createHttpError(400, 'Debés indicar el horario desde y hasta juntos')
  }

  const availableTimeFrom = parseTime(from, 'El horario desde')
  const availableTimeTo = parseTime(to, 'El horario hasta')

  if (toMinutes(availableTimeFrom) >= toMinutes(availableTimeTo)) {
    throw createHttpError(400, 'El horario desde debe ser anterior al horario hasta')
  }

  if (
    toMinutes(availableTimeFrom) < toMinutes(BUSINESS_HOURS_START) ||
    toMinutes(availableTimeTo) > toMinutes(BUSINESS_HOURS_END)
  ) {
    throw createHttpError(
      400,
      `El horario debe estar entre las ${BUSINESS_HOURS_START} y las ${BUSINESS_HOURS_END}`,
    )
  }

  return { availableTimeFrom, availableTimeTo }
}

export const validateAvailableDays = (days: string[] | undefined, postStart: Date, postEnd: Date): void => {
  if (days === undefined || days.length === 0) return

  for (const day of days) {
    if (typeof day !== 'string' || day.trim() === '') {
      throw createHttpError(400, 'Los días de disponibilidad no son válidos')
    }

    // Legacy applications may store weekday labels; only ISO dates can be checked against the post range.
    if (!ISO_DATE_PATTERN.test(day)) continue

    parseIsoDate(day, 'El día de disponibilidad')
    assertDateWithinPostRange(day, postStart, postEnd, 'El día de disponibilidad')
  }
}

export const parseScheduledDate = (value: unknown): Date | null => {
  if (isAbsent(value)) return null

  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    throw createHttpError(400, 'La fecha de contratación debe tener formato YYYY-MM-DD')
  }

  return parseIsoDate(value, 'La fecha de contratación')
}

export const assertScheduledDateWithinPost = (
  scheduledDate: Date,
  postStart: Date,
  postEnd: Date,
): void => {
  assertDateWithinPostRange(toDateKey(scheduledDate), postStart, postEnd, 'La fecha de contratación')
}

export const parseAvailableDays = (raw: string | null | undefined): string[] => {
  if (raw === null || raw === undefined || raw === '') return []

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((day): day is string => typeof day === 'string') : []
  } catch {
    return []
  }
}

export const assertScheduledDateOffered = (
  scheduledDate: Date,
  availableDays: string | null | undefined,
): void => {
  const offeredDays = parseAvailableDays(availableDays).filter((day) => ISO_DATE_PATTERN.test(day))
  if (offeredDays.length === 0) return

  if (!offeredDays.includes(toDateKey(scheduledDate))) {
    throw createHttpError(400, 'La fecha de contratación debe ser uno de los días ofrecidos por el trabajador')
  }
}
