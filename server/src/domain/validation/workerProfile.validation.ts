import { createHttpError } from '../../lib/errors.js'
import type { UpdateWorkerInput } from '../types/worker.types.js'

function object(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw createHttpError(400, `${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createHttpError(400, `${field} must be a non-empty string`)
  }
  return value
}

function nullableText(value: unknown, field: string): string | null | undefined {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw createHttpError(400, `${field} must be a string or null`)
  }
  return value
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw createHttpError(400, `${field} must be an array`)
  return value
}

function allowedKeys(value: Record<string, unknown>, keys: string[], field: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw createHttpError(400, `${field}.${key} is not editable`)
  }
}

function certificates(value: unknown): NonNullable<UpdateWorkerInput['certificates']> {
  return array(value, 'certificates').map((item, index) => {
    const field = `certificates[${index}]`
    const entry = object(item, field)
    allowedKeys(entry, ['id', 'title', 'imageUrl', 'issuer'], field)
    return {
      id: text(entry.id, `${field}.id`),
      title: text(entry.title, `${field}.title`),
      imageUrl: text(entry.imageUrl, `${field}.imageUrl`),
      issuer: nullableText(entry.issuer, `${field}.issuer`),
    }
  })
}

function gallery(value: unknown): NonNullable<UpdateWorkerInput['gallery']> {
  return array(value, 'gallery').map((item, index) => {
    const field = `gallery[${index}]`
    const entry = object(item, field)
    allowedKeys(entry, ['id', 'imageUrl', 'caption'], field)
    return {
      id: text(entry.id, `${field}.id`),
      imageUrl: text(entry.imageUrl, `${field}.imageUrl`),
      caption: nullableText(entry.caption, `${field}.caption`),
    }
  })
}

// Construct a fresh DTO: TypeScript types alone cannot filter request JSON.
export function parseWorkerProfileUpdate(body: unknown): UpdateWorkerInput {
  const fields = object(body, 'Profile update')
  const input: UpdateWorkerInput = {}
  for (const [key, value] of Object.entries(fields)) {
    switch (key) {
      case 'name':
        if (value !== undefined) input.name = text(value, key)
        break
      case 'phone':
      case 'bio':
      case 'photo':
      case 'matriculaUrl':
        input[key] = nullableText(value, key)
        break
      case 'emergenciesEnabled':
        if (value !== undefined) {
          if (typeof value !== 'boolean') throw createHttpError(400, `${key} must be a boolean`)
          input.emergenciesEnabled = value
        }
        break
      case 'categoryIds':
      case 'availability':
        if (value !== undefined) {
          input[key] = array(value, key).map((item, index) => text(item, `${key}[${index}]`))
        }
        break
      case 'certificates':
        if (value !== undefined) input.certificates = certificates(value)
        break
      case 'gallery':
        if (value !== undefined) input.gallery = gallery(value)
        break
      default:
        throw createHttpError(400, `${key} is not editable`)
    }
  }
  return input
}
