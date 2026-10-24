import { describe, expect, it } from 'vitest'
import { PostStatus } from '../types/post'
import {
  countActivePublications,
  countCurrentEmergencies,
  filterCurrentEmergencies,
  isAvailablePublication,
  isCurrentEmergency,
} from './clientDashboard'

interface FixturePost {
  id: string
  status: PostStatus
  isEmergency: boolean
  emergencyExpiresAt: string | null
}

const NOW = new Date('2026-10-23T12:00:00.000Z')
const FUTURE = '2026-10-23T14:00:00.000Z'
const PAST = '2026-10-23T10:00:00.000Z'

const post = (overrides: Partial<FixturePost> = {}): FixturePost => ({
  id: 'post-1',
  status: PostStatus.Active,
  isEmergency: false,
  emergencyExpiresAt: null,
  ...overrides,
})

describe('contadores del dashboard', () => {
  it('excluye urgencias vencidas de las publicaciones activas', () => {
    const posts = [
      post({ id: 'active' }),
      post({ id: 'current-emergency', isEmergency: true, emergencyExpiresAt: FUTURE }),
      post({ id: 'expired-emergency', isEmergency: true, emergencyExpiresAt: PAST }),
      post({ id: 'expired-progress', status: PostStatus.InProgress, isEmergency: true, emergencyExpiresAt: PAST }),
      post({ id: 'in-progress', status: PostStatus.InProgress }),
      post({ id: 'paused', status: PostStatus.Paused }),
      post({ id: 'completed', status: PostStatus.Completed }),
    ]

    expect(countActivePublications(posts, NOW)).toBe(4)
  })

  it('solo cuenta urgencias vigentes y no cerradas', () => {
    const posts = [
      post({ id: 'current-active', isEmergency: true, emergencyExpiresAt: FUTURE }),
      post({ id: 'current-paused', status: PostStatus.Paused, isEmergency: true, emergencyExpiresAt: FUTURE }),
      post({ id: 'expired-active', isEmergency: true, emergencyExpiresAt: PAST }),
      post({ id: 'expired-progress', status: PostStatus.InProgress, isEmergency: true, emergencyExpiresAt: PAST }),
      post({ id: 'completed', status: PostStatus.Completed, isEmergency: true, emergencyExpiresAt: FUTURE }),
      post({ id: 'cancelled', status: PostStatus.Cancelled, isEmergency: true, emergencyExpiresAt: FUTURE }),
    ]

    expect(countCurrentEmergencies(posts, NOW)).toBe(2)
  })
})

describe('filtros del dashboard', () => {
  it('filtra solo urgencias vigentes y conserva el resto del historial fuera del filtro', () => {
    const current = post({ id: 'current', isEmergency: true, emergencyExpiresAt: FUTURE })
    const expiredActive = post({ id: 'expired-active', isEmergency: true, emergencyExpiresAt: PAST })
    const expiredProgress = post({
      id: 'expired-progress',
      status: PostStatus.InProgress,
      isEmergency: true,
      emergencyExpiresAt: PAST,
    })
    const normal = post({ id: 'normal' })

    expect(filterCurrentEmergencies([current, expiredActive, expiredProgress, normal], NOW)).toEqual([current])
    expect(isAvailablePublication(expiredActive, NOW)).toBe(false)
    expect(isCurrentEmergency(expiredProgress, NOW)).toBe(false)
  })
})
