import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { UserRole } from '../../src/domain/types/userRole.js'

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    ;(req as Request & { auth?: unknown }).auth = {
      header: { alg: 'RS256', typ: 'JWT' },
      token: 'test-token',
      payload: { sub: 'auth0|test', email: 'test@test.com' },
    }
    next()
  },
}))

vi.mock('../../src/domain/services/auth.service.js', () => ({
  syncAuth0User: vi.fn(),
}))

vi.mock('../../src/domain/services/workerDashboard.service.js', () => ({
  getWorkerDashboard: vi.fn(),
}))

import { app } from '../../src/index.js'
import { syncAuth0User } from '../../src/domain/services/auth.service.js'
import { getWorkerDashboard } from '../../src/domain/services/workerDashboard.service.js'

describe('GET /worker-dashboard authorization', () => {
  it('returns 403 for a client', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'client-1', role: UserRole.Client } as never)

    const res = await request(app)
      .get('/worker-dashboard')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(403)
    expect(getWorkerDashboard).not.toHaveBeenCalled()
  })

  it('allows a worker to reach the dashboard service', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'worker-1', role: UserRole.Worker } as never)
    vi.mocked(getWorkerDashboard).mockResolvedValue({} as never)

    const res = await request(app)
      .get('/worker-dashboard')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(getWorkerDashboard).toHaveBeenCalledWith('worker-1')
  })
})
