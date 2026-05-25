import type { NextFunction, Request, Response } from 'express'

export const TEST_CLAIMS = {
  sub: 'auth0|test123',
  email: 'test@test.com',
  name: 'Test User',
}

export const jwtCheck = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  ;(req as Request & { auth?: unknown }).auth = {
    header: { alg: 'RS256', typ: 'JWT' },
    token: 'test-auth0-token',
    payload: TEST_CLAIMS,
  }

  next()
}
