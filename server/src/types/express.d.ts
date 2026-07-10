import 'express'

// Raw request body captured by the express.json `verify` hook, used for
// webhook signature verification.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: string
    }
  }
}
