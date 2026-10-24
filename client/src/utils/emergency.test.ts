import { describe, expect, it } from 'vitest'
import { getEmergencyTimeLeft, isEmergencyPost, isExpiredEmergency } from './emergency'

const NOW = new Date('2026-10-23T12:00:00.000Z')
const FUTURE = '2026-10-23T14:30:00.000Z'
const PAST = '2026-10-23T10:00:00.000Z'

describe('isEmergencyPost', () => {
  it('detecta urgencias por flag o por tipo', () => {
    expect(isEmergencyPost({ isEmergency: true })).toBe(true)
    expect(isEmergencyPost({ type: 'emergency' })).toBe(true)
    expect(isEmergencyPost({ isEmergency: false, type: 'standard' })).toBe(false)
  })
})

describe('isExpiredEmergency', () => {
  it('considera vencida una urgencia sin fecha o con fecha pasada', () => {
    expect(isExpiredEmergency({ isEmergency: true, emergencyExpiresAt: null }, NOW)).toBe(true)
    expect(isExpiredEmergency({ isEmergency: true, emergencyExpiresAt: PAST }, NOW)).toBe(true)
  })

  it('no considera vencida una urgencia con fecha futura', () => {
    expect(isExpiredEmergency({ isEmergency: true, emergencyExpiresAt: FUTURE }, NOW)).toBe(false)
  })

  it('no marca vencidas las publicaciones normales', () => {
    expect(isExpiredEmergency({ isEmergency: false, emergencyExpiresAt: PAST }, NOW)).toBe(false)
    expect(isExpiredEmergency({}, NOW)).toBe(false)
  })
})

describe('getEmergencyTimeLeft', () => {
  it('formatea el tiempo restante', () => {
    expect(getEmergencyTimeLeft(FUTURE, NOW)).toBe('2h 30m restantes')
  })

  it('devuelve null cuando ya venció o no tiene fecha', () => {
    expect(getEmergencyTimeLeft(PAST, NOW)).toBeNull()
    expect(getEmergencyTimeLeft(null, NOW)).toBeNull()
  })
})
